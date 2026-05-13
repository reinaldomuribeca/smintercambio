'use client'

import { useState, useTransition, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Save,
  FileText,
} from 'lucide-react'
import {
  createAplicacao,
  updateChecklist,
  updatePortal,
  updateOffer,
  type ChecklistItem,
  type DocStatus,
  type PortalFormState,
  type OfferFormState,
} from '@/lib/actions/aplicacao'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AplicacaoProps = {
  id: string
  portalNome: string | null
  portalUrl: string | null
  portalLogin: string | null
  offerRecebidaEm: string | null
  offerDeadline: string | null
  offerValorDeposito: number | null
  checklistDocs: ChecklistItem[]
}

type Props = {
  leadId: string
  aplicacao: AplicacaoProps | null
  objetivoPrograma: string | null
  role: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NEXT_STATUS: Record<DocStatus, DocStatus> = {
  PENDENTE: 'ENVIADO',
  ENVIADO: 'APROVADO',
  APROVADO: 'PENDENTE',
}

const STATUS_CONFIG = {
  PENDENTE: {
    label: 'Pendente',
    bg: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    icon: AlertTriangle,
    dot: 'bg-red-400',
  },
  ENVIADO: {
    label: 'Enviado',
    bg: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
    icon: Clock,
    dot: 'bg-yellow-400',
  },
  APROVADO: {
    label: 'Aprovado',
    bg: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    icon: CheckCircle2,
    dot: 'bg-green-500',
  },
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function isDeadlineSoon(deadlineIso: string | null): boolean {
  if (!deadlineIso) return false
  const deadline = new Date(deadlineIso)
  const threshold = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  return deadline <= threshold
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

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

// ─── Form feedback ────────────────────────────────────────────────────────────

function SaveButton({ isPending, success }: { isPending: boolean; success: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-900/90 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {success && !isPending ? 'Salvo!' : 'Salvar'}
    </button>
  )
}

// ─── Checklist section ────────────────────────────────────────────────────────

function ChecklistSection({ leadId, initial }: { leadId: string; initial: ChecklistItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState<ChecklistItem[]>(initial)
  const [pending, setPending] = useState<Set<number>>(new Set())
  const [, startTransition] = useTransition()

  const total = items.filter((i) => i.obrigatorio).length
  const done  = items.filter((i) => i.obrigatorio && i.status === 'APROVADO').length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  const handleToggle = (index: number) => {
    if (pending.has(index)) return
    const next = NEXT_STATUS[items[index].status]
    const previous = items

    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, status: next } : item)))
    setPending((s) => new Set([...s, index]))

    startTransition(async () => {
      const result = await updateChecklist(leadId, index, next)
      setPending((s) => { const n = new Set(s); n.delete(index); return n })
      if (result.error) {
        setItems(previous)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Section title="Checklist de Documentos">
      {/* Progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            {done} de {total} documentos obrigatórios aprovados
          </span>
          <span className="font-semibold text-stone-700">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-stone-400">Checklist vazio — nenhum documento configurado.</p>
        )}
        {items.map((item, i) => {
          const cfg = STATUS_CONFIG[item.status]
          const Icon = cfg.icon
          const isPending = pending.has(i)
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-cream-200 bg-cream-50/40 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`size-2 shrink-0 rounded-full ${cfg.dot} ${item.obrigatorio ? '' : 'opacity-60'}`}
                />
                <span className={`truncate text-sm ${item.obrigatorio ? 'font-medium text-stone-800' : 'text-stone-500'}`}>
                  {item.nome}
                </span>
                {!item.obrigatorio && (
                  <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400">
                    opcional
                  </span>
                )}
              </div>

              <button
                onClick={() => handleToggle(i)}
                disabled={isPending}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${cfg.bg}`}
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Icon className="size-3" />
                )}
                {cfg.label}
                {!isPending && <ChevronRight className="size-3 opacity-50" />}
              </button>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ─── Portal section ───────────────────────────────────────────────────────────

function PortalSection({
  leadId,
  initial,
  showLogin,
}: {
  leadId: string
  initial: Pick<AplicacaoProps, 'portalNome' | 'portalUrl' | 'portalLogin'>
  showLogin: boolean
}) {
  const [state, action, isPending] = useActionState<PortalFormState, FormData>(updatePortal, null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
      const t = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <Section title="Portal de Aplicação">
      <form action={action} className="space-y-4">
        <input type="hidden" name="leadId" value={leadId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Nome do portal</label>
            <input
              name="portalNome"
              defaultValue={initial.portalNome ?? ''}
              placeholder="ex: OpenApply, True North…"
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Link do portal</label>
            <div className="relative">
              <input
                name="portalUrl"
                type="url"
                defaultValue={initial.portalUrl ?? ''}
                placeholder="https://…"
                className="w-full rounded-lg border border-cream-200 px-3 py-2 pr-8 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              {initial.portalUrl && (
                <a
                  href={initial.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-600"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {showLogin && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">
              Login / credenciais
              <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                confidencial
              </span>
            </label>
            <input
              name="portalLogin"
              defaultValue={initial.portalLogin ?? ''}
              placeholder="usuário:senha ou token"
              autoComplete="off"
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        )}

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex items-center gap-3">
          <SaveButton isPending={isPending} success={showSuccess} />
          {showSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" /> Salvo com sucesso
            </span>
          )}
        </div>
      </form>
    </Section>
  )
}

// ─── Offer section ────────────────────────────────────────────────────────────

function OfferSection({
  leadId,
  initial,
}: {
  leadId: string
  initial: Pick<AplicacaoProps, 'offerRecebidaEm' | 'offerDeadline' | 'offerValorDeposito'>
}) {
  const [state, action, isPending] = useActionState<OfferFormState, FormData>(updateOffer, null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [deadlineValue, setDeadlineValue] = useState(toDateInput(initial.offerDeadline))
  const soon = isDeadlineSoon(deadlineValue ? new Date(deadlineValue).toISOString() : null)

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true)
      const t = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <Section title="Offer da Escola">
      {soon && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="size-4 shrink-0 text-orange-500" />
          <p className="text-sm font-medium text-orange-700">
            Prazo da offer em até 3 dias — ação imediata necessária.
          </p>
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="leadId" value={leadId} />

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Data da offer</label>
            <input
              name="offerRecebidaEm"
              type="date"
              defaultValue={toDateInput(initial.offerRecebidaEm)}
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Prazo da offer</label>
            <input
              name="offerDeadline"
              type="date"
              value={deadlineValue}
              onChange={(e) => setDeadlineValue(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 ${
                soon
                  ? 'border-orange-300 bg-orange-50 focus:border-orange-400'
                  : 'border-cream-200 focus:border-amber-500'
              }`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Valor do depósito</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                USD
              </span>
              <input
                name="offerValorDeposito"
                type="number"
                min="0"
                step="0.01"
                defaultValue={initial.offerValorDeposito ?? ''}
                placeholder="0.00"
                className="w-full rounded-lg border border-cream-200 py-2 pl-12 pr-3 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex items-center gap-3">
          <SaveButton isPending={isPending} success={showSuccess} />
          {showSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" /> Salvo com sucesso
            </span>
          )}
        </div>
      </form>
    </Section>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function AbaAplicacao({ leadId, aplicacao, objetivoPrograma, role }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = async () => {
    setCreating(true)
    setCreateError(null)
    const result = await createAplicacao(leadId)
    setCreating(false)
    if (result.error) {
      setCreateError(result.error)
      return
    }
    router.refresh()
  }

  if (!aplicacao) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-sky-100">
          <FileText className="size-7 text-sky-600" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">Aplicação não iniciada</h3>
        <p className="mt-1.5 max-w-xs text-sm text-stone-500">
          {objetivoPrograma
            ? 'Clique abaixo para criar o registro e pré-popular o checklist com base no diagnóstico.'
            : 'Diagnóstico ainda não preenchido — o checklist iniciará vazio. Preencha o diagnóstico antes para usar o template correto.'}
        </p>
        {!objetivoPrograma && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
            <AlertTriangle className="size-3.5 shrink-0" />
            Sem diagnóstico — checklist iniciará vazio
          </div>
        )}
        {createError && (
          <p className="mt-3 text-sm text-red-600">{createError}</p>
        )}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
          Iniciar Aplicação
        </button>
      </div>
    )
  }

  const showLogin = role === 'DIRECAO' || role === 'OPERACOES'

  return (
    <div className="space-y-5">
      <ChecklistSection leadId={leadId} initial={aplicacao.checklistDocs} />
      <PortalSection
        leadId={leadId}
        initial={{ portalNome: aplicacao.portalNome, portalUrl: aplicacao.portalUrl, portalLogin: aplicacao.portalLogin }}
        showLogin={showLogin}
      />
      <OfferSection
        leadId={leadId}
        initial={{
          offerRecebidaEm: aplicacao.offerRecebidaEm,
          offerDeadline: aplicacao.offerDeadline,
          offerValorDeposito: aplicacao.offerValorDeposito,
        }}
      />
    </div>
  )
}
