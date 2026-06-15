import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { differenceInDays, format, startOfMonth } from 'date-fns'
import { BarChart2 } from 'lucide-react'
import type { ChecklistItem } from '@/lib/actions/aplicacao'
import { toBRL, sumBRL, decToNum } from '@/lib/utils/financeiro'
import { PROGRAMA_LABEL } from '@/lib/objetivo-programa'
import { getProductivityMetrics } from '@/lib/actions/tarefas'
import { RelatoriosAbas, type RelatoriosData } from '@/components/relatorios/relatorios-abas'
import { RelatoriosFiltros } from '@/components/relatorios/relatorios-filtros'

export const dynamic = 'force-dynamic'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERDIDO: string[] = ['SEM_RETORNO', 'SEM_BUDGET', 'FECHOU_CONCORRENTE', 'DESISTIU']

const PROPOSTA: string[] = ['PROPOSTA_ENVIADA', 'FOLLOWUP_ESTRATEGICO', 'EM_DECISAO']

const FECHADOS: string[] = [
  'DEPOSIT_PAGO', 'TUITION_PARCIAL', 'TUITION_QUITADA',
  'MATRICULADO', 'VISTO', 'EMBARQUE', 'EM_PROGRAMA',
]

const FINANCEIRO_STAGES: string[] = [
  'DEPOSIT_PAGO', 'TUITION_PARCIAL', 'TUITION_QUITADA',
  'MATRICULADO', 'VISTO', 'EMBARQUE', 'EM_PROGRAMA',
]

const MACROETAPAS = [
  { label: 'Lead',         statuses: ['NOVO_LEAD'] },
  { label: 'Qualificação', statuses: ['REUNIAO_AGENDADA','REUNIAO_REALIZADA','DIAGNOSTICO_CONCLUIDO'] },
  { label: 'Proposta',     statuses: PROPOSTA },
  { label: 'Aplicação',    statuses: ['EM_APLICACAO','DOCUMENTACAO_PENDENTE','APPLICATION_ENVIADA'] },
  { label: 'Admissão',     statuses: ['ENTREVISTA_TESTE','ACEITO_PELA_ESCOLA','OFFER_ENVIADA'] },
  { label: 'Financeiro',   statuses: ['DEPOSIT_PAGO','TUITION_PARCIAL','TUITION_QUITADA'] },
  { label: 'Matrícula',    statuses: ['MATRICULADO','VISTO','EMBARQUE','EM_PROGRAMA'] },
]

const ORIGEM_LABEL: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  FACEBOOK:  'Facebook',
  GOOGLE:    'Google',
  SITE:      'Site',
  FEIRA:     'Feira',
  EVENTO:    'Evento',
  WHATSAPP:  'WhatsApp',
  OUTRO:     'Outro',
}

const PERDA_LABEL: Record<string, string> = {
  SEM_RETORNO:       'Sem retorno',
  SEM_BUDGET:        'Sem budget',
  FECHOU_CONCORRENTE: 'Fechou com concorrente',
  DESISTIU:          'Desistiu',
}

const FUNIL_LABEL: Record<string, string> = {
  DEPOSIT_PAGO:    'Depósito Pago',
  TUITION_PARCIAL: 'Tuition Parcial',
  TUITION_QUITADA: 'Tuition Quitada',
  MATRICULADO:     'Matriculado',
  VISTO:           'Visto Emitido',
  EMBARQUE:        'Embarque',
  EM_PROGRAMA:     'Em Programa',
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

type SearchParams = Promise<Record<string, string | undefined>>

export default async function RelatoriosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const currentUser = await getCurrentUser()

  // ── Date range ──────────────────────────────────────────────────────────────
  const today = new Date()
  const defaultDe = format(startOfMonth(today), 'yyyy-MM-dd')
  const defaultAte = format(today, 'yyyy-MM-dd')

  const deStr  = params.de  ?? defaultDe
  const ateStr = params.ate ?? defaultAte

  const dateFrom = new Date(`${deStr}T00:00:00`)
  const dateTo   = new Date(`${ateStr}T23:59:59`)

  // ── Consultor filter ────────────────────────────────────────────────────────
  const consultorIdParam = params.consultor
  const consultorFilter =
    currentUser.role === Role.CONSULTOR
      ? currentUser.id
      : consultorIdParam || undefined

  const consultorWhere = consultorFilter
    ? { consultorId: consultorFilter }
    : {}

  // ── Parallel queries ────────────────────────────────────────────────────────
  const [leadsInPeriod, leadsAtivos, aplicacoesAtivas, consultores, produtividadeData] = await Promise.all([
    // Leads created in the date range — drives tabs 1 and 2
    prisma.lead.findMany({
      where: {
        ...consultorWhere,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: {
        id: true,
        nome: true,
        funilStatus: true,
        origemLead: true,
        createdAt: true,
        consultorId: true,
        consultor: { select: { id: true, nome: true } },
        diagnostico: { select: { objetivoPrograma: true, destinosDesejados: true } },
        financeiro: {
          select: {
            moeda: true,
            cambioUsado: true,
            tuitionValor: true,
            comissaoPrevista: true,
            comissaoRecebida: true,
            comissaoStatus: true,
          },
        },
      },
    }),

    // All active leads (no date filter) — for tempo médio per macroetapa
    prisma.lead.findMany({
      where: { ...consultorWhere, funilStatus: { notIn: PERDIDO } },
      select: { funilStatus: true, createdAt: true },
    }),

    // All active aplicacoes (no date filter) — for operacional checklist table
    prisma.aplicacao.findMany({
      where: { lead: { ...consultorWhere, funilStatus: { notIn: PERDIDO } } },
      select: {
        checklistDocs: true,
        lead: {
          select: {
            id: true,
            nome: true,
            consultor: { select: { nome: true } },
          },
        },
      },
    }),

    // Consultores for filter dropdown
    currentUser.role === Role.DIRECAO || currentUser.role === Role.ADMINISTRATIVO || currentUser.role === Role.FINANCEIRO
      ? prisma.user.findMany({
          where: { role: Role.CONSULTOR, ativo: true },
          select: { id: true, nome: true },
          orderBy: { nome: 'asc' },
        })
      : Promise.resolve([]),

    // Produtividade (DIRECAO only)
    currentUser.role === Role.DIRECAO
      ? getProductivityMetrics({ de: deStr, ate: ateStr })
      : Promise.resolve(null),
  ])

  // ── Aba 1: Leads e Conversão ─────────────────────────────────────────────

  // Leads por origem
  const origemMap = new Map<string, number>()
  for (const l of leadsInPeriod) {
    if (!l.origemLead) continue
    origemMap.set(l.origemLead, (origemMap.get(l.origemLead) ?? 0) + 1)
  }
  const origemData = Array.from(origemMap.entries())
    .map(([origem, count]) => ({ label: ORIGEM_LABEL[origem] ?? origem, count }))
    .sort((a, b) => b.count - a.count)

  // Conversão por consultor
  const byConsultor = new Map<string, { nome: string; total: number; emProposta: number; fechados: number }>()
  for (const l of leadsInPeriod) {
    if (!byConsultor.has(l.consultorId)) {
      byConsultor.set(l.consultorId, { nome: l.consultor.nome, total: 0, emProposta: 0, fechados: 0 })
    }
    const entry = byConsultor.get(l.consultorId)!
    entry.total++
    if (PROPOSTA.includes(l.funilStatus))  entry.emProposta++
    if (FECHADOS.includes(l.funilStatus))  entry.fechados++
  }
  const consultorConversao = Array.from(byConsultor.entries())
    .map(([id, d]) => ({ id, nome: d.nome, total: d.total, emProposta: d.emProposta, fechados: d.fechados }))
    .sort((a, b) => b.total - a.total)

  // Leads por destino e programa
  const destinoMap = new Map<string, number>()
  for (const l of leadsInPeriod) {
    const prog = l.diagnostico?.objetivoPrograma
    const programaLabel = prog ? (PROGRAMA_LABEL[prog] ?? prog) : 'Não definido'
    const destinos = l.diagnostico?.destinosDesejados ?? []
    for (const destino of destinos) {
      const key = `${destino}|||${programaLabel}`
      destinoMap.set(key, (destinoMap.get(key) ?? 0) + 1)
    }
  }
  const destinoPrograma = Array.from(destinoMap.entries())
    .map(([key, count]) => {
      const [destino, programa] = key.split('|||')
      return { destino, programa, count }
    })
    .sort((a, b) => b.count - a.count)

  // ── Aba 2: Pipeline Financeiro ───────────────────────────────────────────

  const canSeeFinanceiro =
    currentUser.role === Role.DIRECAO || currentUser.role === Role.ADMINISTRATIVO || currentUser.role === Role.FINANCEIRO

  const financeiro: RelatoriosData['financeiro'] = canSeeFinanceiro
    ? (() => {
        const ativos = leadsInPeriod.filter((l) => !PERDIDO.includes(l.funilStatus))

        // BRL = valor na moeda original * câmbio. sumBRL/toBRL ignoram linhas sem
        // câmbio para nunca somar moedas diferentes como se fossem R$ (Decimal→number).
        const comissaoPrevistaSoma = sumBRL(
          ativos.map((l) => ({
            valor: decToNum(l.financeiro?.comissaoPrevista),
            cambio: decToNum(l.financeiro?.cambioUsado),
          })),
        )
        const comissaoRecebidaSoma = sumBRL(
          leadsInPeriod.map((l) => ({
            valor: decToNum(l.financeiro?.comissaoRecebida),
            cambio: decToNum(l.financeiro?.cambioUsado),
          })),
        )

        const leadsFinanceiro = leadsInPeriod.filter((l) =>
          FINANCEIRO_STAGES.includes(l.funilStatus),
        )

        const tuitionBRLSoma = sumBRL(
          leadsFinanceiro.map((l) => ({
            valor: decToNum(l.financeiro?.tuitionValor),
            cambio: decToNum(l.financeiro?.cambioUsado),
          })),
        )

        const leads = leadsFinanceiro.map((l) => {
          const cambio = decToNum(l.financeiro?.cambioUsado)
          return {
            leadId:            l.id,
            leadNome:          l.nome,
            funilStatusLabel:  FUNIL_LABEL[l.funilStatus] ?? l.funilStatus,
            moeda:             l.financeiro?.moeda ?? null,
            cambioUsado:       cambio,
            // Tudo em BRL (a tabela formata como R$ via fmtBRL).
            tuitionBRL:        toBRL(decToNum(l.financeiro?.tuitionValor), cambio),
            comissaoPrevista:  toBRL(decToNum(l.financeiro?.comissaoPrevista), cambio),
            comissaoRecebida:  toBRL(decToNum(l.financeiro?.comissaoRecebida), cambio),
            comissaoStatus:    l.financeiro?.comissaoStatus ?? 'PENDENTE',
          }
        })

        return { comissaoPrevistaSoma, comissaoRecebidaSoma, tuitionBRLSoma, leads }
      })()
    : null

  // ── Aba 3: Operacional ───────────────────────────────────────────────────

  // Tempo médio por macroetapa (idade dos leads ativos)
  const now = new Date()
  const macroetapasTempo = MACROETAPAS.map((m) => {
    const leads = leadsAtivos.filter((l) => m.statuses.includes(l.funilStatus))
    const totalLeads = leads.length
    if (totalLeads === 0) return { macroetapa: m.label, totalLeads: 0, idadeMediaDias: 0 }
    const sumDias = leads.reduce(
      (acc, l) => acc + differenceInDays(now, l.createdAt),
      0,
    )
    return { macroetapa: m.label, totalLeads, idadeMediaDias: Math.round(sumDias / totalLeads) }
  })

  // Motivos de perda
  const perdidos = leadsInPeriod.filter((l) => PERDIDO.includes(l.funilStatus))
  const motivosMap = new Map<string, number>()
  for (const l of perdidos) {
    motivosMap.set(l.funilStatus, (motivosMap.get(l.funilStatus) ?? 0) + 1)
  }
  const motivosPerda = Array.from(motivosMap.entries())
    .map(([status, count]) => ({
      label: PERDA_LABEL[status] ?? status,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // Aplicações ativas com % conclusão
  const aplicacoes = aplicacoesAtivas
    .map((apl) => {
      const docs = (apl.checklistDocs as unknown as ChecklistItem[]) ?? []
      const total         = docs.length
      const docsAprovados = docs.filter((d) => d.status === 'APROVADO').length
      const docsPendentes = docs.filter((d) => d.status === 'PENDENTE').length
      return {
        leadId:       apl.lead.id,
        leadNome:     apl.lead.nome,
        consultor:    apl.lead.consultor.nome,
        totalDocs:    total,
        docsAprovados,
        docsPendentes,
        percentual:   total > 0 ? Math.round((docsAprovados / total) * 100) : 0,
      }
    })
    .sort((a, b) => a.percentual - b.percentual)

  // ── Assemble ────────────────────────────────────────────────────────────────

  const relatoriosData: RelatoriosData = {
    origemData,
    consultorConversao,
    destinoPrograma,
    financeiro,
    macroetapasTempo,
    motivosPerda,
    aplicacoes,
    produtividade: produtividadeData,
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900/5">
              <BarChart2 className="size-4 text-navy-900" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-stone-900">Relatórios</h1>
              <p className="text-xs text-stone-400">
                {deStr} — {ateStr}
              </p>
            </div>
          </div>
          <Suspense fallback={null}>
            <RelatoriosFiltros
              currentParams={params}
              consultores={consultores}
              showConsultorFilter={
                currentUser.role === Role.DIRECAO || currentUser.role === Role.ADMINISTRATIVO || currentUser.role === Role.FINANCEIRO
              }
              defaultDe={defaultDe}
              defaultAte={defaultAte}
            />
          </Suspense>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RelatoriosAbas data={relatoriosData} role={currentUser.role} />
      </div>
    </div>
  )
}
