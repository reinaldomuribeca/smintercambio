'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraficoPizza } from './grafico-pizza'
import type { ProductivityRow } from '@/lib/actions/tarefas'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrigemItem      = { label: string; count: number }
export type ConsultorConv   = { id: string; nome: string; total: number; emProposta: number; fechados: number }
export type DestinoItem     = { destino: string; programa: string; count: number }
export type MacroTempoItem  = { macroetapa: string; totalLeads: number; idadeMediaDias: number }
export type MotivoItem      = { label: string; count: number }
export type AplicacaoItem   = {
  leadId: string; leadNome: string; consultor: string
  totalDocs: number; docsAprovados: number; docsPendentes: number; percentual: number
}
export type FinanceiroLeadRow = {
  leadId: string; leadNome: string; funilStatusLabel: string
  moeda: string | null; tuitionBRL: number | null
  comissaoPrevista: number | null; comissaoRecebida: number | null; comissaoStatus: string
}

export type RelatoriosData = {
  // Aba 1
  origemData: OrigemItem[]
  consultorConversao: ConsultorConv[]
  destinoPrograma: DestinoItem[]
  // Aba 2 (null = sem acesso)
  financeiro: {
    comissaoPrevistaSoma: number
    comissaoRecebidaSoma: number
    tuitionBRLSoma: number
    leads: FinanceiroLeadRow[]
  } | null
  // Aba 3
  macroetapasTempo: MacroTempoItem[]
  motivosPerda: MotivoItem[]
  aplicacoes: AplicacaoItem[]
  // Aba 4 (null = sem acesso)
  produtividade: ProductivityRow[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  DIRECAO: 'Direção',
  CONSULTOR: 'Consultor',
  ADMINISTRATIVO: 'Administrativo',
  OPERACOES: 'Operações',
  FINANCEIRO: 'Financeiro',
}

type Tab = 'leads' | 'financeiro' | 'operacional' | 'produtividade'

const COMISSAO_STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  PARCIAL:  'Parcial',
  RECEBIDA: 'Recebida',
}

const COMISSAO_STATUS_STYLE: Record<string, string> = {
  PENDENTE: 'bg-stone-100 text-stone-600',
  PARCIAL:  'bg-amber-50 text-amber-700',
  RECEBIDA: 'bg-emerald-50 text-emerald-700',
}

const fmtBRL = (n: number | null | undefined) =>
  n == null ? '—'
  : `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const fmtPct = (n: number) => `${n.toFixed(1)}%`

// ─── Section shells ───────────────────────────────────────────────────────────

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</p>
      <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white shadow-sm">
      <div className="border-b border-cream-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-stone-400">{text}</div>
  )
}

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500'
const TD = 'px-4 py-3.5 text-sm text-stone-700'

// ─── Tab 1: Leads e Conversão ─────────────────────────────────────────────────

function AbaLeads({ data }: { data: RelatoriosData }) {
  return (
    <div className="space-y-6">
      {/* Pizza + Destinos row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Leads por origem">
          <div className="px-5 py-4">
            <GraficoPizza data={data.origemData} height={260} />
          </div>
        </SectionCard>

        <SectionCard title="Leads por destino e programa">
          {data.destinoPrograma.length === 0 ? (
            <EmptyState text="Nenhum diagnóstico com destinos no período" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-100 bg-cream-50">
                    <th className={TH}>Destino</th>
                    <th className={TH}>Programa</th>
                    <th className={`${TH} text-right`}>Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {data.destinoPrograma.map((r, i) => (
                    <tr key={i} className="hover:bg-cream-50">
                      <td className={TD}>{r.destino}</td>
                      <td className={`${TD} text-stone-500`}>{r.programa}</td>
                      <td className={`${TD} text-right font-semibold text-stone-900`}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Conversão por consultor */}
      <SectionCard title="Conversão por consultor">
        {data.consultorConversao.length === 0 ? (
          <EmptyState text="Nenhum lead no período" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50">
                  <th className={TH}>Consultor</th>
                  <th className={`${TH} text-right`}>Total leads</th>
                  <th className={`${TH} text-right`}>Em proposta</th>
                  <th className={`${TH} text-right`}>Fechados</th>
                  <th className={`${TH} text-right`}>% Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {data.consultorConversao.map((c) => {
                  const pct = c.total > 0 ? (c.fechados / c.total) * 100 : 0
                  return (
                    <tr key={c.id} className="hover:bg-cream-50">
                      <td className={`${TD} font-medium text-stone-900`}>{c.nome}</td>
                      <td className={`${TD} text-right`}>{c.total}</td>
                      <td className={`${TD} text-right`}>{c.emProposta}</td>
                      <td className={`${TD} text-right text-emerald-700 font-medium`}>{c.fechados}</td>
                      <td className={`${TD} text-right`}>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          pct >= 30 ? 'bg-emerald-50 text-emerald-700'
                          : pct >= 15 ? 'bg-amber-50 text-amber-700'
                          : 'bg-stone-100 text-stone-600'
                        }`}>
                          {c.total === 0 ? '—' : fmtPct(pct)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Tab 2: Pipeline Financeiro ───────────────────────────────────────────────

function AbaFinanceiro({ data }: { data: RelatoriosData }) {
  if (!data.financeiro) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-20 text-center">
        <p className="font-medium text-stone-400">Acesso restrito</p>
        <p className="mt-1 text-sm text-stone-400">Apenas Direção e Administrativo visualizam esta aba.</p>
      </div>
    )
  }

  const { comissaoPrevistaSoma, comissaoRecebidaSoma, tuitionBRLSoma, leads } = data.financeiro

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          title="Comissão prevista"
          value={fmtBRL(comissaoPrevistaSoma)}
          sub="Leads ativos no período"
        />
        <Card
          title="Comissão recebida"
          value={fmtBRL(comissaoRecebidaSoma)}
          sub="No período selecionado"
        />
        <Card
          title="Tuition total (BRL)"
          value={fmtBRL(tuitionBRLSoma)}
          sub="Financeiro e Matrícula"
        />
      </div>

      {/* Tabela */}
      <SectionCard title="Leads em estágio financeiro">
        {leads.length === 0 ? (
          <EmptyState text="Nenhum lead em estágio financeiro no período" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50">
                  <th className={TH}>Aluno</th>
                  <th className={`${TH} hidden sm:table-cell`}>Etapa</th>
                  <th className={`${TH} hidden md:table-cell`}>Moeda</th>
                  <th className={`${TH} text-right hidden md:table-cell`}>Tuition BRL</th>
                  <th className={`${TH} text-right`}>Comissão prevista</th>
                  <th className={`${TH} text-right hidden lg:table-cell`}>Comissão recebida</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {leads.map((l) => (
                  <tr key={l.leadId} className="hover:bg-cream-50">
                    <td className={TD}>
                      <Link
                        href={`/leads/${l.leadId}`}
                        className="font-medium text-stone-900 hover:text-amber-600"
                      >
                        {l.leadNome}
                      </Link>
                    </td>
                    <td className={`${TD} hidden sm:table-cell text-stone-500`}>{l.funilStatusLabel}</td>
                    <td className={`${TD} hidden md:table-cell text-stone-500`}>{l.moeda ?? '—'}</td>
                    <td className={`${TD} text-right hidden md:table-cell`}>{fmtBRL(l.tuitionBRL)}</td>
                    <td className={`${TD} text-right font-medium text-stone-900`}>{fmtBRL(l.comissaoPrevista)}</td>
                    <td className={`${TD} text-right hidden lg:table-cell text-emerald-700`}>{fmtBRL(l.comissaoRecebida)}</td>
                    <td className={`${TD}`}>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        COMISSAO_STATUS_STYLE[l.comissaoStatus] ?? 'bg-stone-100 text-stone-600'
                      }`}>
                        {COMISSAO_STATUS_LABEL[l.comissaoStatus] ?? l.comissaoStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Tab 3: Operacional ───────────────────────────────────────────────────────

function AbaOperacional({ data }: { data: RelatoriosData }) {
  return (
    <div className="space-y-6">
      {/* Tempo + Motivos row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Tempo médio no pipeline por etapa">
          {data.macroetapasTempo.every((m) => m.totalLeads === 0) ? (
            <EmptyState text="Nenhum lead ativo" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-100 bg-cream-50">
                    <th className={TH}>Etapa</th>
                    <th className={`${TH} text-right`}>Leads</th>
                    <th className={`${TH} text-right`}>Idade média</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {data.macroetapasTempo
                    .filter((m) => m.totalLeads > 0)
                    .map((m) => (
                      <tr key={m.macroetapa} className="hover:bg-cream-50">
                        <td className={`${TD} font-medium text-stone-900`}>{m.macroetapa}</td>
                        <td className={`${TD} text-right`}>{m.totalLeads}</td>
                        <td className={`${TD} text-right`}>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            m.idadeMediaDias > 60 ? 'bg-red-50 text-red-700'
                            : m.idadeMediaDias > 30 ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {m.idadeMediaDias}d
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Motivos de perda">
          <div className="px-5 py-4">
            <GraficoPizza data={data.motivosPerda} height={260} />
          </div>
        </SectionCard>
      </div>

      {/* Aplicações ativas */}
      <SectionCard title="Aplicações ativas — conclusão do checklist">
        {data.aplicacoes.length === 0 ? (
          <EmptyState text="Nenhuma aplicação ativa" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50">
                  <th className={TH}>Aluno</th>
                  <th className={`${TH} hidden md:table-cell`}>Consultor</th>
                  <th className={`${TH} text-right`}>Docs total</th>
                  <th className={`${TH} text-right`}>Aprovados</th>
                  <th className={`${TH} text-right`}>Pendentes</th>
                  <th className={`${TH} text-right`}>Conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {data.aplicacoes.map((a) => (
                  <tr key={a.leadId} className="hover:bg-cream-50">
                    <td className={TD}>
                      <Link
                        href={`/leads/${a.leadId}`}
                        className="font-medium text-stone-900 hover:text-amber-600"
                      >
                        {a.leadNome}
                      </Link>
                    </td>
                    <td className={`${TD} hidden md:table-cell text-stone-500`}>{a.consultor}</td>
                    <td className={`${TD} text-right`}>{a.totalDocs > 0 ? a.totalDocs : '—'}</td>
                    <td className={`${TD} text-right text-emerald-700`}>{a.docsAprovados}</td>
                    <td className={`${TD} text-right ${a.docsPendentes > 0 ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
                      {a.docsPendentes}
                    </td>
                    <td className={`${TD} text-right`}>
                      {a.totalDocs === 0 ? (
                        <span className="text-stone-400">—</span>
                      ) : (
                        <div className="ml-auto flex w-28 items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                            <div
                              className={`h-full rounded-full ${
                                a.percentual >= 80 ? 'bg-emerald-500'
                                : a.percentual >= 40 ? 'bg-amber-500'
                                : 'bg-red-400'
                              }`}
                              style={{ width: `${a.percentual}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-stone-700">
                            {a.percentual}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Aba 4: Produtividade ─────────────────────────────────────────────────────

function AbaProdutividade({ data }: { data: RelatoriosData }) {
  const rows = data.produtividade ?? []

  return (
    <div className="space-y-6">
      <SectionCard title="Produtividade por usuário no período">
        {rows.length === 0 ? (
          <EmptyState text="Nenhum usuário ativo no período" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 bg-cream-50">
                  <th className={TH}>Usuário</th>
                  <th className={TH}>Papel</th>
                  <th className={`${TH} text-right`}>Atribuídas</th>
                  <th className={`${TH} text-right`}>Concluídas</th>
                  <th className={`${TH} text-right`}>Pendentes</th>
                  <th className={`${TH} text-right`}>Atrasadas</th>
                  <th className={`${TH} text-right`}>Média p/ conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {rows.map((r) => (
                  <tr key={r.userId} className="hover:bg-cream-50">
                    <td className={`${TD} font-medium text-stone-900`}>{r.nome}</td>
                    <td className={`${TD} text-stone-500`}>{ROLE_LABEL[r.role] ?? r.role}</td>
                    <td className={`${TD} text-right`}>{r.atribuidas}</td>
                    <td className={`${TD} text-right text-emerald-700 font-semibold`}>{r.concluidas}</td>
                    <td className={`${TD} text-right`}>{r.pendentes}</td>
                    <td className={`${TD} text-right ${r.atrasadas > 0 ? 'font-semibold text-red-600' : 'text-stone-400'}`}>
                      {r.atrasadas > 0 ? r.atrasadas : '—'}
                    </td>
                    <td className={`${TD} text-right text-stone-500`}>
                      {r.mediaDias != null ? `${r.mediaDias} dia${r.mediaDias !== 1 ? 's' : ''}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card
          title="Total de tarefas"
          value={String(rows.reduce((a, r) => a + r.atribuidas, 0))}
          sub="no período"
        />
        <Card
          title="Concluídas"
          value={String(rows.reduce((a, r) => a + r.concluidas, 0))}
          sub="no período"
        />
        <Card
          title="Pendentes"
          value={String(rows.reduce((a, r) => a + r.pendentes, 0))}
          sub="em aberto"
        />
        <Card
          title="Atrasadas"
          value={String(rows.reduce((a, r) => a + r.atrasadas, 0))}
          sub="vencidas e pendentes"
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; restricted?: boolean; direcaoOnly?: boolean }[] = [
  { id: 'leads',         label: 'Leads e Conversão' },
  { id: 'financeiro',    label: 'Pipeline Financeiro', restricted: true },
  { id: 'operacional',   label: 'Operacional' },
  { id: 'produtividade', label: 'Produtividade', direcaoOnly: true },
]

export function RelatoriosAbas({
  data,
  role,
}: {
  data: RelatoriosData
  role: string
}) {
  const canSeeFinanceiro  = role === 'DIRECAO' || role === 'ADMINISTRATIVO' || role === 'FINANCEIRO'
  const canSeeProdutividade = role === 'DIRECAO'
  const visibleTabs = TABS.filter((t) =>
    (!t.restricted || canSeeFinanceiro) && (!t.direcaoOnly || canSeeProdutividade),
  )

  const [activeTab, setActiveTab] = useState<Tab>('leads')

  return (
    <div>
      {/* Tab nav */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6">
        <nav className="-mb-px flex gap-1" aria-label="Abas de relatórios">
          {visibleTabs.map((tab) => (
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
      <div className="px-6 py-6 sm:px-8">
        {activeTab === 'leads'         && <AbaLeads         data={data} />}
        {activeTab === 'financeiro'    && <AbaFinanceiro    data={data} />}
        {activeTab === 'operacional'   && <AbaOperacional   data={data} />}
        {activeTab === 'produtividade' && <AbaProdutividade data={data} />}
      </div>
    </div>
  )
}
