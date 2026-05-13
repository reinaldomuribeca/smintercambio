'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { OrigemLead } from '@prisma/client'

type Consultor = { id: string; nome: string }

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'NOVO_LEAD',             label: 'Novo lead' },
  { value: 'REUNIAO_AGENDADA',      label: 'Reunião agendada' },
  { value: 'REUNIAO_REALIZADA',     label: 'Reunião realizada' },
  { value: 'DIAGNOSTICO_CONCLUIDO', label: 'Diagnóstico concluído' },
  { value: 'PROPOSTA_ENVIADA',      label: 'Proposta enviada' },
  { value: 'FOLLOWUP_ESTRATEGICO',  label: 'Follow-up estratégico' },
  { value: 'EM_DECISAO',            label: 'Em decisão' },
  { value: 'EM_APLICACAO',          label: 'Em aplicação' },
  { value: 'DOCUMENTACAO_PENDENTE', label: 'Doc. pendente' },
  { value: 'APPLICATION_ENVIADA',   label: 'Application enviada' },
  { value: 'ENTREVISTA_TESTE',      label: 'Entrevista/Teste' },
  { value: 'ACEITO_PELA_ESCOLA',    label: 'Aceito pela escola' },
  { value: 'OFFER_ENVIADA',         label: 'Offer enviada' },
  { value: 'DEPOSIT_PAGO',          label: 'Depósito pago' },
  { value: 'TUITION_PARCIAL',       label: 'Tuition parcial' },
  { value: 'TUITION_QUITADA',       label: 'Tuition quitada' },
  { value: 'MATRICULADO',           label: 'Matriculado' },
  { value: 'VISTO',                 label: 'Visto' },
  { value: 'EMBARQUE',              label: 'Embarque' },
  { value: 'EM_PROGRAMA',           label: 'Em programa' },
  { value: 'SEM_RETORNO',           label: 'Sem retorno' },
  { value: 'SEM_BUDGET',            label: 'Sem budget' },
  { value: 'FECHOU_CONCORRENTE',    label: 'Fechou concorrente' },
  { value: 'DESISTIU',              label: 'Desistiu' },
]

const ORIGEM_OPTIONS: { value: OrigemLead; label: string }[] = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK',  label: 'Facebook' },
  { value: 'GOOGLE',    label: 'Google' },
  { value: 'SITE',      label: 'Site' },
  { value: 'FEIRA',     label: 'Feira' },
  { value: 'EVENTO',    label: 'Evento' },
  { value: 'WHATSAPP',  label: 'WhatsApp' },
  { value: 'OUTRO',     label: 'Outro' },
]

const SELECT_CLASS =
  'h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50'

type Props = {
  role: string
  consultores: Consultor[]
  currentParams: Record<string, string | undefined>
}

export function LeadsFilters({ role, consultores, currentParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset paginação ao filtrar
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  const hasFilters =
    searchParams.has('search') ||
    searchParams.has('status') ||
    searchParams.has('consultorId') ||
    searchParams.has('origem')

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          placeholder="Buscar por nome ou responsável…"
          defaultValue={currentParams.search ?? ''}
          className="h-8 w-56 rounded-lg border border-cream-200 bg-white pl-8 pr-3 text-sm text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          onChange={(e) => {
            const v = e.target.value
            // debounce simples com setTimeout
            const t = setTimeout(() => setParam('search', v), 350)
            return () => clearTimeout(t)
          }}
        />
      </div>

      {/* Status */}
      <select
        className={SELECT_CLASS}
        defaultValue={currentParams.status ?? ''}
        onChange={(e) => setParam('status', e.target.value)}
      >
        <option value="">Status</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Origem */}
      <select
        className={SELECT_CLASS}
        defaultValue={currentParams.origem ?? ''}
        onChange={(e) => setParam('origem', e.target.value)}
      >
        <option value="">Origem</option>
        {ORIGEM_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Consultor — apenas DIRECAO */}
      {role === 'DIRECAO' && consultores.length > 0 && (
        <select
          className={SELECT_CLASS}
          defaultValue={currentParams.consultorId ?? ''}
          onChange={(e) => setParam('consultorId', e.target.value)}
        >
          <option value="">Consultor</option>
          {consultores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      )}

      {/* Limpar filtros */}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-stone-500 transition hover:bg-cream-100 hover:text-stone-700"
        >
          <X className="size-3.5" />
          Limpar
        </button>
      )}
    </div>
  )
}
