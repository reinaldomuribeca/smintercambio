'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { canAccessLead } from '@/lib/auth'
import { HistoricoTipo, Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HistoricoItem = {
  id: string
  tipo: HistoricoTipo
  titulo: string | null
  conteudo: string | null
  arquivoUrl: string | null
  autor: { id: string; nome: string }
  createdAt: string
}

export type CreateHistoricoState = { error?: string; created?: boolean } | null

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

// ─── getLeadHistorico ─────────────────────────────────────────────────────────

export async function getLeadHistorico(leadId: string): Promise<HistoricoItem[]> {
  const user = await getAuth()
  // Bloqueia leitura cruzada (IDOR): CONSULTOR/FINANCEIRO só veem leads permitidos.
  if (!(await canAccessLead(leadId, user))) return []

  const rows = await prisma.historicoInteracao.findMany({
    where: { leadId },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      conteudo: true,
      arquivoUrl: true,
      autor: { select: { id: true, nome: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
}

// ─── createHistorico ──────────────────────────────────────────────────────────

export async function createHistorico(
  _prev: CreateHistoricoState,
  formData: FormData,
): Promise<CreateHistoricoState> {
  const { id: userId, role } = await getAuth()

  const leadId    = formData.get('leadId') as string

  // CONSULTOR só pode registrar histórico dos próprios leads
  if (role === Role.CONSULTOR) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { consultorId: true } })
    if (lead?.consultorId !== userId) return { error: 'Sem permissão.' }
  }
  const tipo      = formData.get('tipo') as HistoricoTipo
  const titulo    = (formData.get('titulo') as string).trim()
  const conteudo  = (formData.get('conteudo') as string | null)?.trim() || null
  const arquivoUrl = (formData.get('arquivoUrl') as string | null)?.trim() || null

  if (!tipo)   return { error: 'Tipo é obrigatório.' }
  if (!titulo) return { error: 'Título é obrigatório.' }

  await prisma.historicoInteracao.create({
    data: { leadId, autorId: userId, tipo, titulo, conteudo, arquivoUrl },
  })

  revalidatePath(`/leads/${leadId}`)
  return { created: true }
}
