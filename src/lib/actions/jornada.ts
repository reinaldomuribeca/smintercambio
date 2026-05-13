'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role, JornadaStatus, JornadaEtapaStatus, PreEmbarqueStatus } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type JornadaFormState = { error?: string; success?: boolean; id?: string } | null

export type JornadaOverviewItem = {
  id: string
  leadId: string
  leadNome: string
  escolaNome: string
  paisNome: string
  paisBandeira: string | null
  embarqueEm: string | null
  retornoEm: string | null
  status: JornadaStatus
  totalEtapas: number
  etapasConcluidas: number
  consultorNome: string
  preEmbarqueStatus: string | null
}

export type JornadaHubData = {
  id: string
  leadId: string
  leadNome: string
  leadEmail: string | null
  consultorNome: string
  escolaNome: string
  paisNome: string
  paisBandeira: string | null
  embarqueEm: string | null
  retornoEm: string | null
  status: JornadaStatus
  fechamentoConcluido: boolean
  preparacaoConcluida: boolean
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  try {
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user!.id }, select: { id: true, role: true } })
    return { id: user!.id, role: dbUser.role }
  } catch {
    redirect('/login')
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getJornadasOverview(): Promise<JornadaOverviewItem[]> {
  const currentUser = await getCurrentUser()

  const jornadas = await prisma.estudanteJornada.findMany({
    where: currentUser.role === Role.CONSULTOR ? { lead: { consultorId: currentUser.id } } : undefined,
    include: {
      lead: { select: { nome: true, consultor: { select: { nome: true } } } },
      escola: { select: { nome: true, cidade: { select: { estado: { select: { pais: { select: { nome: true, bandeira: true } } } } } } } },
      etapas: { select: { status: true } },
      preEmbarque: { select: { status: true } },
    },
    orderBy: { embarqueEm: 'asc' },
  })

  return jornadas.map((j) => ({
    id: j.id,
    leadId: j.leadId,
    leadNome: j.lead.nome,
    escolaNome: j.escola.nome,
    paisNome: j.escola.cidade.estado.pais.nome,
    paisBandeira: j.escola.cidade.estado.pais.bandeira,
    embarqueEm: j.embarqueEm?.toISOString() ?? null,
    retornoEm: j.retornoEm?.toISOString() ?? null,
    status: j.status,
    totalEtapas: j.etapas.length,
    etapasConcluidas: j.etapas.filter((e) => e.status === JornadaEtapaStatus.CONCLUIDO).length,
    consultorNome: j.lead.consultor.nome,
    preEmbarqueStatus: j.preEmbarque?.status ?? null,
  }))
}

export async function getJornadaHub(jornadaId: string): Promise<JornadaHubData | null> {
  const currentUser = await getCurrentUser()

  const jornada = await prisma.estudanteJornada.findUnique({
    where: { id: jornadaId },
    include: {
      lead: { select: { nome: true, email: true, consultorId: true, consultor: { select: { nome: true } } } },
      escola: { select: { nome: true, cidade: { select: { estado: { select: { pais: { select: { nome: true, bandeira: true } } } } } } } },
      fechamentoMatricula: { select: { concluido: true } },
      preEmbarque: { select: { status: true } },
    },
  })

  if (!jornada) return null
  if (currentUser.role === Role.CONSULTOR && jornada.lead.consultorId !== currentUser.id) return null

  return {
    id: jornada.id,
    leadId: jornada.leadId,
    leadNome: jornada.lead.nome,
    leadEmail: jornada.lead.email ?? null,
    consultorNome: jornada.lead.consultor.nome,
    escolaNome: jornada.escola.nome,
    paisNome: jornada.escola.cidade.estado.pais.nome,
    paisBandeira: jornada.escola.cidade.estado.pais.bandeira,
    embarqueEm: jornada.embarqueEm?.toISOString() ?? null,
    retornoEm: jornada.retornoEm?.toISOString() ?? null,
    status: jornada.status,
    fechamentoConcluido: jornada.fechamentoMatricula?.concluido ?? false,
    preparacaoConcluida: jornada.preEmbarque?.status === PreEmbarqueStatus.REALIZADO,
  }
}

export async function getJornadaSummaryByLead(leadId: string) {
  return prisma.estudanteJornada.findUnique({
    where: { leadId },
    select: {
      id: true,
      status: true,
      embarqueEm: true,
      retornoEm: true,
      escolaId: true,
      escola: { select: { nome: true, cidade: { select: { estado: { select: { pais: { select: { nome: true, bandeira: true } } } } } } } },
      etapas: { select: { status: true } },
    },
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function upsertDestinoLead(
  _prev: JornadaFormState,
  formData: FormData,
): Promise<JornadaFormState> {
  const currentUser = await getCurrentUser()

  const leadId = formData.get('leadId') as string
  const escolaId = formData.get('escolaId') as string
  const embarqueStr = formData.get('embarqueEm') as string
  const retornoStr = formData.get('retornoEm') as string

  if (!escolaId) return { error: 'Escola é obrigatória.' }

  const embarqueEm = embarqueStr ? new Date(embarqueStr) : null
  const retornoEm = retornoStr ? new Date(retornoStr) : null

  const existingJornada = await prisma.estudanteJornada.findUnique({ where: { leadId }, select: { id: true, escolaId: true } })

  if (existingJornada && existingJornada.escolaId !== escolaId) {
    await prisma.$transaction([
      prisma.estudanteJornadaEtapa.deleteMany({ where: { jornadaId: existingJornada.id } }),
      prisma.estudanteJornada.update({ where: { id: existingJornada.id }, data: { escolaId, embarqueEm, retornoEm, status: JornadaStatus.FECHAMENTO_MATRICULA } }),
    ])
  } else if (existingJornada) {
    await prisma.estudanteJornada.update({ where: { id: existingJornada.id }, data: { embarqueEm, retornoEm } })
    return { success: true, id: existingJornada.id }
  }

  const jornada = existingJornada
    ? await prisma.estudanteJornada.findUniqueOrThrow({ where: { leadId } })
    : await prisma.estudanteJornada.create({ data: { leadId, escolaId, embarqueEm, retornoEm } })

  const templates = await prisma.jornadaEtapaTemplate.findMany({ where: { escolaId }, select: { id: true }, orderBy: { numero: 'asc' } })

  const existingTemplateIds = new Set(
    (await prisma.estudanteJornadaEtapa.findMany({ where: { jornadaId: jornada.id }, select: { etapaTemplateId: true } })).map((e) => e.etapaTemplateId)
  )

  const newTemplates = templates.filter((t) => !existingTemplateIds.has(t.id))
  if (newTemplates.length > 0) {
    await prisma.$transaction(
      newTemplates.map((t) => prisma.estudanteJornadaEtapa.create({
        data: { jornadaId: jornada.id, etapaTemplateId: t.id },
      }))
    )

    for (const t of newTemplates) {
      const etapa = await prisma.estudanteJornadaEtapa.findFirst({ where: { jornadaId: jornada.id, etapaTemplateId: t.id }, select: { id: true } })
      if (!etapa) continue
      const campos = await prisma.jornadaCampoTemplate.findMany({ where: { etapaId: t.id }, select: { id: true } })
      if (campos.length > 0) {
        await prisma.estudanteEtapaValor.createMany({
          data: campos.map((c) => ({ etapaId: etapa.id, campoId: c.id, updatedBy: currentUser.id })),
          skipDuplicates: true,
        })
      }
    }
  }

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/jornada')
  return { success: true, id: jornada.id }
}
