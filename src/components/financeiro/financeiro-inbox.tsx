'use client'

import { useState, useActionState } from 'react'
import { Wallet, ChevronDown, ChevronUp, AlertTriangle, Clock, GraduationCap, User, RotateCcw } from 'lucide-react'
import { concluirEtapa } from '@/lib/actions/fechamento'
import type { FechamentoActionState, FinanceiroInboxItem } from '@/lib/actions/fechamento'
import { ETAPAS_DEF } from '@/lib/fechamento-config'
import { CampoField, ConcluirBtn, DevolverForm } from '@/components/fechamento/etapa-form'

function tempoAguardando(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  return `há ${dias} dias`
}

function InboxCard({ item }: { item: FinanceiroInboxItem }) {
  const [expanded, setExpanded] = useState(false)
  const [showDevolver, setShowDevolver] = useState(false)
  const [state, formAction] = useActionState(concluirEtapa, null as FechamentoActionState)

  const def = ETAPAS_DEF.find((e) => e.numero === item.etapaNumero)
  if (!def) return null

  return (
    <div className="rounded-xl border border-cream-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Wallet className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">{item.leadNome}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3 text-stone-400" /> {item.escolaNome}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3 text-stone-400" /> {item.consultorNome}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-amber-700">
            Etapa {item.etapaNumero} — {item.etapaTitulo}
          </p>
        </div>

        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-cream-100 px-2 py-0.5 text-xs text-stone-500 sm:inline-flex">
          <Clock className="size-3" /> {tempoAguardando(item.aguardandoDesde)}
        </span>
        <span className="shrink-0 text-stone-400">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-cream-200 px-5 pb-5 pt-4">
          <p className="mb-4 text-sm text-stone-600">{def.descricao}</p>

          {state?.error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="size-4 shrink-0" />
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="fechamentoId" value={item.fechamentoId} />
            <input type="hidden" name="numero" value={item.etapaNumero} />

            {def.campos.map((campo) => (
              <CampoField key={campo.name} campo={campo} defaultValue={item.dadosSalvos[campo.name]} />
            ))}

            <div className="pt-1">
              <ConcluirBtn label="Concluir e devolver ao consultor" />
            </div>
          </form>

          {item.devolveParaNumero && item.devolveParaTitulo && !showDevolver && (
            <div className="mt-4 border-t border-cream-100 pt-4">
              <button
                type="button"
                onClick={() => setShowDevolver(true)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
              >
                <RotateCcw className="size-3.5" />
                Devolver para etapa {item.devolveParaNumero}
              </button>
            </div>
          )}

          {showDevolver && item.devolveParaNumero && item.devolveParaTitulo && (
            <DevolverForm
              fechamentoId={item.fechamentoId}
              numero={item.etapaNumero}
              devolveParaNumero={item.devolveParaNumero}
              devolveParaTitulo={item.devolveParaTitulo}
              onCancel={() => setShowDevolver(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function FinanceiroInbox({ itens }: { itens: FinanceiroInboxItem[] }) {
  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-16 text-center">
        <Wallet className="mb-3 size-10 text-stone-300" />
        <p className="font-medium text-stone-500">Nenhuma etapa aguardando o financeiro</p>
        <p className="mt-1 text-sm text-stone-400">
          Quando uma etapa de fechamento chegar na competência do financeiro, ela aparece aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {itens.map((item) => (
        <InboxCard key={item.fechamentoId} item={item} />
      ))}
    </div>
  )
}
