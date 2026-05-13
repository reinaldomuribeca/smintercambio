'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ComissaoStatus, Role } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PagamentoItem = {
  descricao: string
  valor: number
  moeda: string
  dataPago: string | null
}

export type FinanceiroState = { error?: string; success?: boolean } | null

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

function canEditFinanceiro(role: Role): boolean {
  return role === Role.DIRECAO || role === Role.ADMINISTRATIVO || role === Role.FINANCEIRO
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFloat_(s: string | null): number | null {
  if (!s || s.trim() === '') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function parseDate(s: string | null): Date | null {
  if (!s || s.trim() === '') return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// ─── upsertFinanceiro ─────────────────────────────────────────────────────────

export async function upsertFinanceiro(
  _prev: FinanceiroState,
  formData: FormData,
): Promise<FinanceiroState> {
  const { role } = await getAuth()
  if (!canEditFinanceiro(role)) return { error: 'Sem permissão para editar dados financeiros.' }

  const leadId = formData.get('leadId') as string

  const data = {
    moeda:              (formData.get('moeda') as string) || null,
    cambioUsado:        parseFloat_(formData.get('cambioUsado') as string),
    tuitionValor:       parseFloat_(formData.get('tuitionValor') as string),
    valorBoarding:      parseFloat_(formData.get('valorBoarding') as string),
    valorSeguro:        parseFloat_(formData.get('valorSeguro') as string),
    taxasExtras:        parseFloat_(formData.get('taxasExtras') as string),
    applicationFee:     parseFloat_(formData.get('applicationFee') as string),
    registrationFee:    parseFloat_(formData.get('registrationFee') as string),
    acceptanceDeposit:  parseFloat_(formData.get('acceptanceDeposit') as string),
    taxaAdministrativa: parseFloat_(formData.get('taxaAdministrativa') as string),
    consultoriaSM:      parseFloat_(formData.get('consultoriaSM') as string),
    comissaoPrevista:   parseFloat_(formData.get('comissaoPrevista') as string),
    comissaoRecebida:   parseFloat_(formData.get('comissaoRecebida') as string),
    comissaoDataPrevista: parseDate(formData.get('comissaoDataPrevista') as string),
    comissaoStatus:     (formData.get('comissaoStatus') as ComissaoStatus) || ComissaoStatus.PENDENTE,
  }

  await prisma.financeiro.upsert({
    where: { leadId },
    create: { leadId, ...data },
    update: data,
  })

  revalidatePath(`/leads/${leadId}`)
  return { success: true }
}

// ─── addPagamento ─────────────────────────────────────────────────────────────

export async function addPagamento(
  leadId: string,
  pagamento: PagamentoItem,
): Promise<{ error?: string }> {
  const { role } = await getAuth()
  if (!canEditFinanceiro(role)) return { error: 'Sem permissão.' }

  const fin = await prisma.financeiro.findUnique({
    where: { leadId },
    select: { id: true, pagamentosFamilia: true },
  })
  if (!fin) return { error: 'Registro financeiro não encontrado. Salve os dados financeiros primeiro.' }

  const current = (fin.pagamentosFamilia as unknown as PagamentoItem[]) ?? []
  const updated = [...current, pagamento]

  await prisma.financeiro.update({
    where: { id: fin.id },
    data: { pagamentosFamilia: updated as object[] },
  })

  revalidatePath(`/leads/${leadId}`)
  return {}
}

// ─── removePagamento ──────────────────────────────────────────────────────────

export async function removePagamento(
  leadId: string,
  index: number,
): Promise<{ error?: string }> {
  const { role } = await getAuth()
  if (!canEditFinanceiro(role)) return { error: 'Sem permissão.' }

  const fin = await prisma.financeiro.findUnique({
    where: { leadId },
    select: { id: true, pagamentosFamilia: true },
  })
  if (!fin) return { error: 'Registro financeiro não encontrado.' }

  const current = (fin.pagamentosFamilia as unknown as PagamentoItem[]) ?? []
  if (index < 0 || index >= current.length) return { error: 'Pagamento inválido.' }

  const updated = current.filter((_, i) => i !== index)

  await prisma.financeiro.update({
    where: { id: fin.id },
    data: { pagamentosFamilia: updated as object[] },
  })

  revalidatePath(`/leads/${leadId}`)
  return {}
}
