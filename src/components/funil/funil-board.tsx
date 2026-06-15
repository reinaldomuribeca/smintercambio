'use client'

import { useState, useTransition } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { ColunaFunil } from './coluna-funil'
import { LeadCard } from './lead-card'
import { MotivoDialog } from './motivo-dialog'
import { updateFunilStatus, type FunilLead, type FunilEtapaConfig } from '@/lib/actions/funil'

// ─── Board ────────────────────────────────────────────────────────────────────

type PendingMove = { leadId: string; leadNome: string }

export function FunilBoard({
  initialLeads,
  etapas,
}: {
  initialLeads: FunilLead[]
  etapas: FunilEtapaConfig[]
}) {
  const [leads, setLeads] = useState<FunilLead[]>(initialLeads)
  const [activeLead, setActiveLead] = useState<FunilLead | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [, startTransition] = useTransition()

  const etapasPerdido = etapas.filter((e) => e.perdido).map((e) => ({ slug: e.slug, nome: e.nome }))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    // Acessibilidade: permite mover cards pelo teclado (Espaço para pegar/soltar,
    // setas para navegar) — antes o kanban era inoperável sem mouse.
    useSensor(KeyboardSensor),
  )

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveLead(leads.find((l) => l.id === active.id) ?? null)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveLead(null)
    if (!over) return

    const leadId = active.id as string
    const targetSlug = over.id as string
    const etapa = etapas.find((e) => e.slug === targetSlug)
    if (!etapa) return

    const currentLead = leads.find((l) => l.id === leadId)
    if (!currentLead) return
    if (currentLead.funilStatus === targetSlug) return

    if (etapa.perdido) {
      setPendingMove({ leadId, leadNome: currentLead.nome })
      return
    }

    applyMove(leadId, targetSlug, currentLead.funilStatus)
  }

  const onDragCancel = () => setActiveLead(null)

  const applyMove = (leadId: string, newStatus: string, previousStatus: string, motivoPerda?: string) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, funilStatus: newStatus } : l))
    startTransition(async () => {
      const result = await updateFunilStatus(leadId, newStatus, motivoPerda)
      if (result?.error) {
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, funilStatus: previousStatus } : l))
      }
    })
  }

  const handlePerdidoConfirm = (slug: string, motivo: string) => {
    if (!pendingMove) return
    const currentLead = leads.find((l) => l.id === pendingMove.leadId)
    if (!currentLead) { setPendingMove(null); return }
    applyMove(pendingMove.leadId, slug, currentLead.funilStatus, motivo)
    setPendingMove(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex h-full gap-4 overflow-x-auto px-6 py-5">
          {etapas.map((etapa) => (
            <ColunaFunil
              key={etapa.slug}
              etapa={etapa}
              leads={leads.filter((l) => l.funilStatus === etapa.slug)}
              activeDragId={activeLead?.id ?? null}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeLead && <LeadCard lead={activeLead} isDragging />}
        </DragOverlay>
      </DndContext>

      {pendingMove && (
        <MotivoDialog
          leadNome={pendingMove.leadNome}
          etapasPerdido={etapasPerdido}
          onConfirm={handlePerdidoConfirm}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </>
  )
}
