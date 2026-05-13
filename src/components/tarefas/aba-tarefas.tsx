'use client'

import { useState, useTransition, useActionState, useEffect, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, CheckCircle2, Circle, AlertTriangle, Clock,
  Calendar, FileText, Bell, RefreshCw, Loader2,
} from 'lucide-react'
import { format, isToday, isPast, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TarefaTipo, TarefaStatus } from '@prisma/client'
import {
  createTarefa,
  updateTarefaStatus,
  type TarefaItem,
  type CreateTarefaState,
} from '@/lib/actions/tarefas'

// ─── Config ───────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TarefaTipo, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  FOLLOWUP:   { label: 'Follow-up',   bg: 'bg-blue-50',    text: 'text-blue-700',    icon: RefreshCw },
  DOCUMENTO:  { label: 'Documento',   bg: 'bg-yellow-50',  text: 'text-yellow-700',  icon: FileText  },
  REUNIAO:    { label: 'Reunião',     bg: 'bg-violet-50',  text: 'text-violet-700',  icon: Calendar  },
  ALERTA:     { label: 'Alerta',      bg: 'bg-red-50',     text: 'text-red-700',     icon: Bell      },
  OUTRO:      { label: 'Outro',       bg: 'bg-stone-50',   text: 'text-stone-600',   icon: FileText  },
  FECHAMENTO: { label: 'Fechamento',  bg: 'bg-emerald-50', text: 'text-emerald-700', icon: FileText  },
}

const TIPO_OPTIONS = Object.entries(TIPO_CONFIG).map(([value, cfg]) => ({
  value: value as TarefaTipo,
  label: cfg.label,
}))

const inputCls =
  'w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

// ─── Row state ────────────────────────────────────────────────────────────────

function getRowState(t: TarefaItem): 'done' | 'overdue' | 'today' | 'normal' {
  if (t.status === TarefaStatus.CONCLUIDA) return 'done'
  if (!t.prazo) return 'normal'
  const d = new Date(t.prazo)
  if (isPast(startOfDay(d)) && !isToday(d)) return 'overdue'
  if (isToday(d)) return 'today'
  return 'normal'
}

const ROW_STYLE: Record<ReturnType<typeof getRowState>, string> = {
  done:    'opacity-50',
  overdue: 'border-red-100 bg-red-50/40',
  today:   'border-orange-100 bg-orange-50/40',
  normal:  'border-cream-200 bg-white',
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

type DialogProps = {
  leadId: string
  usuarios: { id: string; nome: string }[]
  currentUserId: string
  onClose: () => void
}

function TarefaDialog({ leadId, usuarios, currentUserId, onClose }: DialogProps) {
  const router = useRouter()
  const [state, action, isPending] = useActionState<CreateTarefaState, FormData>(createTarefa, null)

  useEffect(() => {
    if (state?.created) {
      onClose()
      router.refresh()
    }
  }, [state?.created])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md rounded-2xl border border-cream-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-stone-400 hover:bg-cream-100"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-5 text-base font-semibold text-stone-900">Nova Tarefa</h2>

        <form action={action} className="space-y-4">
          <input type="hidden" name="leadId" value={leadId} />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">
              Título <span className="text-red-500">*</span>
            </label>
            <input name="titulo" required placeholder="Descreva a tarefa…" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-600">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select name="tipo" required className={inputCls}>
                <option value="">Selecione…</option>
                {TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-600">
                Prazo <span className="text-red-500">*</span>
              </label>
              <input name="prazo" type="date" required className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">
              Responsável <span className="text-red-500">*</span>
            </label>
            <select name="responsavelId" required defaultValue={currentUserId} className={inputCls}>
              <option value="">Selecione…</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Descrição</label>
            <textarea
              name="descricao"
              rows={2}
              placeholder="Detalhes opcionais…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-900/90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  leadId: string
  initialTarefas: TarefaItem[]
  usuarios: { id: string; nome: string }[]
  currentUserId: string
}

export function AbaTarefas({ leadId, initialTarefas, usuarios, currentUserId }: Props) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [, startTransition] = useTransition()

  const [optimisticTarefas, setOptimistic] = useOptimistic(
    initialTarefas,
    (state, { id, status }: { id: string; status: TarefaStatus }) =>
      state.map((t) => (t.id === id ? { ...t, status, concluidaEm: status === TarefaStatus.CONCLUIDA ? new Date().toISOString() : null } : t)),
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

  const pending  = optimisticTarefas.filter((t) => t.status === TarefaStatus.PENDENTE)
  const concluidas = optimisticTarefas.filter((t) => t.status === TarefaStatus.CONCLUIDA)

  return (
    <>
      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cream-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Tarefas</h3>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
              {pending.length} pendente{pending.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-900/20 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white"
          >
            <Plus className="size-3.5" /> Nova Tarefa
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-cream-100">
          {optimisticTarefas.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-stone-400">Nenhuma tarefa.</div>
          )}

          {optimisticTarefas.map((tarefa) => {
            const rowState = getRowState(tarefa)
            const cfg = TIPO_CONFIG[tarefa.tipo]
            const TipoIcon = cfg.icon
            const isDone = tarefa.status === TarefaStatus.CONCLUIDA

            return (
              <div
                key={tarefa.id}
                className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                  isDone ? 'opacity-50' : ''
                } ${rowState === 'overdue' ? 'bg-red-50/30' : rowState === 'today' ? 'bg-orange-50/30' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(tarefa)}
                  className={`mt-0.5 shrink-0 transition-colors ${
                    isDone ? 'text-emerald-500 hover:text-stone-400' : 'text-stone-300 hover:text-emerald-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-medium ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                      {tarefa.titulo}
                    </p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                      <TipoIcon className="size-2.5" />
                      {cfg.label}
                    </span>
                    {rowState === 'overdue' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                        <AlertTriangle className="size-2.5" /> Vencida
                      </span>
                    )}
                    {rowState === 'today' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                        <Clock className="size-2.5" /> Hoje
                      </span>
                    )}
                  </div>
                  {tarefa.descricao && (
                    <p className="mt-1 text-xs text-stone-500">{tarefa.descricao}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-stone-400">
                    <span>{tarefa.responsavel.nome}</span>
                    {tarefa.prazo && (
                      <span className={rowState === 'overdue' ? 'text-red-500 font-medium' : rowState === 'today' ? 'text-orange-500 font-medium' : ''}>
                        {format(new Date(tarefa.prazo), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    )}
                    {isDone && tarefa.concluidaEm && (
                      <span className="text-emerald-600">
                        Concluída em {format(new Date(tarefa.concluidaEm), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showDialog && (
        <TarefaDialog
          leadId={leadId}
          usuarios={usuarios}
          currentUserId={currentUserId}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  )
}
