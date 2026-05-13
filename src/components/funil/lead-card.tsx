'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { FunilLead } from '@/lib/actions/funil'

// ─── Status sub-label map ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  NOVO_LEAD:             'Novo lead',
  REUNIAO_AGENDADA:      'Reunião agendada',
  REUNIAO_REALIZADA:     'Reunião realizada',
  DIAGNOSTICO_CONCLUIDO: 'Diagnóstico',
  PROPOSTA_ENVIADA:      'Proposta enviada',
  FOLLOWUP_ESTRATEGICO:  'Follow-up estratégico',
  EM_DECISAO:            'Em decisão',
  EM_APLICACAO:          'Em aplicação',
  DOCUMENTACAO_PENDENTE: 'Doc. pendente',
  APPLICATION_ENVIADA:   'Application enviada',
  ENTREVISTA_TESTE:      'Entrevista / Teste',
  ACEITO_PELA_ESCOLA:    'Aceito pela escola',
  OFFER_ENVIADA:         'Offer enviada',
  DEPOSIT_PAGO:          'Depósito pago',
  TUITION_PARCIAL:       'Tuition parcial',
  TUITION_QUITADA:       'Tuition quitada',
  MATRICULADO:           'Matriculado',
  VISTO:                 'Visto emitido',
  EMBARQUE:              'Embarque',
  EM_PROGRAMA:           'Em programa',
  SEM_RETORNO:           'Sem retorno',
  SEM_BUDGET:            'Sem budget',
  FECHOU_CONCORRENTE:    'Fechou concorrente',
  DESISTIU:              'Desistiu',
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type Props = {
  lead: FunilLead
  /** True quando renderizado dentro do DragOverlay */
  isDragging?: boolean
  /** True quando é o ghost no lugar original durante drag */
  isGhost?: boolean
}

export function LeadCard({ lead, isDragging, isGhost }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    disabled: isDragging, // overlay não precisa ser draggable
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={isDragging ? undefined : setNodeRef}
      style={isDragging ? undefined : style}
      {...(isDragging ? {} : { ...listeners, ...attributes })}
      className={`group relative cursor-grab select-none rounded-xl border bg-white p-3.5 shadow-sm transition-all active:cursor-grabbing ${
        isGhost
          ? 'border-dashed border-cream-300 bg-cream-50 opacity-40 shadow-none'
          : isDragging
          ? 'rotate-1 border-amber-300 shadow-xl ring-2 ring-amber-400/30'
          : 'border-cream-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md'
      }`}
    >
      {/* Nome + link ficha */}
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-stone-900">{lead.nome}</p>
        <Link
          href={`/leads/${lead.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          title="Ver ficha do estudante"
          className="shrink-0 rounded-md p-0.5 text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-amber-50 hover:text-amber-600"
        >
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {/* Destino */}
      {lead.destinoDesejado && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <Globe className="size-3 shrink-0 text-stone-400" />
          <span className="truncate text-xs text-stone-500">{lead.destinoDesejado}</span>
        </div>
      )}

      {/* Status badge */}
      <div className="mt-2.5">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
          {STATUS_LABEL[lead.funilStatus] ?? lead.funilStatus}
        </span>
      </div>

      {/* Rodapé: consultor + alerta de tarefa vencida */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">
            {lead.consultorInitials}
          </div>
          <span className="max-w-[100px] truncate text-[10px] text-stone-400">
            {lead.consultorNome.split(' ')[0]}
          </span>
        </div>

        {lead.hasOverdueTask && (
          <span
            title="Há tarefa(s) vencida(s) neste lead"
            className="flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600"
          >
            <AlertTriangle className="size-2.5" />
            Vencido
          </span>
        )}
      </div>
    </div>
  )
}
