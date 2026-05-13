'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { FechamentoEtapaStatus, TarefaTipo, TarefaStatus, Role } from '@prisma/client'
import { ETAPAS_DEF } from '@/lib/fechamento-config'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FechamentoData = {
  id: string
  jornadaId: string
  etapaAtual: number
  concluido: boolean
  etapas: {
    id: string
    numero: number
    status: FechamentoEtapaStatus
    dados: Record<string, string>
    concluidaEm: string | null
  }[]
}

export type FechamentoActionState = { error?: string; success?: boolean } | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

async function getJornadaInfo(jornadaId: string) {
  return prisma.estudanteJornada.findUnique({
    where: { id: jornadaId },
    select: {
      lead: { select: { id: true, nome: true, consultorId: true } },
      escola: { select: { nome: true } },
    },
  })
}

// ─── getOrCreateFechamento ────────────────────────────────────────────────────

export async function getOrCreateFechamento(jornadaId: string): Promise<FechamentoData> {
  let fechamento = await prisma.fechamentoMatricula.findUnique({
    where: { jornadaId },
    include: { etapas: { orderBy: { numero: 'asc' } } },
  })

  if (!fechamento) {
    fechamento = await prisma.fechamentoMatricula.create({
      data: { jornadaId },
      include: { etapas: { orderBy: { numero: 'asc' } } },
    })
  }

  return {
    id: fechamento.id,
    jornadaId: fechamento.jornadaId,
    etapaAtual: fechamento.etapaAtual,
    concluido: fechamento.concluido,
    etapas: fechamento.etapas.map((e) => ({
      id: e.id,
      numero: e.numero,
      status: e.status,
      dados: (e.dados as Record<string, string>) ?? {},
      concluidaEm: e.concluidaEm?.toISOString() ?? null,
    })),
  }
}

// ─── concluirEtapa ────────────────────────────────────────────────────────────

export async function concluirEtapa(
  _prev: FechamentoActionState,
  formData: FormData,
): Promise<FechamentoActionState> {
  try {
    const userId = await getCurrentUserId()
    const fechamentoId = formData.get('fechamentoId') as string
    const numero = Number(formData.get('numero'))

    if (!fechamentoId || !numero) return { error: 'Dados inválidos.' }

    const fechamento = await prisma.fechamentoMatricula.findUniqueOrThrow({
      where: { id: fechamentoId },
    })

    if (fechamento.etapaAtual !== numero) {
      return { error: 'Esta etapa não é a etapa atual.' }
    }

    const etapaDef = ETAPAS_DEF.find((e) => e.numero === numero)
    if (!etapaDef) return { error: 'Etapa não encontrada.' }

    const dados: Record<string, string> = {}
    for (const campo of etapaDef.campos) {
      const val = formData.get(campo.name) as string | null
      if (campo.required && !val?.trim()) {
        return { error: `Campo "${campo.label}" é obrigatório.` }
      }
      if (val) dados[campo.name] = val
    }

    const isFinal = numero === ETAPAS_DEF.length
    const nextNumero = isFinal ? numero : numero + 1
    const nextDef = ETAPAS_DEF.find((e) => e.numero === nextNumero)

    await prisma.$transaction([
      prisma.fechamentoEtapa.upsert({
        where: { fechamentoId_numero: { fechamentoId, numero } },
        create: {
          fechamentoId,
          numero,
          status: FechamentoEtapaStatus.CONCLUIDO,
          dados,
          concluidaEm: new Date(),
          concluidaPor: userId,
        },
        update: {
          status: FechamentoEtapaStatus.CONCLUIDO,
          dados,
          concluidaEm: new Date(),
          concluidaPor: userId,
        },
      }),
      prisma.fechamentoMatricula.update({
        where: { id: fechamentoId },
        data: {
          etapaAtual: isFinal ? numero : nextNumero,
          concluido: isFinal,
        },
      }),
    ])

    const jornadaInfo = await getJornadaInfo(fechamento.jornadaId)
    if (jornadaInfo) {
      const leadId = jornadaInfo.lead.id

      // Se o passo atual era do FINANCEIRO → fechar as tarefas de fechamento pendentes do lead
      if (etapaDef.role === 'FINANCEIRO') {
        await prisma.tarefa.updateMany({
          where: { leadId, tipo: TarefaTipo.FECHAMENTO, status: TarefaStatus.PENDENTE },
          data: { status: TarefaStatus.CONCLUIDA, concluidaEm: new Date() },
        })
      }

      // Se o próximo passo é do FINANCEIRO → criar tarefas para todos os FINANCEIRO ativos
      if (!isFinal && nextDef?.role === 'FINANCEIRO') {
        const financeiros = await prisma.user.findMany({
          where: { role: Role.FINANCEIRO, ativo: true },
          select: { id: true },
        })

        if (financeiros.length > 0) {
          const prazo = new Date()
          prazo.setDate(prazo.getDate() + 1)

          await prisma.tarefa.createMany({
            data: financeiros.map((f) => ({
              leadId,
              responsavelId: f.id,
              titulo: `${nextDef.titulo} — ${jornadaInfo.lead.nome}`,
              descricao: `${nextDef.descricao}\n\nEscola: ${jornadaInfo.escola.nome}`,
              tipo: TarefaTipo.FECHAMENTO,
              prazo,
            })),
          })
        }
      }
    }

    revalidatePath(`/jornada/${fechamento.jornadaId}/fechamento`)
    revalidatePath('/tarefas')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Erro ao concluir etapa. Tente novamente.' }
  }
}

// ─── devolverEtapa ────────────────────────────────────────────────────────────

export async function devolverEtapa(
  _prev: FechamentoActionState,
  formData: FormData,
): Promise<FechamentoActionState> {
  try {
    const fechamentoId = formData.get('fechamentoId') as string
    const numero = Number(formData.get('numero'))
    const motivo = (formData.get('motivo') as string | null)?.trim()
    const devolveParaNumero = Number(formData.get('devolveParaNumero'))

    if (!fechamentoId || !numero || !devolveParaNumero) return { error: 'Dados inválidos.' }
    if (!motivo) return { error: 'Informe o motivo da devolução.' }

    const etapaDef = ETAPAS_DEF.find((e) => e.numero === numero)
    if (!etapaDef?.podeDevolver) return { error: 'Esta etapa não permite devolução.' }

    const devolveParaDef = ETAPAS_DEF.find((e) => e.numero === devolveParaNumero)

    const fechamento = await prisma.fechamentoMatricula.findUniqueOrThrow({
      where: { id: fechamentoId },
    })

    await prisma.$transaction([
      prisma.fechamentoEtapa.upsert({
        where: { fechamentoId_numero: { fechamentoId, numero } },
        create: { fechamentoId, numero, status: FechamentoEtapaStatus.DEVOLVIDO, dados: { motivo } },
        update: { status: FechamentoEtapaStatus.DEVOLVIDO, dados: { motivo } },
      }),
      prisma.fechamentoEtapa.deleteMany({
        where: { fechamentoId, numero: { gte: devolveParaNumero } },
      }),
      prisma.fechamentoMatricula.update({
        where: { id: fechamentoId },
        data: { etapaAtual: devolveParaNumero, concluido: false },
      }),
    ])

    // Tratar tarefas pós-devolução
    const jornadaInfo = await getJornadaInfo(fechamento.jornadaId)
    if (jornadaInfo && etapaDef.role === 'FINANCEIRO') {
      const leadId = jornadaInfo.lead.id

      // Cancelar tarefas de fechamento pendentes do lead
      await prisma.tarefa.updateMany({
        where: { leadId, tipo: TarefaTipo.FECHAMENTO, status: TarefaStatus.PENDENTE },
        data: { status: TarefaStatus.CANCELADA },
      })

      // Criar FOLLOWUP para o consultor responsável
      if (devolveParaDef?.role === 'CONSULTOR' && jornadaInfo.lead.consultorId) {
        const prazo = new Date()
        prazo.setDate(prazo.getDate() + 1)

        await prisma.tarefa.create({
          data: {
            leadId,
            responsavelId: jornadaInfo.lead.consultorId,
            titulo: `Revisão no fechamento — ${jornadaInfo.lead.nome}`,
            descricao: `O financeiro devolveu para a etapa "${devolveParaDef.titulo}".\n\nMotivo: ${motivo}`,
            tipo: TarefaTipo.FOLLOWUP,
            prazo,
          },
        })
      }
    }

    revalidatePath(`/jornada/${fechamento.jornadaId}/fechamento`)
    revalidatePath('/tarefas')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Erro ao devolver etapa. Tente novamente.' }
  }
}
