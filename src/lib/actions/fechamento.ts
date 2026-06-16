'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessLead } from '@/lib/auth'
import { FechamentoEtapaStatus, TarefaTipo, TarefaStatus, Role, JornadaStatus } from '@prisma/client'
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
    const user = await getAuthUser()
    const fechamentoId = formData.get('fechamentoId') as string
    const numero = Number(formData.get('numero'))

    if (!fechamentoId || !numero) return { error: 'Dados inválidos.' }

    const fechamento = await prisma.fechamentoMatricula.findUniqueOrThrow({
      where: { id: fechamentoId },
    })

    // Checagem de acesso ao lead da jornada (fecha IDOR)
    const jornadaInfo = await getJornadaInfo(fechamento.jornadaId)
    if (!jornadaInfo) return { error: 'Jornada não encontrada.' }
    if (!(await canAccessLead(jornadaInfo.lead.id, user))) {
      return { error: 'Sem permissão.' }
    }

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
          concluidaPor: user.id,
        },
        update: {
          status: FechamentoEtapaStatus.CONCLUIDO,
          dados,
          concluidaEm: new Date(),
          concluidaPor: user.id,
        },
      }),
      prisma.fechamentoMatricula.update({
        where: { id: fechamentoId },
        data: {
          etapaAtual: isFinal ? numero : nextNumero,
          concluido: isFinal,
        },
      }),
      ...(isFinal ? [
        prisma.estudanteJornada.update({
          where: { id: fechamento.jornadaId },
          data: { status: JornadaStatus.PREPARACAO_VIAGEM },
        }),
      ] : []),
    ])

    {
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
    revalidatePath(`/jornada/${fechamento.jornadaId}`)
    revalidatePath('/tarefas')
    revalidatePath('/financeiro')
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
    const user = await getAuthUser()
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

    // Checagem de acesso ao lead da jornada (fecha IDOR — operação destrutiva: deleteMany)
    const jornadaInfo = await getJornadaInfo(fechamento.jornadaId)
    if (!jornadaInfo) return { error: 'Jornada não encontrada.' }
    if (!(await canAccessLead(jornadaInfo.lead.id, user))) {
      return { error: 'Sem permissão.' }
    }

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
    if (etapaDef.role === 'FINANCEIRO') {
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
    revalidatePath('/financeiro')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Erro ao devolver etapa. Tente novamente.' }
  }
}

// ─── getFinanceiroInbox ───────────────────────────────────────────────────────
// Caixa de tarefas do financeiro: fechamentos cuja etapa atual é de competência
// do FINANCEIRO (fila compartilhada do time). Reusa concluirEtapa/devolverEtapa.

const FINANCEIRO_STEP_NUMEROS = ETAPAS_DEF.filter((e) => e.role === 'FINANCEIRO').map((e) => e.numero)

export type FinanceiroInboxItem = {
  fechamentoId: string
  jornadaId: string
  leadId: string
  leadNome: string
  escolaNome: string
  consultorNome: string
  etapaNumero: number
  etapaTitulo: string
  etapaDescricao: string
  devolveParaNumero: number | null
  devolveParaTitulo: string | null
  dadosSalvos: Record<string, string>
  aguardandoDesde: string // ISO — desde quando está nesta etapa
}

export async function getFinanceiroInbox(): Promise<FinanceiroInboxItem[]> {
  const user = await getAuthUser()
  if (user.role !== Role.FINANCEIRO && user.role !== Role.DIRECAO) return []

  const fechamentos = await prisma.fechamentoMatricula.findMany({
    where: { concluido: false, etapaAtual: { in: FINANCEIRO_STEP_NUMEROS } },
    select: {
      id: true,
      jornadaId: true,
      etapaAtual: true,
      updatedAt: true,
      etapas: { select: { numero: true, dados: true } },
      jornada: {
        select: {
          leadId: true,
          lead: { select: { nome: true, consultor: { select: { nome: true } } } },
          escola: { select: { nome: true } },
        },
      },
    },
    orderBy: { updatedAt: 'asc' }, // quem espera há mais tempo primeiro
  })

  return fechamentos.flatMap((f) => {
    const def = ETAPAS_DEF.find((e) => e.numero === f.etapaAtual)
    if (!def) return []
    const devolveParaDef = def.devolveParaNumero
      ? ETAPAS_DEF.find((e) => e.numero === def.devolveParaNumero) ?? null
      : null
    const etapaRec = f.etapas.find((e) => e.numero === f.etapaAtual)
    return [{
      fechamentoId: f.id,
      jornadaId: f.jornadaId,
      leadId: f.jornada.leadId,
      leadNome: f.jornada.lead.nome,
      escolaNome: f.jornada.escola.nome,
      consultorNome: f.jornada.lead.consultor.nome,
      etapaNumero: def.numero,
      etapaTitulo: def.titulo,
      etapaDescricao: def.descricao,
      devolveParaNumero: def.devolveParaNumero ?? null,
      devolveParaTitulo: devolveParaDef?.titulo ?? null,
      dadosSalvos: (etapaRec?.dados as Record<string, string>) ?? {},
      aguardandoDesde: f.updatedAt.toISOString(),
    }]
  })
}
