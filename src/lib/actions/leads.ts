'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { OrigemLead, Prisma, Role } from '@prisma/client'

// ─── Auth helper ─────────────────────────────────────────────────────────────

type AuthUser = { id: string; role: Role; nome: string }

async function getAuth(): Promise<AuthUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, role: true, nome: true },
  })
  return dbUser
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

const createLeadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  dataNascimento: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  serieAtual: z.string().optional(),
  escolaAtual: z.string().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z
    .string()
    .min(2, 'Estado é obrigatório')
    .max(2, 'Use a sigla do estado (ex: SP)')
    .transform((v) => v.toUpperCase()),
  nomeResponsaveis: z.string().min(2, 'Nome dos responsáveis é obrigatório'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  origemLead: z.nativeEnum(OrigemLead).optional(),
  consultorId: z.string().min(1, 'Consultor é obrigatório'),
  observacoes: z.string().optional(),
})

// ─── createLead ──────────────────────────────────────────────────────────────

export type CreateLeadState = {
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
} | null

export async function createLead(
  _prevState: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const { id: userId, role } = await getAuth()

  const raw = Object.fromEntries(formData.entries())
  // CONSULTOR sempre cria para si mesmo
  if (role === Role.CONSULTOR) {
    raw.consultorId = userId
  }

  const parsed = createLeadSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    const lead = await prisma.lead.create({ data: parsed.data })

    // Regra de negócio #1: tarefa de follow-up automática (prazo: +24h)
    await prisma.tarefa.create({
      data: {
        leadId: lead.id,
        responsavelId: lead.consultorId,
        titulo: `Follow-up inicial — ${lead.nome}`,
        tipo: 'FOLLOWUP',
        status: 'PENDENTE',
        prazo: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    revalidatePath('/leads')
    return null // null = sucesso
  } catch {
    return { error: 'Erro ao criar lead. Tente novamente.' }
  }
}

// ─── getLeads ────────────────────────────────────────────────────────────────

export type LeadRow = {
  id: string
  nome: string
  cidade: string | null
  estado: string | null
  origemLead: OrigemLead | null
  funilStatus: string
  createdAt: Date
  consultor: { nome: string }
}

export type GetLeadsResult = {
  leads: LeadRow[]
  total: number
  page: number
  pages: number
}

export async function getLeads(params: {
  search?: string
  status?: string
  consultorId?: string
  origem?: string
  page?: number
}): Promise<GetLeadsResult> {
  const { id: userId, role } = await getAuth()

  const where: Prisma.LeadWhereInput = {}

  // CONSULTOR vê apenas seus próprios leads
  // FINANCEIRO vê apenas leads onde tem tarefa atribuída
  if (role === Role.CONSULTOR) {
    where.consultorId = userId
  } else if (role === Role.FINANCEIRO) {
    where.tarefas = { some: { responsavelId: userId } }
  } else if (params.consultorId) {
    where.consultorId = params.consultorId
  }

  if (params.status) {
    where.funilStatus = params.status
  }

  if (params.origem && Object.values(OrigemLead).includes(params.origem as OrigemLead)) {
    where.origemLead = params.origem as OrigemLead
  }

  if (params.search) {
    where.OR = [
      { nome: { contains: params.search, mode: 'insensitive' } },
      { nomeResponsaveis: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const page = Math.max(1, params.page ?? 1)
  const take = 20
  const skip = (page - 1) * take

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      select: {
        id: true,
        nome: true,
        cidade: true,
        estado: true,
        origemLead: true,
        funilStatus: true,
        createdAt: true,
        consultor: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.lead.count({ where }),
  ])

  return { leads: leads as LeadRow[], total, page, pages: Math.ceil(total / take) }
}

// ─── getConsultores ───────────────────────────────────────────────────────────

export async function getConsultores() {
  try {
    await getAuth()
    return prisma.user.findMany({
      where: { role: { in: [Role.DIRECAO, Role.CONSULTOR] }, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    })
  } catch {
    return []
  }
}

// ─── reatribuirConsultor ──────────────────────────────────────────────────────

export type ReatribuirState = { error?: string; success?: boolean } | null

export async function reatribuirConsultor(
  _prev: ReatribuirState,
  formData: FormData,
): Promise<ReatribuirState> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  const leadId         = (formData.get('leadId') as string | null)?.trim()
  const novoConsultorId = (formData.get('consultorId') as string | null)?.trim()

  if (!leadId || !novoConsultorId) return { error: 'Dados inválidos.' }

  await prisma.lead.update({
    where: { id: leadId },
    data: { consultorId: novoConsultorId },
  })

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
  return { success: true }
}
