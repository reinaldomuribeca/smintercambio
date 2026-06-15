'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CAMPOS_SISTEMA } from '@/lib/email-placeholders-config'
import { Role } from '@prisma/client'

// Campos válidos do sistema (catálogo). Usado para garantir que toda tag aponte
// para um campo realmente existente no contexto de substituição.
const CAMPO_VALUES = new Set<string>(CAMPOS_SISTEMA.map((c) => c.value))
const TAG_INNER = /^[a-z0-9_]+$/ // minúsculas, números e underline

/** Valida e normaliza a tag (sem chaves) e o campoSistema. */
function validatePlaceholder(
  tagRaw: string,
  campoSistema: string,
): { error: string } | { tag: string } {
  const inner = tagRaw.replace(/^\{\{|\}\}$/g, '').trim()
  if (!inner) return { error: 'Tag inválida.' }
  if (!TAG_INNER.test(inner)) {
    return { error: 'A tag deve conter apenas letras minúsculas, números e underline (ex: nome_aluno).' }
  }
  if (!CAMPO_VALUES.has(campoSistema)) {
    return { error: 'Campo do sistema inválido. Selecione um dos campos disponíveis.' }
  }
  return { tag: `{{${inner}}}` }
}

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

  const valid = validatePlaceholder(tagRaw, campoSistema)
  if ('error' in valid) return valid
  const { tag } = valid

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

  const valid = validatePlaceholder(tagRaw, campoSistema)
  if ('error' in valid) return valid
  const { tag } = valid

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
