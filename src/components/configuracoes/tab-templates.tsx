'use client'

import { useState, useTransition } from 'react'
import { ObjetivoPrograma } from '@prisma/client'
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { upsertTemplate, type TemplateDoc } from '@/lib/actions/configuracoes'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRAMA_LABEL: Record<ObjetivoPrograma, string> = {
  HIGH_SCHOOL:      'High School',
  BOARDING_SCHOOL:  'Boarding School',
  SUMMER:           'Summer',
  IDIOMA:           'Idioma',
  COLLEGE:          'College',
  EXPERIENCIA_CURTA: 'Experiência Curta',
}

const PROGRAMAS = Object.values(ObjetivoPrograma)

export type TemplateMap = Partial<Record<ObjetivoPrograma, TemplateDoc[]>>

// ─── TemplateSection ──────────────────────────────────────────────────────────

function TemplateSection({
  programa,
  initial,
}: {
  programa: ObjetivoPrograma
  initial: TemplateDoc[]
}) {
  const [docs, setDocs]       = useState<TemplateDoc[]>(initial)
  const [open, setOpen]       = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const addDoc = () => {
    setDocs((prev) => [...prev, { nome: '', obrigatorio: true }])
    setOpen(true)
    setSaved(false)
  }

  const removeDoc = (i: number) => {
    setDocs((prev) => prev.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  const updateNome = (i: number, nome: string) => {
    setDocs((prev) => prev.map((d, idx) => idx === i ? { ...d, nome } : d))
    setSaved(false)
  }

  const toggleObrigatorio = (i: number) => {
    setDocs((prev) => prev.map((d, idx) => idx === i ? { ...d, obrigatorio: !d.obrigatorio } : d))
    setSaved(false)
  }

  const handleSave = () => {
    setError(null)
    const formData = new FormData()
    formData.set('objetivoPrograma', programa)
    formData.set('documentos', JSON.stringify(docs))

    startTransition(async () => {
      const res = await upsertTemplate(null, formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSaved(true)
      }
    })
  }

  const isDirty = JSON.stringify(docs) !== JSON.stringify(initial)

  return (
    <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-stone-800">{PROGRAMA_LABEL[programa]}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
            {docs.length} doc{docs.length !== 1 ? 's' : ''}
          </span>
          {saved && !isDirty && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <Check className="size-3" /> Salvo
            </span>
          )}
          {isDirty && (
            <span className="text-xs text-amber-600">● Não salvo</span>
          )}
        </div>
        {open ? <ChevronUp className="size-4 text-stone-400" /> : <ChevronDown className="size-4 text-stone-400" />}
      </button>

      {open && (
        <div className="border-t border-cream-100">
          {/* Document list */}
          <div className="divide-y divide-cream-100">
            {docs.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-stone-400">
                Nenhum documento no template. Adicione abaixo.
              </p>
            )}
            {docs.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <input
                  type="text"
                  value={doc.nome}
                  onChange={(e) => updateNome(i, e.target.value)}
                  placeholder="Nome do documento"
                  className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-1.5 text-sm text-stone-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={doc.obrigatorio}
                    onChange={() => toggleObrigatorio(i)}
                    className="size-3.5 accent-amber-500"
                  />
                  Obrigatório
                </label>
                <button
                  onClick={() => removeDoc(i)}
                  className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-cream-100 px-5 py-3">
            <button
              onClick={addDoc}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-cream-100"
            >
              <Plus className="size-3.5" /> Adicionar documento
            </button>

            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-red-500">{error}</span>}
              <button
                onClick={handleSave}
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                <Save className="size-3" />
                {isPending ? 'Salvando…' : 'Salvar template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabTemplates({ templates }: { templates: TemplateMap }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Configure os documentos exigidos em cada tipo de programa. Esses templates são usados automaticamente ao iniciar uma aplicação.
      </p>
      {PROGRAMAS.map((prog) => (
        <TemplateSection
          key={prog}
          programa={prog}
          initial={templates[prog] ?? []}
        />
      ))}
    </div>
  )
}
