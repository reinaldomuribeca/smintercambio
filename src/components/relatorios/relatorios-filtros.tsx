'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { X } from 'lucide-react'

const INPUT_CLASS =
  'h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

type Props = {
  currentParams: Record<string, string | undefined>
  consultores: { id: string; nome: string }[]
  showConsultorFilter: boolean
  defaultDe: string
  defaultAte: string
}

export function RelatoriosFiltros({
  currentParams,
  consultores,
  showConsultorFilter,
  defaultDe,
  defaultAte,
}: Props) {
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

  const hasFilters =
    searchParams.has('consultor') ||
    searchParams.get('de') !== defaultDe ||
    searchParams.get('ate') !== defaultAte

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-stone-400">De</span>
        <input
          type="date"
          className={INPUT_CLASS}
          defaultValue={currentParams.de ?? defaultDe}
          onChange={(e) => setParam('de', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-stone-400">até</span>
        <input
          type="date"
          className={INPUT_CLASS}
          defaultValue={currentParams.ate ?? defaultAte}
          onChange={(e) => setParam('ate', e.target.value)}
        />
      </div>

      {showConsultorFilter && (
        <select
          className={INPUT_CLASS}
          defaultValue={currentParams.consultor ?? ''}
          onChange={(e) => setParam('consultor', e.target.value)}
        >
          <option value="">Todos os consultores</option>
          {consultores.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      )}

      {hasFilters && (
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
