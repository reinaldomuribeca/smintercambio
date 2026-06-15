'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_CHECKLIST_TEMPLATES } from '@/lib/checklist-templates'
import { encryptSecret } from '@/lib/crypto'
import { Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocStatus = 'PENDENTE' | 'ENVIADO' | 'APROVADO'

export type ChecklistItem = {
  nome: string
  obrigatorio: boolean
  status: DocStatus
}

export type PortalFormState = { error?: string; success?: boolean } | null
export type OfferFormState  = { error?: string; success?: boolean } | null

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

// ─── createAplicacao ──────────────────────────────────────────────────────────

export async function createAplicacao(leadId: string): Promise<{ error?: string; semTemplate?: boolean }> {
  const { id: userId, role } = await getAuth()

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      consultorId: true,
      aplicacao: { select: { id: true } },
      diagnostico: { select: { objetivoPrograma: true } },
    },
  })
  if (!lead) return { error: 'Lead não encontrado.' }
  if (lead.aplicacao) return { error: 'Aplicação já existe.' }

  // CONSULTOR só pode iniciar aplicação dos próprios leads
  if (role === Role.CONSULTOR && lead.consultorId !== userId) {
    return { error: 'Sem permissão.' }
  }

  const objetivo = lead.diagnostico?.objetivoPrograma ?? null

  let checklistDocs: ChecklistItem[] = []
  if (objetivo) {
    // Prefer DB template; fall back to hardcoded constant
    const dbTemplate = await prisma.checklistTemplate.findUnique({
      where: { objetivoPrograma: objetivo },
      select: { documentos: true },
    })
    if (dbTemplate?.documentos) {
      const docs = dbTemplate.documentos as unknown as { nome: string; obrigatorio: boolean }[]
      checklistDocs = docs.map((d) => ({ ...d, status: 'PENDENTE' as const }))
    } else {
      checklistDocs = (DEFAULT_CHECKLIST_TEMPLATES[objetivo] ?? []).map((d) => ({
        ...d,
        status: 'PENDENTE' as const,
      }))
    }
  }

  await prisma.aplicacao.create({
    data: { leadId, checklistDocs: checklistDocs as object[] },
  })

  revalidatePath(`/leads/${leadId}`)
  return { semTemplate: !objetivo }
}

// ─── updateChecklist ──────────────────────────────────────────────────────────

export async function updateChecklist(
  leadId: string,
  index: number,
  newStatus: DocStatus,
): Promise<{ error?: string }> {
  const { id: userId, role } = await getAuth()

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      consultorId: true,
      aplicacao: { select: { id: true, checklistDocs: true } },
    },
  })
  if (!lead?.aplicacao) return { error: 'Aplicação não encontrada.' }

  // CONSULTOR só pode atualizar checklist dos próprios leads
  if (role === Role.CONSULTOR && lead.consultorId !== userId) {
    return { error: 'Sem permissão.' }
  }

  const items = lead.aplicacao.checklistDocs as unknown as ChecklistItem[]
  if (index < 0 || index >= items.length) return { error: 'Item inválido.' }

  const updated = items.map((item, i) =>
    i === index ? { ...item, status: newStatus } : item,
  )

  await prisma.aplicacao.update({
    where: { id: lead.aplicacao.id },
    data: { checklistDocs: updated as object[] },
  })

  // Business rule #4: marcar PENDENTE → tarefa para o consultor
  if (newStatus === 'PENDENTE') {
    const prazo = new Date()
    prazo.setDate(prazo.getDate() + 3)
    await prisma.tarefa.create({
      data: {
        leadId,
        responsavelId: lead.consultorId,
        titulo: `Documento pendente: ${items[index].nome}`,
        tipo: 'DOCUMENTO',
        status: 'PENDENTE',
        prazo,
      },
    })
  }

  revalidatePath(`/leads/${leadId}`)
  return {}
}

// ─── updatePortal ─────────────────────────────────────────────────────────────

export async function updatePortal(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const { role } = await getAuth()

  if (role === Role.CONSULTOR || role === Role.ADMINISTRATIVO) {
    return { error: 'Sem permissão para editar o portal.' }
  }

  const leadId      = formData.get('leadId') as string
  const portalNome  = (formData.get('portalNome')  as string).trim() || null
  const portalUrl   = (formData.get('portalUrl')   as string).trim() || null
  // portalLogin é credencial sensível → cifrada em repouso (AES-256-GCM).
  // undefined = não mexe no campo (roles sem permissão de editar o login).
  const portalLoginRaw =
    role === Role.DIRECAO || role === Role.OPERACOES
      ? ((formData.get('portalLogin') as string).trim() || null)
      : undefined
  const portalLogin =
    portalLoginRaw === undefined ? undefined : encryptSecret(portalLoginRaw)

  const aplicacao = await prisma.aplicacao.findUnique({
    where: { leadId },
    select: { id: true },
  })
  if (!aplicacao) return { error: 'Aplicação não encontrada.' }

  await prisma.aplicacao.update({
    where: { id: aplicacao.id },
    data: {
      portalNome,
      portalUrl,
      ...(portalLogin !== undefined ? { portalLogin } : {}),
    },
  })

  revalidatePath(`/leads/${leadId}`)
  return { success: true }
}

// ─── updateOffer ──────────────────────────────────────────────────────────────

export async function updateOffer(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const { role } = await getAuth()

  if (role === Role.CONSULTOR || role === Role.ADMINISTRATIVO) {
    return { error: 'Sem permissão para editar a offer.' }
  }

  const leadId               = formData.get('leadId') as string
  const offerRecebidaEmStr   = (formData.get('offerRecebidaEm')   as string).trim()
  const offerDeadlineStr     = (formData.get('offerDeadline')     as string).trim()
  const offerValorDepositoStr = (formData.get('offerValorDeposito') as string).trim()

  const offerRecebidaEm   = offerRecebidaEmStr   ? new Date(offerRecebidaEmStr)   : null
  const offerDeadline     = offerDeadlineStr     ? new Date(offerDeadlineStr)     : null
  const offerValorDeposito = offerValorDepositoStr ? parseFloat(offerValorDepositoStr) : null

  const aplicacao = await prisma.aplicacao.findUnique({
    where: { leadId },
    select: { id: true, offerRecebidaEm: true },
  })
  if (!aplicacao) return { error: 'Aplicação não encontrada.' }

  const isFirstOffer = offerRecebidaEm && !aplicacao.offerRecebidaEm

  await prisma.aplicacao.update({
    where: { id: aplicacao.id },
    data: { offerRecebidaEm, offerDeadline, offerValorDeposito },
  })

  // Business rule #3: primeira vez que offerRecebidaEm é preenchida → Tarefa
  if (isFirstOffer) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { consultorId: true },
    })
    if (lead) {
      const prazo = new Date()
      prazo.setDate(prazo.getDate() + 1)
      await prisma.tarefa.create({
        data: {
          leadId,
          responsavelId: lead.consultorId,
          titulo: 'Enviar offer à família',
          tipo: 'DOCUMENTO',
          status: 'PENDENTE',
          prazo,
        },
      })
    }
  }

  revalidatePath(`/leads/${leadId}`)
  return { success: true }
}
