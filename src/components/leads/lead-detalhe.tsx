'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AbaAplicacao, type AplicacaoProps } from '@/components/aplicacao/aba-aplicacao'
import { AbaDestino } from '@/components/leads/aba-destino'
import type { PaisData } from '@/lib/actions/destinos'
import { JornadaStatus } from '@prisma/client'
import { AbaFinanceiro, type FinanceiroProps } from '@/components/financeiro/aba-financeiro'
import { AbaTarefas } from '@/components/tarefas/aba-tarefas'
import { AbaHistorico } from '@/components/historico/aba-historico'
import { AbaPerfilLead } from '@/components/leads/aba-perfil-lead'
import type { TarefaItem } from '@/lib/actions/tarefas'
import type { HistoricoItem } from '@/lib/actions/historico'

// ─── Types ────────────────────────────────────────────────────────────────────

type JornadaSummary = {
  id: string
  status: JornadaStatus
  embarqueEm: string | null
  retornoEm: string | null
  escolaId: string
  escola: { nome: string; pais: { nome: string; bandeira: string | null } }
  etapas: { status: string }[]
} | null

export type LeadDetalheData = {
  id: string
  nome: string
  funilStatus: string
  cidade: string | null
  estado: string | null
  consultorId: string
  origemLead: string | null
  createdAt: string
  consultor: { id: string; nome: string }
  consultores: { id: string; nome: string }[]
  diagnostico: { objetivoPrograma: string | null } | null
  aplicacao: AplicacaoProps | null
  financeiro: FinanceiroProps | null
  tarefas: TarefaItem[]
  historicos: HistoricoItem[]
  usuarios: { id: string; nome: string }[]
  currentUserId: string
  jornada: JornadaSummary
  paises: PaisData[]
}

type Tab = 'perfil' | 'aplicacao' | 'financeiro' | 'tarefas' | 'historico' | 'destino'

const TABS: { id: Tab; label: string }[] = [
  { id: 'perfil',     label: 'Perfil'      },
  { id: 'aplicacao',  label: 'Aplicação'   },
  { id: 'financeiro', label: 'Financeiro'  },
  { id: 'tarefas',    label: 'Tarefas'     },
  { id: 'historico',  label: 'Histórico'   },
  { id: 'destino',    label: 'Destino'     },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  NOVO_LEAD:             'Novo Lead',
  REUNIAO_AGENDADA:      'Reunião Agendada',
  REUNIAO_REALIZADA:     'Reunião Realizada',
  DIAGNOSTICO_CONCLUIDO: 'Diagnóstico Concluído',
  PROPOSTA_ENVIADA:      'Proposta Enviada',
  FOLLOWUP_ESTRATEGICO:  'Follow-up Estratégico',
  EM_DECISAO:            'Em Decisão',
  EM_APLICACAO:          'Em Aplicação',
  DOCUMENTACAO_PENDENTE: 'Doc. Pendente',
  APPLICATION_ENVIADA:   'Application Enviada',
  ENTREVISTA_TESTE:      'Entrevista / Teste',
  ACEITO_PELA_ESCOLA:    'Aceito pela Escola',
  OFFER_ENVIADA:         'Offer Enviada',
  DEPOSIT_PAGO:          'Depósito Pago',
  TUITION_PARCIAL:       'Tuition Parcial',
  TUITION_QUITADA:       'Tuition Quitada',
  MATRICULADO:           'Matriculado',
  VISTO:                 'Visto Emitido',
  EMBARQUE:              'Embarque',
  EM_PROGRAMA:           'Em Programa',
  SEM_RETORNO:           'Sem Retorno',
  SEM_BUDGET:            'Sem Budget',
  FECHOU_CONCORRENTE:    'Fechou Concorrente',
  DESISTIU:              'Desistiu',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadDetalhe({ lead, role }: { lead: LeadDetalheData; role: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('aplicacao')

  const location = [lead.cidade, lead.estado].filter(Boolean).join(', ')

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4">
        <Link
          href="/leads"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600"
        >
          <ArrowLeft className="size-3.5" /> Voltar para Leads
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-brand text-2xl font-semibold text-navy-900">{lead.nome}</h1>
            <p className="mt-0.5 text-sm text-stone-500">
              {lead.consultor.nome}
              {location && <span> · {location}</span>}
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
            {STATUS_LABEL[lead.funilStatus] ?? lead.funilStatus}
          </span>
        </div>
      </div>

      {/* Tab nav */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6">
        <nav className="-mb-px flex gap-1" aria-label="Abas do lead">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'aplicacao' && (
          <AbaAplicacao
            leadId={lead.id}
            aplicacao={lead.aplicacao}
            objetivoPrograma={lead.diagnostico?.objetivoPrograma ?? null}
            role={role}
          />
        )}
        {activeTab === 'financeiro' && (
          <AbaFinanceiro
            leadId={lead.id}
            financeiro={lead.financeiro}
            role={role}
          />
        )}
        {activeTab === 'tarefas' && (
          <AbaTarefas
            leadId={lead.id}
            initialTarefas={lead.tarefas}
            usuarios={lead.usuarios}
            currentUserId={lead.currentUserId}
          />
        )}
        {activeTab === 'historico' && (
          <AbaHistorico leadId={lead.id} historicos={lead.historicos} />
        )}
        {activeTab === 'perfil' && (
          <AbaPerfilLead
            leadId={lead.id}
            nome={lead.nome}
            cidade={lead.cidade}
            estado={lead.estado}
            funilStatus={lead.funilStatus}
            origemLead={lead.origemLead}
            createdAt={lead.createdAt}
            consultor={lead.consultor}
            consultores={lead.consultores}
            role={role}
          />
        )}
        {activeTab === 'destino' && (
          <AbaDestino leadId={lead.id} paises={lead.paises} jornada={lead.jornada} />
        )}
      </div>
    </div>
  )
}
