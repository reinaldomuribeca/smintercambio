'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { ObjetivoPrograma, Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserFormState     = { error?: string; success?: boolean } | null
export type TemplateFormState = { error?: string; success?: boolean } | null
export type TemplateDoc       = { nome: string; obrigatorio: boolean }

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireDirecao(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/login'); return null }
  try {
    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { role: true },
    })
    if (dbUser.role !== Role.DIRECAO) return 'Acesso negado.'
    return null
  } catch {
    return 'Erro de autenticação.'
  }
}

// ─── createUser ───────────────────────────────────────────────────────────────

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const nome  = (formData.get('nome')  as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const senha = formData.get('senha') as string
  const role  = formData.get('role')  as Role

  if (!nome)                          return { error: 'Nome é obrigatório.' }
  if (!email)                         return { error: 'E-mail é obrigatório.' }
  if (!senha || senha.length < 6)     return { error: 'Senha deve ter pelo menos 6 caracteres.' }
  if (!Object.values(Role).includes(role)) return { error: 'Role inválida.' }

  // Check duplicate email in Prisma
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) return { error: 'Já existe um usuário com este e-mail.' }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })
  if (authError) return { error: authError.message }

  await prisma.user.create({
    data: { id: authData.user.id, email, nome, role, ativo: true },
  })

  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── updateUser ───────────────────────────────────────────────────────────────

export async function updateUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id   = formData.get('id')   as string
  const nome = (formData.get('nome') as string).trim()
  const role = formData.get('role') as Role

  if (!nome) return { error: 'Nome é obrigatório.' }
  if (!Object.values(Role).includes(role)) return { error: 'Role inválida.' }

  await prisma.user.update({ where: { id }, data: { nome, role } })

  await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { nome } })

  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── toggleUserAtivo ──────────────────────────────────────────────────────────

export async function toggleUserAtivo(
  userId: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  await prisma.user.update({ where: { id: userId }, data: { ativo } })

  // Ban/unban in Supabase so blocked users cannot log in
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: ativo ? 'none' : '87600h',
  })
  if (error) return { error: error.message }

  revalidatePath('/configuracoes')
  return {}
}

// ─── FunilEtapa CRUD ─────────────────────────────────────────────────────────

export type FunilEtapaFormState = { error?: string; success?: boolean } | null

export async function createFunilEtapa(
  _prev: FunilEtapaFormState,
  formData: FormData,
): Promise<FunilEtapaFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const slug    = (formData.get('slug') as string).trim().toUpperCase().replace(/\s+/g, '_')
  const nome    = (formData.get('nome') as string).trim()
  const cor     = (formData.get('cor') as string).trim() || '#94a3b8'
  const perdido = formData.get('perdido') === 'true'

  if (!slug) return { error: 'Slug é obrigatório.' }
  if (!nome) return { error: 'Nome é obrigatório.' }

  const existing = await prisma.funilEtapa.findUnique({ where: { slug }, select: { id: true } })
  if (existing) return { error: 'Já existe uma etapa com este slug.' }

  const last = await prisma.funilEtapa.findFirst({ orderBy: { ordem: 'desc' }, select: { ordem: true } })
  const ordem = (last?.ordem ?? 0) + 1

  await prisma.funilEtapa.create({ data: { slug, nome, cor, ordem, perdido } })

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return { success: true }
}

export async function updateFunilEtapa(
  _prev: FunilEtapaFormState,
  formData: FormData,
): Promise<FunilEtapaFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id      = formData.get('id') as string
  const nome    = (formData.get('nome') as string).trim()
  const cor     = (formData.get('cor') as string).trim() || '#94a3b8'
  const perdido = formData.get('perdido') === 'true'

  if (!nome) return { error: 'Nome é obrigatório.' }

  await prisma.funilEtapa.update({ where: { id }, data: { nome, cor, perdido } })

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return { success: true }
}

export async function deleteFunilEtapa(id: string): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const etapa = await prisma.funilEtapa.findUnique({ where: { id }, select: { slug: true } })
  if (!etapa) return { error: 'Etapa não encontrada.' }

  const leadsCount = await prisma.lead.count({ where: { funilStatus: etapa.slug } })
  if (leadsCount > 0) {
    return { error: `Não é possível excluir: ${leadsCount} lead(s) estão nesta etapa.` }
  }

  await prisma.funilEtapa.delete({ where: { id } })

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return {}
}

export async function reorderFunilEtapas(ids: string[]): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.funilEtapa.update({ where: { id }, data: { ordem: index + 1 } })
    )
  )

  revalidatePath('/configuracoes')
  revalidatePath('/funil')
  return {}
}

// ─── upsertTemplate ───────────────────────────────────────────────────────────

export async function upsertTemplate(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const objetivoPrograma = formData.get('objetivoPrograma') as ObjetivoPrograma
  const documentosJson   = formData.get('documentos') as string

  if (!Object.values(ObjetivoPrograma).includes(objetivoPrograma)) {
    return { error: 'Programa inválido.' }
  }

  let documentos: TemplateDoc[]
  try {
    const parsed = JSON.parse(documentosJson)
    if (!Array.isArray(parsed)) return { error: 'Dados inválidos.' }
    for (const doc of parsed) {
      if (typeof doc.nome !== 'string' || typeof doc.obrigatorio !== 'boolean') {
        return { error: 'Documento inválido.' }
      }
      // Sanitize: trim names, remove empty
      doc.nome = doc.nome.trim()
    }
    documentos = parsed.filter((d: TemplateDoc) => d.nome.length > 0)
  } catch {
    return { error: 'Dados inválidos.' }
  }

  await prisma.checklistTemplate.upsert({
    where:  { objetivoPrograma },
    create: { objetivoPrograma, documentos: documentos as object[] },
    update: { documentos: documentos as object[] },
  })

  revalidatePath('/configuracoes')
  return { success: true }
}
