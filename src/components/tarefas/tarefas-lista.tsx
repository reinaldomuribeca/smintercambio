'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, isToday, isPast, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle2, Circle, AlertTriangle, Clock,
  Calendar, FileText, Bell, RefreshCw, Inbox,
} from 'lucide-react'
import { TarefaTipo, TarefaStatus } from '@prisma/client'
import { updateTarefaStatus, type TarefaItem } from '@/lib/actions/tarefas'

// ─── Config ───────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TarefaTipo, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  FOLLOWUP:   { label: 'Follow-up',   bg: 'bg-blue-50',    text: 'text-blue-700',    icon: RefreshCw },
  DOCUMENTO:  { label: 'Documento',   bg: 'bg-yellow-50',  text: 'text-yellow-700',  icon: FileText  },
  REUNIAO:    { label: 'Reunião',     bg: 'bg-violet-50',  text: 'text-violet-700',  icon: Calendar  },
  ALERTA:     { label: 'Alerta',      bg: 'bg-red-50',     text: 'text-red-700',     icon: Bell      },
  OUTRO:      { label: 'Outro',       bg: 'bg-stone-50',   text: 'text-stone-600',   icon: FileText  },
  FECHAMENTO: { label: 'Fechamento',  bg: 'bg-emerald-50', text: 'text-emerald-700', icon: FileText  },
}

function getRowState(t: TarefaItem): 'done' | 'overdue' | 'today' | 'normal' {
  if (t.status === TarefaStatus.CONCLUIDA) return 'done'
  if (!t.prazo) return 'normal'
  const d = new Date(t.prazo)
  if (isPast(startOfDay(d)) && !isToday(d)) return 'overdue'
  if (isToday(d)) return 'today'
  return 'normal'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TarefasLista({ tarefas }: { tarefas: TarefaItem[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [optimisticTarefas, setOptimistic] = useOptimistic(
    tarefas,
    (state, { id, status }: { id: string; status: TarefaStatus }) =>
      state.map((t) =>
        t.id === id
          ? { ...t, status, concluidaEm: status === TarefaStatus.CONCLUIDA ? new Date().toISOString() : null }
          : t,
      ),
  )

  const handleToggle = (tarefa: TarefaItem) => {
    if (tarefa.status === TarefaStatus.CANCELADA) return
    const nextStatus =
      tarefa.status === TarefaStatus.CONCLUIDA ? TarefaStatus.PENDENTE : TarefaStatus.CONCLUIDA

    startTransition(async () => {
      setOptimistic({ id: tarefa.id, status: nextStatus })
      await updateTarefaStatus(tarefa.id, nextStatus)
      router.refresh()
    })
  }

  if (optimisticTarefas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-20 text-center">
        <Inbox className="mb-3 size-10 text-stone-300" />
        <p className="font-medium text-stone-500">Nenhuma tarefa encontrada</p>
        <p className="mt-1 text-sm text-stone-400">Tente ajustar os filtros.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream-200 bg-cream-50">
            <th className="w-10 px-4 py-3" />
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Tarefa</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 md:table-cell">Lead</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 sm:table-cell">Prazo</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 lg:table-cell">Responsável</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Tipo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-100">
          {optimisticTarefas.map((tarefa) => {
            const rowState = getRowState(tarefa)
            const cfg = TIPO_CONFIG[tarefa.tipo]
            const Icon = cfg.icon
            const isDone = tarefa.status === TarefaStatus.CONCLUIDA

            return (
              <tr
                key={tarefa.id}
                className={`group transition-colors ${
                  rowState === 'overdue' ? 'bg-red-50/40 hover:bg-red-50/60' :
                  rowState === 'today'   ? 'bg-orange-50/40 hover:bg-orange-50/60' :
                  isDone                 ? 'opacity-50 hover:opacity-70' :
                                           'hover:bg-cream-50'
                }`}
              >
                {/* Checkbox */}
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => handleToggle(tarefa)}
                    className={`transition-colors ${
                      isDone ? 'text-emerald-500 hover:text-stone-400' : 'text-stone-300 hover:text-emerald-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                  </button>
                </td>

                {/* Titulo + badges */}
                <td className="px-4 py-3.5">
                  <Link href={`/leads/${tarefa.lead.id}`} className="block">
                    <span className={`font-medium ${isDone ? 'line-through text-stone-400' : 'text-stone-900 group-hover:text-amber-600'}`}>
                      {tarefa.titulo}
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      {rowState === 'overdue' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                          <AlertTriangle className="size-2.5" /> Vencida
                        </span>
                      )}
                      {rowState === 'today' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                          <Clock className="size-2.5" /> Hoje
                        </span>
                      )}
                    </div>
                  </Link>
                </td>

                {/* Lead */}
                <td className="hidden px-4 py-3.5 md:table-cell">
                  <Link
                    href={`/leads/${tarefa.lead.id}`}
                    className="text-stone-600 hover:text-amber-600 hover:underline"
                  >
                    {tarefa.lead.nome}
                  </Link>
                </td>

                {/* Prazo */}
                <td className={`hidden px-4 py-3.5 text-sm sm:table-cell ${
                  rowState === 'overdue' ? 'font-medium text-red-600' :
                  rowState === 'today'   ? 'font-medium text-orange-600' :
                                           'text-stone-500'
                }`}>
                  {tarefa.prazo
                    ? format(new Date(tarefa.prazo), "dd/MM/yyyy", { locale: ptBR })
                    : '—'}
                </td>

                {/* Responsável */}
                <td className="hidden px-4 py-3.5 text-stone-500 lg:table-cell">
                  {tarefa.responsavel.nome}
                </td>

                {/* Tipo */}
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                    <Icon className="size-2.5" />
                    {cfg.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
