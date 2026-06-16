'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, RotateCcw } from 'lucide-react'
import { devolverEtapa } from '@/lib/actions/fechamento'
import type { FechamentoActionState } from '@/lib/actions/fechamento'
import type { CampoDef } from '@/lib/fechamento-config'

// Componentes compartilhados do formulário de etapa do fechamento, usados tanto
// na página da jornada (fechamento-flow) quanto na caixa de tarefas do financeiro.

const INPUT = 'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
const LABEL = 'mb-1 block text-xs font-medium text-stone-600'

export function ConcluirBtn({ label = 'Concluir etapa' }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
      <Check className="size-4" />
      {pending ? 'Salvando…' : label}
    </button>
  )
}

function DevolverBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
      <RotateCcw className="size-4" />
      {pending ? 'Devolvendo…' : 'Devolver'}
    </button>
  )
}

export function CampoField({ campo, defaultValue }: { campo: CampoDef; defaultValue?: string }) {
  if (campo.type === 'textarea') {
    return (
      <div>
        <label className={LABEL}>{campo.label}{campo.required && ' *'}</label>
        <textarea name={campo.name} required={campo.required} defaultValue={defaultValue}
          placeholder={campo.placeholder} rows={3}
          className={INPUT + ' resize-none'} />
      </div>
    )
  }

  if (campo.type === 'select') {
    return (
      <div>
        <label className={LABEL}>{campo.label}{campo.required && ' *'}</label>
        <select name={campo.name} required={campo.required} defaultValue={defaultValue ?? ''} className={INPUT}>
          <option value="">Selecione…</option>
          {campo.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if (campo.type === 'radio') {
    return (
      <div>
        <label className={LABEL}>{campo.label}{campo.required && ' *'}</label>
        <div className="flex flex-col gap-2 mt-1">
          {campo.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm text-stone-700">
              <input type="radio" name={campo.name} value={o.value} required={campo.required}
                defaultChecked={defaultValue === o.value}
                className="accent-amber-500" />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className={LABEL}>{campo.label}{campo.required && ' *'}</label>
      <input type={campo.type} name={campo.name} required={campo.required} defaultValue={defaultValue}
        placeholder={campo.placeholder} className={INPUT} />
    </div>
  )
}

export function DevolverForm({
  fechamentoId,
  numero,
  devolveParaNumero,
  devolveParaTitulo,
  onCancel,
}: {
  fechamentoId: string
  numero: number
  devolveParaNumero: number
  devolveParaTitulo: string
  onCancel: () => void
}) {
  const [state, formAction] = useActionState(devolverEtapa, null as FechamentoActionState)

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <input type="hidden" name="fechamentoId" value={fechamentoId} />
      <input type="hidden" name="numero" value={numero} />
      <input type="hidden" name="devolveParaNumero" value={devolveParaNumero} />

      <p className="text-sm font-medium text-red-800">
        Devolver para: <span className="font-semibold">Etapa {devolveParaNumero} — {devolveParaTitulo}</span>
      </p>
      <p className="text-xs text-red-600">
        Os dados das etapas {devolveParaNumero} em diante serão apagados.
      </p>

      <div>
        <label className="mb-1 block text-xs font-medium text-red-700">Motivo *</label>
        <textarea name="motivo" required rows={2} placeholder="Descreva o motivo da devolução…"
          className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 resize-none" />
      </div>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <div className="flex items-center gap-2">
        <DevolverBtn />
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-600 hover:bg-cream-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}
