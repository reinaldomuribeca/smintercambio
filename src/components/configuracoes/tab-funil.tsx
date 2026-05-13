'use client'

import { useState, useActionState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react'
import {
  createFunilEtapa, updateFunilEtapa, deleteFunilEtapa, reorderFunilEtapas,
  type FunilEtapaFormState,
} from '@/lib/actions/configuracoes'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FunilEtapaRow = {
  id: string
  slug: string
  nome: string
  cor: string
  ordem: number
  ativa: boolean
  perdido: boolean
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const INPUT =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
          <h2 className="font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-600">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormError({ state }: { state: FunilEtapaFormState }) {
  if (!state?.error) return null
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {state.error}
    </div>
  )
}

// ─── Nova Etapa dialog ────────────────────────────────────────────────────────

function NovaEtapaDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<FunilEtapaFormState, FormData>(createFunilEtapa, null)
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { router.refresh(); onClose() }
  }, [state?.success])

  return (
    <Dialog title="Nova Etapa do Funil" onClose={onClose}>
      <form
        action={action}
        onSubmit={() => { hasSubmitted.current = true }}
        className="space-y-4 px-6 py-5"
      >
        <FormError state={state} />
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">Nome da etapa</label>
            <input name="nome" className={INPUT} placeholder="Ex: Marcar Reunião" required />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">
              Slug <span className="font-normal text-stone-400">(identificador único, maiúsculas)</span>
            </label>
            <input name="slug" className={INPUT} placeholder="MARCAR_REUNIAO" required
              pattern="[A-Z0-9_]+" title="Apenas letras maiúsculas, números e _" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">Cor</label>
            <input name="cor" type="color" defaultValue="#94a3b8"
              className="h-10 w-full cursor-pointer rounded-lg border border-cream-200 p-1" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="perdido-new" name="perdido" value="true" className="accent-red-500" />
            <label htmlFor="perdido-new" className="text-sm text-stone-700">
              Etapa de perda <span className="text-xs text-stone-400">(exige motivo ao mover lead)</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-cream-100 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
            Cancelar
          </button>
          <button type="submit" disabled={pending}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
            {pending ? 'Criando…' : 'Criar etapa'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Editar Etapa dialog ──────────────────────────────────────────────────────

function EditarEtapaDialog({ etapa, onClose }: { etapa: FunilEtapaRow; onClose: () => void }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<FunilEtapaFormState, FormData>(updateFunilEtapa, null)
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { router.refresh(); onClose() }
  }, [state?.success])

  return (
    <Dialog title="Editar Etapa" onClose={onClose}>
      <form
        action={action}
        onSubmit={() => { hasSubmitted.current = true }}
        className="space-y-4 px-6 py-5"
      >
        <input type="hidden" name="id" value={etapa.id} />
        <FormError state={state} />
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">Nome da etapa</label>
            <input name="nome" className={INPUT} defaultValue={etapa.nome} required />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">Slug</label>
            <input className={`${INPUT} bg-cream-50 text-stone-400`} value={etapa.slug} disabled />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-stone-500">Cor</label>
            <input name="cor" type="color" defaultValue={etapa.cor}
              className="h-10 w-full cursor-pointer rounded-lg border border-cream-200 p-1" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="perdido-edit" name="perdido" value="true"
              defaultChecked={etapa.perdido} className="accent-red-500" />
            <label htmlFor="perdido-edit" className="text-sm text-stone-700">
              Etapa de perda <span className="text-xs text-stone-400">(exige motivo ao mover lead)</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-cream-100 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
            Cancelar
          </button>
          <button type="submit" disabled={pending}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function EtapaRow({
  etapa,
  onEdit,
  onDelete,
}: {
  etapa: FunilEtapaRow
  onEdit: (e: FunilEtapaRow) => void
  onDelete: (e: FunilEtapaRow) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 shadow-sm"
    >
      <button
        {...attributes} {...listeners}
        className="cursor-grab touch-none text-stone-300 hover:text-stone-400 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <span className="size-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: etapa.cor }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-stone-900">{etapa.nome}</span>
          <code className="text-[10px] text-stone-400">{etapa.slug}</code>
        </div>
        {etapa.perdido && (
          <span className="mt-0.5 inline-block rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
            Perdido
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(etapa)}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-700"
          title="Editar"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={() => onDelete(etapa)}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
          title="Excluir"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function ConfirmarExclusaoDialog({ etapa, onClose }: { etapa: FunilEtapaRow; onClose: () => void }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const handleDelete = () => {
    setPending(true)
    startTransition(async () => {
      const result = await deleteFunilEtapa(etapa.id)
      if (result.error) { setError(result.error); setPending(false) }
      else { router.refresh(); onClose() }
    })
  }

  return (
    <Dialog title="Excluir Etapa" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <p className="text-sm text-stone-600">
          Tem certeza que deseja excluir a etapa{' '}
          <strong className="text-stone-900">{etapa.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2 border-t border-cream-100 pt-4">
          <button onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={pending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {pending ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabFunil({ etapas: initialEtapas }: { etapas: FunilEtapaRow[] }) {
  const router = useRouter()
  const [etapas, setEtapas] = useState<FunilEtapaRow[]>(initialEtapas)
  const [showNova, setShowNova] = useState(false)
  const [editando, setEditando] = useState<FunilEtapaRow | null>(null)
  const [excluindo, setExcluindo] = useState<FunilEtapaRow | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = etapas.findIndex((e) => e.id === active.id)
    const newIndex = etapas.findIndex((e) => e.id === over.id)
    const reordered = arrayMove(etapas, oldIndex, newIndex)
    setEtapas(reordered)

    startTransition(async () => {
      await reorderFunilEtapas(reordered.map((e) => e.id))
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {etapas.length} etapas — arraste para reordenar
        </p>
        <button
          onClick={() => setShowNova(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> Nova Etapa
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={etapas.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {etapas.map((etapa) => (
              <EtapaRow
                key={etapa.id}
                etapa={etapa}
                onEdit={setEditando}
                onDelete={setExcluindo}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {etapas.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-cream-200 p-12 text-center text-sm text-stone-400">
          Nenhuma etapa cadastrada. Crie a primeira etapa do funil.
        </div>
      )}

      {showNova   && <NovaEtapaDialog onClose={() => setShowNova(false)} />}
      {editando   && <EditarEtapaDialog etapa={editando} onClose={() => setEditando(null)} />}
      {excluindo  && <ConfirmarExclusaoDialog etapa={excluindo} onClose={() => setExcluindo(null)} />}
    </div>
  )
}
