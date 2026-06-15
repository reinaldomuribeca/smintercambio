'use client'

import { useState, useTransition, useActionState, useEffect, useRef } from 'react'
import {
  Lock,
  Plus,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  Wallet,
  Save,
  CheckCircle2,
} from 'lucide-react'
import {
  upsertFinanceiro,
  addPagamento,
  removePagamento,
  type PagamentoItem,
  type FinanceiroState,
} from '@/lib/actions/financeiro'
import { ComissaoStatus } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FinanceiroProps = {
  id: string
  moeda: string | null
  cambioUsado: number | null
  tuitionValor: number | null
  valorBoarding: number | null
  valorSeguro: number | null
  taxasExtras: number | null
  applicationFee: number | null
  registrationFee: number | null
  acceptanceDeposit: number | null
  taxaAdministrativa: number | null
  consultoriaSM: number | null
  comissaoPrevista: number | null
  comissaoRecebida: number | null
  comissaoDataPrevista: string | null
  comissaoStatus: ComissaoStatus
  pagamentosFamilia: PagamentoItem[]
}

type Props = {
  leadId: string
  financeiro: FinanceiroProps | null
  role: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOEDAS = ['USD', 'GBP', 'EUR', 'CHF', 'AUD', 'CAD'] as const

const COMISSAO_STATUS_LABEL: Record<ComissaoStatus, string> = {
  PENDENTE: 'Pendente',
  PARCIAL:  'Parcial',
  RECEBIDA: 'Recebida',
}

const COMISSAO_STATUS_STYLE: Record<ComissaoStatus, string> = {
  PENDENTE: 'bg-red-50 text-red-700',
  PARCIAL:  'bg-yellow-50 text-yellow-700',
  RECEBIDA: 'bg-emerald-50 text-emerald-700',
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtFX = (v: number, currency: string) => {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(v)
  } catch {
    return `${currency} ${v.toFixed(2)}`
  }
}

const toDateInput = (iso: string | null) => (iso ? iso.split('T')[0] : '')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white shadow-sm">
      <div className="border-b border-cream-100 px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-stone-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

const numInputCls = `${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`

// ─── Acesso restrito ──────────────────────────────────────────────────────────

function AcessoRestrito() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-stone-100">
        <Lock className="size-7 text-stone-400" />
      </div>
      <h3 className="text-base font-semibold text-stone-700">Acesso Restrito</h3>
      <p className="mt-1.5 max-w-xs text-sm text-stone-400">
        As informações financeiras estão disponíveis apenas para Direção e Administrativo.
      </p>
    </div>
  )
}

// ─── Dialog de pagamento ──────────────────────────────────────────────────────

type DialogProps = {
  defaultMoeda: string
  onClose: () => void
  onAdd: (item: PagamentoItem) => void
  isAdding: boolean
}

function PagamentoDialog({ defaultMoeda, onClose, onAdd, isAdding }: DialogProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const valor = parseFloat(fd.get('valor') as string)
    if (!valor || isNaN(valor)) return

    onAdd({
      descricao: (fd.get('descricao') as string).trim() || 'Pagamento',
      valor,
      moeda: fd.get('moeda') as string,
      dataPago: (fd.get('dataPago') as string) || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md rounded-2xl border border-cream-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-stone-400 hover:bg-cream-100"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900/8 bg-navy-900/10">
            <Wallet className="size-5 text-navy-900" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">Adicionar Pagamento</h2>
            <p className="text-xs text-stone-500">Registro de pagamento recebido da família</p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <Field label="Descrição">
            <input
              name="descricao"
              placeholder="ex: 1ª parcela tuition, matrícula…"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor">
              <input
                name="valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                className={numInputCls}
              />
            </Field>
            <Field label="Moeda">
              <select name="moeda" defaultValue={defaultMoeda} className={inputCls}>
                {MOEDAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Data do pagamento">
            <input name="dataPago" type="date" className={inputCls} />
          </Field>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-cream-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-cream-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-900/90 disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AbaFinanceiro({ leadId, financeiro, role }: Props) {
  if (role !== 'DIRECAO' && role !== 'ADMINISTRATIVO' && role !== 'FINANCEIRO') {
    return <AcessoRestrito />
  }

  return <FinanceiroInner leadId={leadId} financeiro={financeiro} />
}

// Inner component (avoids hook calls behind access check)
function FinanceiroInner({ leadId, financeiro }: { leadId: string; financeiro: FinanceiroProps | null }) {
  // ── Controlled state for live BRL calculation ──
  const [moeda, setMoeda]       = useState(financeiro?.moeda ?? 'USD')
  const [cambio, setCambio]     = useState(financeiro?.cambioUsado ?? 0)
  const [tuition, setTuition]   = useState(financeiro?.tuitionValor ?? 0)
  const [boarding, setBoarding] = useState(financeiro?.valorBoarding ?? 0)
  const [seguro, setSeguro]     = useState(financeiro?.valorSeguro ?? 0)
  const [taxas, setTaxas]       = useState(financeiro?.taxasExtras ?? 0)

  // ── Pagamentos state ──
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>(
    financeiro?.pagamentosFamilia ?? [],
  )
  const [showDialog, setShowDialog] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const [pagamentoError, setPagamentoError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // ── Form state ──
  const [formState, formAction, isPending] = useActionState<FinanceiroState, FormData>(
    upsertFinanceiro,
    null,
  )
  const [successHidden, setSuccessHidden] = useState<unknown>(null)
  const showSuccess = !!formState?.success && successHidden !== formState

  useEffect(() => {
    if (formState?.success) {
      // setState só dentro do timeout (assíncrono) — evita render em cascata.
      const t = setTimeout(() => setSuccessHidden(formState), 3000)
      return () => clearTimeout(t)
    }
  }, [formState])

  // ── Calculations ──
  const totalOriginal  = tuition + boarding + seguro + taxas
  const totalBRL       = totalOriginal * cambio
  const totalPagoBRL   = pagamentos.reduce((sum, p) => sum + p.valor * cambio, 0)
  const saldoPendente  = totalBRL - totalPagoBRL

  // ── Pagamento handlers ──
  const handleAdd = (item: PagamentoItem) => {
    setPagamentoError(null)
    const optimistic = [...pagamentos, item]
    setPagamentos(optimistic)
    setShowDialog(false)

    startTransition(async () => {
      const result = await addPagamento(leadId, item)
      if (result.error) {
        setPagamentos(pagamentos) // revert
        setPagamentoError(result.error)
      }
    })
  }

  const handleRemove = (index: number) => {
    setPagamentoError(null)
    const previous = pagamentos
    setRemovingIndex(index)
    const optimistic = pagamentos.filter((_, i) => i !== index)
    setPagamentos(optimistic)

    startTransition(async () => {
      const result = await removePagamento(leadId, index)
      setRemovingIndex(null)
      if (result.error) {
        setPagamentos(previous) // revert
        setPagamentoError(result.error)
      }
    })
  }

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="leadId" value={leadId} />

        {/* ── Seção: Valores do Programa ── */}
        <Section title="Valores do Programa">
          {/* Moeda + câmbio */}
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Moeda do programa">
              <select
                name="moeda"
                value={moeda}
                onChange={(e) => setMoeda(e.target.value)}
                className={inputCls}
              >
                {MOEDAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Câmbio utilizado">
              <input
                name="cambioUsado"
                type="number"
                min="0"
                step="0.0001"
                value={cambio || ''}
                onChange={(e) => setCambio(parseFloat(e.target.value) || 0)}
                placeholder="ex: 5.8750"
                className={numInputCls}
              />
            </Field>
          </div>

          {/* Valores */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Tuition">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{moeda}</span>
                <input
                  name="tuitionValor"
                  type="number" min="0" step="0.01"
                  value={tuition || ''}
                  onChange={(e) => setTuition(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`${numInputCls} pl-12`}
                />
              </div>
            </Field>
            <Field label="Boarding / Moradia">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{moeda}</span>
                <input
                  name="valorBoarding"
                  type="number" min="0" step="0.01"
                  value={boarding || ''}
                  onChange={(e) => setBoarding(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`${numInputCls} pl-12`}
                />
              </div>
            </Field>
            <Field label="Seguro saúde">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{moeda}</span>
                <input
                  name="valorSeguro"
                  type="number" min="0" step="0.01"
                  value={seguro || ''}
                  onChange={(e) => setSeguro(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`${numInputCls} pl-12`}
                />
              </div>
            </Field>
            <Field label="Taxas extras">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{moeda}</span>
                <input
                  name="taxasExtras"
                  type="number" min="0" step="0.01"
                  value={taxas || ''}
                  onChange={(e) => setTaxas(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`${numInputCls} pl-12`}
                />
              </div>
            </Field>
          </div>

          {/* BRL total */}
          <div className="flex items-center justify-between rounded-xl border border-navy-900/10 bg-navy-900/5 px-5 py-4">
            <div>
              <p className="text-xs font-medium text-stone-500">Total do programa em {moeda}</p>
              <p className="mt-0.5 text-sm font-semibold text-stone-700">
                {totalOriginal > 0 ? fmtFX(totalOriginal, moeda) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-stone-500">Equivalente em BRL</p>
              <p className="mt-0.5 font-brand text-2xl font-semibold text-navy-900">
                {totalBRL > 0 ? fmtBRL(totalBRL) : '—'}
              </p>
            </div>
          </div>
        </Section>

        {/* ── Seção: Taxas Iniciais ── */}
        <Section title="Taxas Iniciais">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`Application Fee (${moeda})`}>
              <input
                name="applicationFee"
                type="number" min="0" step="0.01"
                defaultValue={financeiro?.applicationFee ?? ''}
                placeholder="0.00"
                className={numInputCls}
              />
            </Field>
            <Field label={`Registration Fee (${moeda})`}>
              <input
                name="registrationFee"
                type="number" min="0" step="0.01"
                defaultValue={financeiro?.registrationFee ?? ''}
                placeholder="0.00"
                className={numInputCls}
              />
            </Field>
            <Field label={`Acceptance Deposit (${moeda})`}>
              <input
                name="acceptanceDeposit"
                type="number" min="0" step="0.01"
                defaultValue={financeiro?.acceptanceDeposit ?? ''}
                placeholder="0.00"
                className={numInputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ── Seção: Serviços SM ── */}
        <Section title="Serviços SM">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Field label="Taxa administrativa (BRL)">
              <input
                name="taxaAdministrativa"
                type="number" min="0" step="0.01"
                defaultValue={financeiro?.taxaAdministrativa ?? ''}
                placeholder="0.00"
                className={numInputCls}
              />
            </Field>
            <Field label="Consultoria SM (BRL)">
              <input
                name="consultoriaSM"
                type="number" min="0" step="0.01"
                defaultValue={financeiro?.consultoriaSM ?? ''}
                placeholder="0.00"
                className={numInputCls}
              />
            </Field>
          </div>

          <div className="border-t border-cream-100 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Comissão</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={`Prevista (${moeda})`}>
                <input
                  name="comissaoPrevista"
                  type="number" min="0" step="0.01"
                  defaultValue={financeiro?.comissaoPrevista ?? ''}
                  placeholder="0.00"
                  className={numInputCls}
                />
              </Field>
              <Field label={`Recebida (${moeda})`}>
                <input
                  name="comissaoRecebida"
                  type="number" min="0" step="0.01"
                  defaultValue={financeiro?.comissaoRecebida ?? ''}
                  placeholder="0.00"
                  className={numInputCls}
                />
              </Field>
              <Field label="Data prevista">
                <input
                  name="comissaoDataPrevista"
                  type="date"
                  defaultValue={toDateInput(financeiro?.comissaoDataPrevista ?? null)}
                  className={inputCls}
                />
              </Field>
              <Field label="Status">
                <select
                  name="comissaoStatus"
                  defaultValue={financeiro?.comissaoStatus ?? 'PENDENTE'}
                  className={inputCls}
                >
                  {Object.entries(COMISSAO_STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Status badge preview */}
            {financeiro?.comissaoStatus && (
              <div className="mt-3 inline-flex">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COMISSAO_STATUS_STYLE[financeiro.comissaoStatus]}`}>
                  {COMISSAO_STATUS_LABEL[financeiro.comissaoStatus]}
                </span>
              </div>
            )}
          </div>

          {/* Save button */}
          {formState?.error && (
            <p className="mt-4 text-sm text-red-600">{formState.error}</p>
          )}
          <div className="mt-5 flex items-center gap-3 border-t border-cream-100 pt-5">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-900/90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar Financeiro
            </button>
            {showSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" /> Salvo com sucesso
              </span>
            )}
          </div>
        </Section>
      </form>

      {/* ── Seção: Pagamentos da Família ── */}
      <Section title="Pagamentos da Família">
        {pagamentoError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {pagamentoError}
          </div>
        )}
        {/* Table */}
        {pagamentos.length === 0 ? (
          <p className="mb-4 text-sm text-stone-400">Nenhum pagamento registrado.</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl border border-cream-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Descrição</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Valor</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 sm:table-cell">Data</th>
                  <th className="w-10 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {pagamentos.map((p, i) => (
                  <tr key={i} className="transition-colors hover:bg-cream-50">
                    <td className="px-4 py-3 text-stone-700">{p.descricao}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">
                      {fmtFX(p.valor, p.moeda)}
                      {cambio > 0 && (
                        <span className="ml-2 text-xs text-stone-400">
                          ≈ {fmtBRL(p.valor * cambio)}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-stone-500 sm:table-cell">
                      {p.dataPago ? new Date(p.dataPago).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemove(i)}
                        disabled={removingIndex === i}
                        className="rounded-md p-1 text-stone-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      >
                        {removingIndex === i ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              <p className="text-xs font-medium text-emerald-700">Total pago (BRL estimado)</p>
            </div>
            <p className="mt-1 font-brand text-xl font-semibold text-emerald-800">
              {totalPagoBRL > 0 ? fmtBRL(totalPagoBRL) : cambio === 0 ? 'Informe o câmbio' : fmtBRL(0)}
            </p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${saldoPendente > 0 ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex items-center gap-2">
              <Wallet className={`size-4 ${saldoPendente > 0 ? 'text-orange-600' : 'text-emerald-600'}`} />
              <p className={`text-xs font-medium ${saldoPendente > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
                Saldo pendente (BRL)
              </p>
            </div>
            <p className={`mt-1 font-brand text-xl font-semibold ${saldoPendente > 0 ? 'text-orange-800' : 'text-emerald-800'}`}>
              {totalBRL > 0 ? fmtBRL(Math.max(0, saldoPendente)) : '—'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white"
        >
          <Plus className="size-4" />
          Adicionar Pagamento
        </button>
      </Section>

      {/* Dialog */}
      {showDialog && (
        <PagamentoDialog
          defaultMoeda={moeda}
          onClose={() => setShowDialog(false)}
          onAdd={handleAdd}
          isAdding={false}
        />
      )}
    </>
  )
}
