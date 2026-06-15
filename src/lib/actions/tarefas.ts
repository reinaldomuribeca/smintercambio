'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { canAccessLead } from '@/lib/auth'
import { TarefaTipo, TarefaStatus, Role, Prisma } from '@prisma/client'

export type ProductivityRow = {
  userId: string
  nome: string
  role: string
  atribuidas: number
  concluidas: number
  pendentes: number
  atrasadas: number
  mediaDias: number | null
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TarefaItem = {
  id: string
  titulo: string
  descricao: string | null
  tipo: TarefaTipo
  status: TarefaStatus
  prazo: string | null
  concluidaEm: string | null
  responsavel: { id: string; nome: string }
  lead: { id: string; nome: string }
}

export type CreateTarefaState = { error?: string; created?: boolean } | null

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, role: true },
  })
  return dbUser
}

// ─── Shared select shape ──────────────────────────────────────────────────────

const TAREFA_SELECT = {
  id: true,
  titulo: true,
  descricao: true,
  tipo: true,
  status: true,
  prazo: true,
  concluidaEm: true,
  responsavel: { select: { id: true, nome: true } },
  lead: { select: { id: true, nome: true } },
} satisfies Prisma.TarefaSelect

function serialize(t: {
  id: string; titulo: string; descricao: string | null; tipo: TarefaTipo
  status: TarefaStatus; prazo: Date | null; concluidaEm: Date | null
  responsavel: { id: string; nome: string }; lead: { id: string; nome: string }
}): TarefaItem {
  return {
    ...t,
    prazo: t.prazo?.toISOString() ?? null,
    concluidaEm: t.concluidaEm?.toISOString() ?? null,
  }
}

// ─── getLeadTarefas ───────────────────────────────────────────────────────────

export async function getLeadTarefas(leadId: string): Promise<TarefaItem[]> {
  const user = await getAuth()
  // Bloqueia leitura cruzada (IDOR): CONSULTOR/FINANCEIRO só veem leads permitidos.
  if (!(await canAccessLead(leadId, user))) return []
  const rows = await prisma.tarefa.findMany({
    where: { leadId },
    select: TAREFA_SELECT,
    orderBy: [{ status: 'asc' }, { prazo: 'asc' }],
  })
  return rows.map(serialize)
}

// ─── getTarefas (página /tarefas) ─────────────────────────────────────────────

export async function getTarefas(params: {
  status?: string
  tipo?: string
  prazo?: string
}): Promise<TarefaItem[]> {
  const { id: userId, role } = await getAuth()
  const now = new Date()

  const where: Prisma.TarefaWhereInput = {}

  if (role === Role.CONSULTOR) {
    where.lead = { consultorId: userId }
  } else if (role === Role.FINANCEIRO) {
    where.responsavelId = userId
  }

  // Prazo filter overrides status for 'atrasadas'
  if (params.prazo === 'atrasadas') {
    where.prazo = { lt: now }
    where.status = TarefaStatus.PENDENTE
  } else {
    if (params.status) {
      where.status = params.status as TarefaStatus
    }
    if (params.prazo === 'hoje') {
      const start = new Date(now); start.setHours(0, 0, 0, 0)
      const end   = new Date(now); end.setHours(23, 59, 59, 999)
      where.prazo = { gte: start, lte: end }
    } else if (params.prazo === 'semana') {
      const start = new Date(now); start.setHours(0, 0, 0, 0)
      const end   = new Date(start); end.setDate(end.getDate() + 7)
      where.prazo = { gte: start, lt: end }
    }
  }

  if (params.tipo) {
    where.tipo = params.tipo as TarefaTipo
  }

  const rows = await prisma.tarefa.findMany({
    where,
    select: TAREFA_SELECT,
    orderBy: [{ prazo: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(serialize)
}

// ─── getUsuariosAtivos (para select de responsável) ───────────────────────────

export async function getUsuariosAtivos(): Promise<{ id: string; nome: string }[]> {
  await getAuth()
  return prisma.user.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
}

// ─── createTarefa ─────────────────────────────────────────────────────────────

export async function createTarefa(
  _prev: CreateTarefaState,
  formData: FormData,
): Promise<CreateTarefaState> {
  const { id: userId, role } = await getAuth()

  const leadId       = formData.get('leadId') as string

  // CONSULTOR só pode criar tarefas para seus próprios leads
  if (role === Role.CONSULTOR) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { consultorId: true } })
    if (lead?.consultorId !== userId) return { error: 'Sem permissão.' }
  }
  const titulo       = (formData.get('titulo') as string).trim()
  const tipo         = formData.get('tipo') as TarefaTipo
  const prazoStr     = (formData.get('prazo') as string).trim()
  const responsavelId = formData.get('responsavelId') as string
  const descricao    = (formData.get('descricao') as string | null)?.trim() || null

  if (!titulo)        return { error: 'Título é obrigatório.' }
  if (!tipo)          return { error: 'Tipo é obrigatório.' }
  if (!prazoStr)      return { error: 'Prazo é obrigatório.' }
  if (!responsavelId) return { error: 'Responsável é obrigatório.' }

  const prazo = new Date(prazoStr)
  if (isNaN(prazo.getTime())) return { error: 'Prazo inválido.' }

  await prisma.tarefa.create({
    data: { leadId, responsavelId, titulo, tipo, prazo, descricao, status: TarefaStatus.PENDENTE },
  })

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/tarefas')
  return { created: true }
}

// ─── updateTarefaStatus ───────────────────────────────────────────────────────

export async function updateTarefaStatus(
  tarefaId: string,
  newStatus: TarefaStatus,
): Promise<{ error?: string }> {
  const { id: userId, role } = await getAuth()

  const tarefa = await prisma.tarefa.findUnique({
    where: { id: tarefaId },
    select: { leadId: true, lead: { select: { consultorId: true } } },
  })
  if (!tarefa) return { error: 'Tarefa não encontrada.' }

  // CONSULTOR só pode atualizar tarefas dos próprios leads
  if (role === Role.CONSULTOR && tarefa.lead.consultorId !== userId) {
    return { error: 'Sem permissão.' }
  }

  await prisma.tarefa.update({
    where: { id: tarefaId },
    data: {
      status: newStatus,
      concluidaEm: newStatus === TarefaStatus.CONCLUIDA ? new Date() : null,
    },
  })

  revalidatePath(`/leads/${tarefa.leadId}`)
  revalidatePath('/tarefas')
  return {}
}

// ─── getProductivityMetrics ───────────────────────────────────────────────────

export async function getProductivityMetrics(params: {
  de: string
  ate: string
}): Promise<ProductivityRow[]> {
  await getAuth()

  const dateFrom = new Date(`${params.de}T00:00:00`)
  const dateTo   = new Date(`${params.ate}T23:59:59`)
  const now      = new Date()

  const [users, tarefas] = await Promise.all([
    prisma.user.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, role: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.tarefa.findMany({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
      select: { responsavelId: true, status: true, prazo: true, concluidaEm: true, createdAt: true },
    }),
  ])

  return users.map((u) => {
    const uts       = tarefas.filter((t) => t.responsavelId === u.id)
    const concluidas = uts.filter((t) => t.status === TarefaStatus.CONCLUIDA)
    const pendentes  = uts.filter((t) => t.status === TarefaStatus.PENDENTE)
    const atrasadas  = pendentes.filter((t) => t.prazo && t.prazo < now)

    const dias = concluidas
      .filter((t) => t.concluidaEm)
      .map((t) => Math.round((t.concluidaEm!.getTime() - t.createdAt.getTime()) / 86400000))

    return {
      userId:    u.id,
      nome:      u.nome,
      role:      u.role,
      atribuidas: uts.length,
      concluidas: concluidas.length,
      pendentes:  pendentes.length,
      atrasadas:  atrasadas.length,
      mediaDias: dias.length > 0 ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null,
    }
  })
}
