'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailPlaceholderItem = {
  id: string
  tag: string
  label: string
  campoSistema: string
}

export type EmailPlaceholderState = { error?: string; success?: boolean } | null

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, role: true },
  })
}

// ─── listEmailPlaceholders ────────────────────────────────────────────────────

export async function listEmailPlaceholders(): Promise<EmailPlaceholderItem[]> {
  await getAuth()
  return prisma.emailPlaceholder.findMany({
    select: { id: true, tag: true, label: true, campoSistema: true },
    orderBy: { tag: 'asc' },
  })
}

// ─── createEmailPlaceholder ───────────────────────────────────────────────────

export async function createEmailPlaceholder(
  _prev: EmailPlaceholderState,
  formData: FormData,
): Promise<EmailPlaceholderState> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  const tagRaw      = (formData.get('tag')          as string | null)?.trim()
  const label       = (formData.get('label')        as string | null)?.trim()
  const campoSistema = (formData.get('campoSistema') as string | null)?.trim()

  if (!tagRaw || !label || !campoSistema) return { error: 'Todos os campos são obrigatórios.' }

  // Normalise: strip braces, then wrap
  const inner = tagRaw.replace(/^\{\{|\}\}$/g, '').trim()
  if (!inner) return { error: 'Tag inválida.' }
  const tag = `{{${inner}}}`

  try {
    await prisma.emailPlaceholder.create({ data: { tag, label, campoSistema } })
  } catch {
    return { error: 'Essa tag já existe.' }
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── updateEmailPlaceholder ───────────────────────────────────────────────────

export async function updateEmailPlaceholder(
  _prev: EmailPlaceholderState,
  formData: FormData,
): Promise<EmailPlaceholderState> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  const id          = (formData.get('id')           as string | null)?.trim()
  const tagRaw      = (formData.get('tag')          as string | null)?.trim()
  const label       = (formData.get('label')        as string | null)?.trim()
  const campoSistema = (formData.get('campoSistema') as string | null)?.trim()

  if (!id || !tagRaw || !label || !campoSistema) return { error: 'Todos os campos são obrigatórios.' }

  const inner = tagRaw.replace(/^\{\{|\}\}$/g, '').trim()
  if (!inner) return { error: 'Tag inválida.' }
  const tag = `{{${inner}}}`

  try {
    await prisma.emailPlaceholder.update({ where: { id }, data: { tag, label, campoSistema } })
  } catch {
    return { error: 'Essa tag já existe em outro placeholder.' }
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── deleteEmailPlaceholder ───────────────────────────────────────────────────

export async function deleteEmailPlaceholder(id: string): Promise<{ error?: string }> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  await prisma.emailPlaceholder.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}
