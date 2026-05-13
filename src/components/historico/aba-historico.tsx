'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, Loader2,
  Calendar, MessageSquare, Mail, Paperclip, FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HistoricoTipo } from '@prisma/client'
import {
  createHistorico,
  type HistoricoItem,
  type CreateHistoricoState,
} from '@/lib/actions/historico'

// ─── Config ───────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<HistoricoTipo, {
  label: string
  bg: string
  text: string
  border: string
  dotBg: string
  icon: React.ElementType
}> = {
  REUNIAO:   { label: 'Reunião',   bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dotBg: 'bg-violet-500', icon: Calendar      },
  MENSAGEM:  { label: 'Mensagem',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dotBg: 'bg-blue-500',   icon: MessageSquare },
  EMAIL:     { label: 'E-mail',    bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200',    dotBg: 'bg-sky-500',    icon: Mail          },
  ARQUIVO:   { label: 'Arquivo',   bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dotBg: 'bg-yellow-500', icon: Paperclip     },
  NOTA:      { label: 'Nota',      bg: 'bg-stone-50',  text: 'text-stone-600',  border: 'border-stone-200',  dotBg: 'bg-stone-400',  icon: FileText      },
}

const TIPO_OPTIONS = Object.entries(TIPO_CONFIG).map(([value, cfg]) => ({
  value: value as HistoricoTipo,
  label: cfg.label,
}))

const inputCls =
  'w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

// ─── Dialog ───────────────────────────────────────────────────────────────────

function HistoricoDialog({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const router = useRouter()
  const [state, action, isPending] = useActionState<CreateHistoricoState, FormData>(createHistorico, null)

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

        <h2 className="mb-5 text-base font-semibold text-stone-900">Adicionar Registro</h2>

        <form action={action} className="space-y-4">
          <input type="hidden" name="leadId" value={leadId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
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
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-stone-600">
                Título <span className="text-red-500">*</span>
              </label>
              <input name="titulo" required placeholder="Assunto ou resumo…" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Descrição</label>
            <textarea
              name="conteudo"
              rows={3}
              placeholder="Detalhes, observações, próximos passos…"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">
              URL do arquivo{' '}
              <span className="font-normal text-stone-400">(upload em breve)</span>
            </label>
            <input name="arquivoUrl" type="url" placeholder="https://…" className={inputCls} />
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
              Salvar
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
  historicos: HistoricoItem[]
}

export function AbaHistorico({ leadId, historicos }: Props) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <div className="rounded-2xl border border-cream-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cream-100 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Histórico de Interações
          </h3>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-900/20 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white"
          >
            <Plus className="size-3.5" /> Adicionar Registro
          </button>
        </div>

        {/* Timeline */}
        <div className="px-5 py-5">
          {historicos.length === 0 && (
            <div className="py-10 text-center text-sm text-stone-400">
              Nenhum registro no histórico.
            </div>
          )}

          <div className="relative">
            {/* Vertical line */}
            {historicos.length > 1 && (
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-cream-200" />
            )}

            <div className="space-y-5">
              {historicos.map((item) => {
                const cfg = TIPO_CONFIG[item.tipo]
                const Icon = cfg.icon
                const date = new Date(item.createdAt)

                return (
                  <div key={item.id} className="relative flex gap-4">
                    {/* Dot / icon */}
                    <div
                      className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-white ${cfg.border}`}
                    >
                      <Icon className={`size-3.5 ${cfg.text}`} />
                    </div>

                    {/* Card */}
                    <div className="min-w-0 flex-1 rounded-xl border border-cream-200 bg-cream-50/30 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                            <Icon className="size-2.5" />
                            {cfg.label}
                          </span>
                          {item.titulo && (
                            <p className="text-sm font-semibold text-stone-800">{item.titulo}</p>
                          )}
                        </div>
                        <span
                          className="shrink-0 text-xs text-stone-400"
                          title={format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        >
                          {format(date, "dd MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      {item.conteudo && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">{item.conteudo}</p>
                      )}

                      {item.arquivoUrl && (
                        <a
                          href={item.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 hover:underline"
                        >
                          <Paperclip className="size-3" /> Ver arquivo
                        </a>
                      )}

                      <p className="mt-2 text-xs text-stone-400">— {item.autor.nome}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showDialog && (
        <HistoricoDialog leadId={leadId} onClose={() => setShowDialog(false)} />
      )}
    </>
  )
}
