'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { X } from 'lucide-react'

const SELECT_CLASS =
  'h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

const PERIODO_OPTIONS = [
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes',    label: 'Este mês'   },
  { value: 'ano',    label: 'Este ano'   },
]

type Props = {
  currentParams: Record<string, string | undefined>
  consultores: { id: string; nome: string }[]
  showConsultorFilter: boolean
}

export function DashboardFiltros({ currentParams, consultores, showConsultorFilter }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) { params.set(key, value) } else { params.delete(key) }
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams],
  )

  const hasExtra =
    searchParams.has('consultor') ||
    (searchParams.get('periodo') && searchParams.get('periodo') !== 'mes')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={SELECT_CLASS}
        defaultValue={currentParams.periodo ?? 'mes'}
        onChange={(e) => setParam('periodo', e.target.value)}
      >
        {PERIODO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {showConsultorFilter && (
        <select
          className={SELECT_CLASS}
          defaultValue={currentParams.consultor ?? ''}
          onChange={(e) => setParam('consultor', e.target.value)}
        >
          <option value="">Todos os consultores</option>
          {consultores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      )}

      {hasExtra && (
        <button
          onClick={() => router.push(pathname)}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-stone-500 transition hover:bg-cream-100 hover:text-stone-700"
        >
          <X className="size-3.5" /> Limpar
        </button>
      )}
    </div>
  )
}
