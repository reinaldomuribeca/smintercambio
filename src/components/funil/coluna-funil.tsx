'use client'

import { useDroppable } from '@dnd-kit/core'
import { LeadCard } from './lead-card'
import type { FunilLead, FunilEtapaConfig } from '@/lib/actions/funil'

type Props = {
  etapa: FunilEtapaConfig
  leads: FunilLead[]
  activeDragId: string | null
}

export function ColunaFunil({ etapa, leads, activeDragId }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.slug })
  const { cor } = etapa

  return (
    <div className="flex w-72 min-w-72 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: `${cor}40` }}>
      {/* Cabeçalho */}
      <div className="border-b px-4 py-3" style={{ borderColor: `${cor}30`, backgroundColor: `${cor}12` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: cor }} />
            <h3 className="text-sm font-semibold" style={{ color: cor }}>
              {etapa.nome}
            </h3>
          </div>
          <span
            className="flex size-5 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: `${cor}25`, color: cor }}
          >
            {leads.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3 transition-colors"
        style={{
          minHeight: 120,
          backgroundColor: isOver ? `${cor}08` : undefined,
        }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} isGhost={activeDragId === lead.id} />
        ))}

        {leads.length === 0 && (
          <div
            className="flex h-16 items-center justify-center rounded-xl border-2 border-dashed text-xs transition-colors"
            style={{
              borderColor: isOver ? cor : '#e5e7eb',
              color: isOver ? cor : '#d1d5db',
            }}
          >
            {isOver ? 'Solte aqui' : 'Sem leads'}
          </div>
        )}
      </div>
    </div>
  )
}
