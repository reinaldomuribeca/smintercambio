'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailTemplateItem = {
  id: string
  nome: string
  assunto: string
  corpo: string
}

export type EmailTemplateState = { error?: string; success?: boolean } | null

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

// ─── listEmailTemplates ───────────────────────────────────────────────────────

export async function listEmailTemplates(): Promise<EmailTemplateItem[]> {
  await getAuth()
  return prisma.emailTemplate.findMany({
    select: { id: true, nome: true, assunto: true, corpo: true },
    orderBy: { nome: 'asc' },
  })
}

// ─── createEmailTemplate ──────────────────────────────────────────────────────

export async function createEmailTemplate(
  _prev: EmailTemplateState,
  formData: FormData,
): Promise<EmailTemplateState> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  const nome    = (formData.get('nome')    as string | null)?.trim()
  const assunto = (formData.get('assunto') as string | null)?.trim()
  const corpo   = (formData.get('corpo')   as string | null)?.trim()

  if (!nome)    return { error: 'Nome é obrigatório.' }
  if (!assunto) return { error: 'Assunto é obrigatório.' }
  if (!corpo)   return { error: 'Corpo é obrigatório.' }

  await prisma.emailTemplate.create({ data: { nome, assunto, corpo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── updateEmailTemplate ──────────────────────────────────────────────────────

export async function updateEmailTemplate(
  _prev: EmailTemplateState,
  formData: FormData,
): Promise<EmailTemplateState> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  const id      = (formData.get('id')      as string | null)?.trim()
  const nome    = (formData.get('nome')    as string | null)?.trim()
  const assunto = (formData.get('assunto') as string | null)?.trim()
  const corpo   = (formData.get('corpo')   as string | null)?.trim()

  if (!id || !nome || !assunto || !corpo) return { error: 'Todos os campos são obrigatórios.' }

  await prisma.emailTemplate.update({ where: { id }, data: { nome, assunto, corpo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

// ─── deleteEmailTemplate ──────────────────────────────────────────────────────

export async function deleteEmailTemplate(id: string): Promise<{ error?: string }> {
  const { role } = await getAuth()
  if (role !== Role.DIRECAO) return { error: 'Sem permissão.' }

  await prisma.emailTemplate.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}

// ─── sendEmailFechamento ──────────────────────────────────────────────────────

export async function sendEmailFechamento(
  destinatario: string,
  assunto: string,
  corpo: string,
  leadNome: string,
): Promise<{ error?: string; success?: boolean }> {
  await getAuth()

  if (!destinatario || !assunto || !corpo) return { error: 'Preencha todos os campos.' }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { error: 'Envio de e-mail não configurado. Configure RESEND_API_KEY.' }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'SM Intercâmbio <noreply@smintercambio.com.br>'

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [destinatario],
    subject: assunto,
    text: corpo,
  })

  if (error) {
    console.error('Resend error:', error)
    return { error: 'Erro ao enviar e-mail. Verifique a configuração do Resend.' }
  }

  return { success: true }
}
