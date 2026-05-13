'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type EtapaPerdido = { slug: string; nome: string }

type Props = {
  leadNome: string
  etapasPerdido: EtapaPerdido[]
  onConfirm: (slug: string, motivo: string) => void
  onCancel: () => void
}

export function MotivoDialog({ leadNome, etapasPerdido, onConfirm, onCancel }: Props) {
  const [selectedSlug, setSelectedSlug] = useState('')
  const [complemento, setComplemento] = useState('')

  const handleConfirm = () => {
    if (!selectedSlug) return
    const nomeEtapa = etapasPerdido.find((e) => e.slug === selectedSlug)?.nome ?? selectedSlug
    const motivo = complemento.trim()
      ? `${nomeEtapa} — ${complemento}`
      : nomeEtapa
    onConfirm(selectedSlug, motivo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md rounded-2xl border border-cream-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-stone-400 hover:bg-cream-100 hover:text-stone-600"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">Marcar como Perdido</h2>
            <p className="mt-0.5 text-sm text-stone-500">
              <strong className="font-medium text-stone-700">{leadNome}</strong> será movido para a
              coluna Perdido. Informe o motivo:
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {etapasPerdido.map((e) => (
            <label
              key={e.slug}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                selectedSlug === e.slug
                  ? 'border-red-300 bg-red-50'
                  : 'border-cream-200 hover:border-cream-300 hover:bg-cream-50'
              }`}
            >
              <input
                type="radio"
                name="motivo"
                value={e.slug}
                checked={selectedSlug === e.slug}
                onChange={() => setSelectedSlug(e.slug)}
                className="accent-red-500"
              />
              <span className="text-sm text-stone-700">{e.nome}</span>
            </label>
          ))}
        </div>

        <div className="mt-3">
          <textarea
            rows={2}
            placeholder="Observação adicional (opcional)…"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            className="w-full resize-none rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-cream-200 px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-cream-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlug}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
          >
            Confirmar perda
          </button>
        </div>
      </div>
    </div>
  )
}
