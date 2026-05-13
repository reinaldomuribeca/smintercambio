'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { X } from 'lucide-react'
import { TarefaTipo, TarefaStatus } from '@prisma/client'

const SELECT_CLASS =
  'h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

const STATUS_OPTIONS: { value: TarefaStatus; label: string }[] = [
  { value: 'PENDENTE',  label: 'Pendente'  },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const TIPO_OPTIONS: { value: TarefaTipo; label: string }[] = [
  { value: 'FOLLOWUP',   label: 'Follow-up'  },
  { value: 'DOCUMENTO',  label: 'Documento'  },
  { value: 'REUNIAO',    label: 'Reunião'    },
  { value: 'ALERTA',     label: 'Alerta'     },
  { value: 'FECHAMENTO', label: 'Fechamento' },
  { value: 'OUTRO',      label: 'Outro'      },
]

const PRAZO_OPTIONS = [
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: 'hoje',      label: 'Hoje'       },
  { value: 'semana',    label: 'Esta semana' },
]

type Props = { currentParams: Record<string, string | undefined> }

export function TarefasFiltros({ currentParams }: Props) {
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
    searchParams.has('status') || searchParams.has('tipo') || searchParams.has('prazo')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={SELECT_CLASS}
        defaultValue={currentParams.prazo ?? ''}
        onChange={(e) => setParam('prazo', e.target.value)}
      >
        <option value="">Prazo</option>
        {PRAZO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

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

      <select
        className={SELECT_CLASS}
        defaultValue={currentParams.tipo ?? ''}
        onChange={(e) => setParam('tipo', e.target.value)}
      >
        <option value="">Tipo</option>
        {TIPO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

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
