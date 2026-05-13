import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role, TarefaStatus, TarefaTipo } from '@prisma/client'
import {
  startOfWeek, startOfMonth, startOfYear, addDays, format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users, TrendingUp, FileCheck, GraduationCap, AlertTriangle,
  RefreshCw, FileText, Calendar, Bell, LayoutDashboard,
} from 'lucide-react'
import { GraficoOrigem } from '@/components/dashboard/grafico-origem'
import { GraficoFunil } from '@/components/dashboard/grafico-funil'
import { DashboardFiltros } from '@/components/dashboard/dashboard-filtros'

export const dynamic = 'force-dynamic'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERDIDO: string[] = ['SEM_RETORNO', 'SEM_BUDGET', 'FECHOU_CONCORRENTE', 'DESISTIU']

const PROPOSTA: string[] = ['PROPOSTA_ENVIADA', 'FOLLOWUP_ESTRATEGICO', 'EM_DECISAO']

const APLICACAO_PIPELINE: string[] = [
  'EM_APLICACAO', 'DOCUMENTACAO_PENDENTE', 'APPLICATION_ENVIADA',
  'ENTREVISTA_TESTE', 'ACEITO_PELA_ESCOLA', 'OFFER_ENVIADA',
  'DEPOSIT_PAGO', 'TUITION_PARCIAL', 'TUITION_QUITADA',
]

const MATRICULADO: string[] = ['MATRICULADO', 'VISTO', 'EMBARQUE', 'EM_PROGRAMA']

const MACROETAPAS = [
  { label: 'Lead',         statuses: ['NOVO_LEAD'],                                                                          cor: '#a8a29e' },
  { label: 'Qualificação', statuses: ['REUNIAO_AGENDADA','REUNIAO_REALIZADA','DIAGNOSTICO_CONCLUIDO'],                       cor: '#eab308' },
  { label: 'Proposta',     statuses: PROPOSTA,                                                                               cor: '#f97316' },
  { label: 'Aplicação',    statuses: ['EM_APLICACAO','DOCUMENTACAO_PENDENTE','APPLICATION_ENVIADA'],                         cor: '#38bdf8' },
  { label: 'Admissão',     statuses: ['ENTREVISTA_TESTE','ACEITO_PELA_ESCOLA','OFFER_ENVIADA'],                              cor: '#a78bfa' },
  { label: 'Financeiro',   statuses: ['DEPOSIT_PAGO','TUITION_PARCIAL','TUITION_QUITADA'],                                  cor: '#34d399' },
  { label: 'Matrícula',    statuses: MATRICULADO,                                                                            cor: '#059669' },
]

const TIPO_LABEL: Record<TarefaTipo, string> = {
  FOLLOWUP:   'Follow-up',
  DOCUMENTO:  'Documento',
  REUNIAO:    'Reunião',
  ALERTA:     'Alerta',
  OUTRO:      'Outro',
  FECHAMENTO: 'Fechamento',
}

const TIPO_ICON: Record<TarefaTipo, React.ElementType> = {
  FOLLOWUP:   RefreshCw,
  DOCUMENTO:  FileText,
  REUNIAO:    Calendar,
  ALERTA:     Bell,
  OUTRO:      FileText,
  FECHAMENTO: FileText,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(periodo: string): { gte: Date; lte: Date } {
  const now = new Date()
  const lte = now
  let gte: Date
  if (periodo === 'semana') gte = startOfWeek(now, { weekStartsOn: 1 })
  else if (periodo === 'ano') gte = startOfYear(now)
  else gte = startOfMonth(now) // default: mes
  return { gte, lte }
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true },
    })
    return { id: user.id, role: dbUser?.role ?? Role.CONSULTOR }
  } catch {
    return { id: user.id, role: Role.CONSULTOR }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType
  label: string
  value: number
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color === 'text-amber-600' ? 'bg-amber-50' : color === 'text-sky-600' ? 'bg-sky-50' : color === 'text-violet-600' ? 'bg-violet-50' : 'bg-emerald-50'}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-stone-700">{title}</h2>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SearchParams = Promise<Record<string, string | undefined>>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const currentUser = await getCurrentUser()

  const periodo = params.periodo ?? 'mes'
  const consultorIdParam = params.consultor
  const isDirecao = currentUser.role === Role.DIRECAO

  const dateRange = getDateRange(periodo)

  // Base consultor filter (CONSULTOR sees own leads only)
  const consultorFilter =
    currentUser.role === Role.CONSULTOR
      ? currentUser.id
      : consultorIdParam || undefined

  const baseLeadWhere = {
    ...(consultorFilter ? { consultorId: consultorFilter } : {}),
  }

  const baseLeadWhereWithDate = {
    ...baseLeadWhere,
    createdAt: dateRange,
  }

  const [
    totalAtivos,
    emProposta,
    emAplicacao,
    matriculados,
    origemRaw,
    funilRaw,
    tarefasUrgentes,
    consultores,
  ] = await Promise.all([
    // Cards
    prisma.lead.count({
      where: { ...baseLeadWhereWithDate, funilStatus: { notIn: PERDIDO } },
    }),
    prisma.lead.count({
      where: { ...baseLeadWhereWithDate, funilStatus: { in: PROPOSTA } },
    }),
    prisma.lead.count({
      where: { ...baseLeadWhereWithDate, funilStatus: { in: APLICACAO_PIPELINE } },
    }),
    prisma.lead.count({
      where: { ...baseLeadWhereWithDate, funilStatus: { in: MATRICULADO } },
    }),

    // Chart 1: leads por origem
    prisma.lead.groupBy({
      by: ['origemLead'],
      where: { ...baseLeadWhereWithDate, origemLead: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    // Chart 2: funil atual (sem filtro de data — estado atual do pipeline)
    prisma.lead.groupBy({
      by: ['funilStatus'],
      where: { ...baseLeadWhere, funilStatus: { notIn: PERDIDO } },
      _count: { id: true },
    }),

    // Tarefas urgentes (prazo nos próximos 3 dias)
    prisma.tarefa.findMany({
      where: {
        status: TarefaStatus.PENDENTE,
        prazo: { lte: addDays(new Date(), 3) },
        ...(consultorFilter
          ? { lead: { consultorId: consultorFilter } }
          : {}),
      },
      select: {
        id: true,
        titulo: true,
        tipo: true,
        prazo: true,
        lead: { select: { id: true, nome: true } },
        responsavel: { select: { nome: true } },
      },
      orderBy: { prazo: 'asc' },
      take: 20,
    }),

    // Consultores para filtro (DIRECAO only)
    isDirecao
      ? prisma.user.findMany({
          where: { role: Role.CONSULTOR, ativo: true },
          select: { id: true, nome: true },
          orderBy: { nome: 'asc' },
        })
      : Promise.resolve([]),
  ])

  // Aggregate origem data
  const origemData = origemRaw
    .filter((r) => r.origemLead !== null)
    .map((r) => ({ origem: r.origemLead as string, count: r._count.id }))

  // Aggregate funil by macroetapa
  const statusCountMap = Object.fromEntries(
    funilRaw.map((r) => [r.funilStatus, r._count.id]),
  )
  const funilData = MACROETAPAS.map((m) => ({
    macroetapa: m.label,
    count: m.statuses.reduce((acc, s) => acc + (statusCountMap[s] ?? 0), 0),
    cor: m.cor,
  }))

  const periodoLabel =
    periodo === 'semana' ? 'esta semana' : periodo === 'ano' ? 'este ano' : 'este mês'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900/5">
              <LayoutDashboard className="size-4 text-navy-900" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-stone-900">Dashboard</h1>
              <p className="text-xs text-stone-400">Indicadores {periodoLabel}</p>
            </div>
          </div>
          <Suspense fallback={null}>
            <DashboardFiltros
              currentParams={params}
              consultores={consultores}
              showConsultorFilter={isDirecao}
            />
          </Suspense>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-6 py-6 sm:px-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            icon={Users}
            label="Leads ativos"
            value={totalAtivos}
            sub={periodoLabel}
            color="text-amber-600"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Em proposta"
            value={emProposta}
            color="text-amber-600"
          />
          <SummaryCard
            icon={FileCheck}
            label="Em aplicação"
            value={emAplicacao}
            color="text-sky-600"
          />
          <SummaryCard
            icon={GraduationCap}
            label="Matriculados"
            value={matriculados}
            color="text-emerald-600"
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Leads por origem">
            <GraficoOrigem data={origemData} />
          </ChartCard>
          <ChartCard title="Pipeline atual por etapa">
            <GraficoFunil data={funilData} />
          </ChartCard>
        </div>

        {/* Urgent tasks */}
        <div className="mt-6">
          <div className="rounded-xl border border-cream-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-cream-200 px-5 py-4">
              <AlertTriangle className="size-4 text-red-500" />
              <h2 className="text-sm font-semibold text-stone-700">
                Tarefas urgentes
                <span className="ml-2 text-xs font-normal text-stone-400">(prazo nos próximos 3 dias)</span>
              </h2>
            </div>

            {tarefasUrgentes.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-stone-400">
                Nenhuma tarefa urgente
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-100 bg-cream-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Aluno</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Tarefa</th>
                    <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 sm:table-cell">Tipo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Prazo</th>
                    <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 lg:table-cell">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {tarefasUrgentes.map((t) => {
                    const prazoDate = t.prazo ? new Date(t.prazo) : null
                    const now = new Date(); now.setHours(0,0,0,0)
                    const isOverdue = prazoDate ? prazoDate < now : false
                    const Icon = TIPO_ICON[t.tipo]

                    return (
                      <tr key={t.id} className={`transition-colors ${isOverdue ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-cream-50'}`}>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/leads/${t.lead.id}`}
                            className="font-medium text-stone-900 hover:text-amber-600"
                          >
                            {t.lead.nome}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">{t.titulo}</td>
                        <td className="hidden px-5 py-3.5 sm:table-cell">
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                            <Icon className="size-2.5" />
                            {TIPO_LABEL[t.tipo]}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 text-sm ${isOverdue ? 'font-semibold text-red-600' : 'text-stone-500'}`}>
                          {prazoDate
                            ? format(prazoDate, "dd/MM/yyyy", { locale: ptBR })
                            : '—'}
                          {isOverdue && (
                            <span className="ml-1.5 text-[10px] font-medium text-red-500">Vencida</span>
                          )}
                        </td>
                        <td className="hidden px-5 py-3.5 text-stone-500 lg:table-cell">
                          {t.responsavel.nome}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
