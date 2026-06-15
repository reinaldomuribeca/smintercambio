'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { addBusinessDays } from '@/lib/utils/datas'
import { logAudit } from '@/lib/audit'
import { Prisma, Role } from '@prisma/client'

// ─── Auth helper ──────────────────────────────────────────────────────────────

type AuthUser = { id: string; role: Role }

async function getAuth(): Promise<AuthUser> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, role: true },
  })
  return dbUser
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FunilEtapaConfig = {
  id: string
  slug: string
  nome: string
  cor: string
  ordem: number
  perdido: boolean
}

export type FunilLead = {
  id: string
  nome: string
  funilStatus: string
  consultorNome: string
  consultorInitials: string
  destinoDesejado: string | null
  hasOverdueTask: boolean
}

// ─── getFunilEtapas ───────────────────────────────────────────────────────────

export async function getFunilEtapas(): Promise<FunilEtapaConfig[]> {
  return prisma.funilEtapa.findMany({
    where: { ativa: true },
    select: { id: true, slug: true, nome: true, cor: true, ordem: true, perdido: true },
    orderBy: { ordem: 'asc' },
  })
}

// ─── getFunilLeads ────────────────────────────────────────────────────────────

export async function getFunilLeads(): Promise<FunilLead[]> {
  const { id: userId, role } = await getAuth()

  const where: Prisma.LeadWhereInput = {}
  if (role === Role.CONSULTOR) where.consultorId = userId

  const leads = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      nome: true,
      funilStatus: true,
      consultor: { select: { nome: true } },
      diagnostico: { select: { destinosDesejados: true } },
      tarefas: {
        where: { status: 'PENDENTE', prazo: { lt: new Date() } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return leads.map((l) => ({
    id: l.id,
    nome: l.nome,
    funilStatus: l.funilStatus,
    consultorNome: l.consultor.nome,
    consultorInitials: l.consultor.nome
      .split(' ').filter(Boolean).slice(0, 2)
      .map((w) => w[0].toUpperCase()).join(''),
    destinoDesejado: l.diagnostico?.destinosDesejados?.[0] ?? null,
    hasOverdueTask: l.tarefas.length > 0,
  }))
}

// ─── updateFunilStatus ────────────────────────────────────────────────────────

const PERDIDO_SLUGS = ['SEM_RETORNO', 'SEM_BUDGET', 'FECHOU_CONCORRENTE', 'DESISTIU']

export async function updateFunilStatus(
  leadId: string,
  newStatus: string,
  motivoPerda?: string,
): Promise<{ error?: string }> {
  const { id: userId, role } = await getAuth()

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { consultorId: true, funilStatus: true },
  })
  if (!lead) return { error: 'Lead não encontrado.' }

  if (role === Role.CONSULTOR && lead.consultorId !== userId) {
    return { error: 'Sem permissão para mover este lead.' }
  }

  // Verifica se é etapa "perdido" via DB
  const etapa = await prisma.funilEtapa.findUnique({ where: { slug: newStatus }, select: { perdido: true } })
  const isPerdido = etapa?.perdido ?? PERDIDO_SLUGS.includes(newStatus)

  if (isPerdido && !motivoPerda?.trim()) {
    return { error: 'Informe o motivo da perda antes de continuar.' }
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      funilStatus: newStatus,
      ...(motivoPerda ? { motivoPerda } : {}),
    },
  })

  // Trilha de auditoria: quem moveu o lead e para onde (+ motivo de perda).
  await logAudit({
    entidade: 'Lead',
    entidadeId: leadId,
    acao: 'mover_funil',
    autorId: userId,
    diff: {
      de: lead.funilStatus,
      para: newStatus,
      ...(motivoPerda ? { motivoPerda } : {}),
    },
  })

  // Regra de negócio #2: ao ENTRAR em PROPOSTA_ENVIADA, gera follow-up
  // estratégico com prazo de 3 dias ÚTEIS. Dispara apenas na transição de
  // status (não a cada salvar) e evita duplicar caso já exista uma pendente.
  if (newStatus === 'PROPOSTA_ENVIADA' && lead.funilStatus !== 'PROPOSTA_ENVIADA') {
    const tituloFollowup = 'Follow-up estratégico — proposta enviada'
    const jaExiste = await prisma.tarefa.findFirst({
      where: { leadId, titulo: tituloFollowup, status: 'PENDENTE' },
      select: { id: true },
    })
    if (!jaExiste) {
      await prisma.tarefa.create({
        data: {
          leadId,
          responsavelId: lead.consultorId,
          titulo: tituloFollowup,
          tipo: 'FOLLOWUP',
          status: 'PENDENTE',
          prazo: addBusinessDays(new Date(), 3),
        },
      })
    }
  }

  revalidatePath('/funil')
  revalidatePath('/leads')
  return {}
}
