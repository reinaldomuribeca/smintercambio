import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import type { LeadRow } from '@/lib/actions/leads'

// ─── Status badges ────────────────────────────────────────────────────────────

type MacroEtapa = {
  label: string
  bg: string
  text: string
  dot: string
}

const MACROETAPA: Record<string, MacroEtapa> = {
  NOVO_LEAD:              { label: 'Lead',          bg: 'bg-stone-100',   text: 'text-stone-600',  dot: 'bg-stone-400' },
  REUNIAO_AGENDADA:       { label: 'Qualificação',  bg: 'bg-yellow-50',   text: 'text-yellow-700', dot: 'bg-yellow-400' },
  REUNIAO_REALIZADA:      { label: 'Qualificação',  bg: 'bg-yellow-50',   text: 'text-yellow-700', dot: 'bg-yellow-400' },
  DIAGNOSTICO_CONCLUIDO:  { label: 'Qualificação',  bg: 'bg-yellow-50',   text: 'text-yellow-700', dot: 'bg-yellow-400' },
  PROPOSTA_ENVIADA:       { label: 'Proposta',      bg: 'bg-orange-50',   text: 'text-orange-700', dot: 'bg-orange-400' },
  FOLLOWUP_ESTRATEGICO:   { label: 'Proposta',      bg: 'bg-orange-50',   text: 'text-orange-700', dot: 'bg-orange-400' },
  EM_DECISAO:             { label: 'Proposta',      bg: 'bg-orange-50',   text: 'text-orange-700', dot: 'bg-orange-400' },
  EM_APLICACAO:           { label: 'Aplicação',     bg: 'bg-sky-50',      text: 'text-sky-700',    dot: 'bg-sky-400' },
  DOCUMENTACAO_PENDENTE:  { label: 'Aplicação',     bg: 'bg-sky-50',      text: 'text-sky-700',    dot: 'bg-sky-400' },
  APPLICATION_ENVIADA:    { label: 'Aplicação',     bg: 'bg-sky-50',      text: 'text-sky-700',    dot: 'bg-sky-400' },
  ENTREVISTA_TESTE:       { label: 'Admissão',      bg: 'bg-violet-50',   text: 'text-violet-700', dot: 'bg-violet-400' },
  ACEITO_PELA_ESCOLA:     { label: 'Admissão',      bg: 'bg-violet-50',   text: 'text-violet-700', dot: 'bg-violet-400' },
  OFFER_ENVIADA:          { label: 'Admissão',      bg: 'bg-violet-50',   text: 'text-violet-700', dot: 'bg-violet-400' },
  DEPOSIT_PAGO:           { label: 'Financeiro',    bg: 'bg-emerald-50',  text: 'text-emerald-700',dot: 'bg-emerald-400' },
  TUITION_PARCIAL:        { label: 'Financeiro',    bg: 'bg-emerald-50',  text: 'text-emerald-700',dot: 'bg-emerald-400' },
  TUITION_QUITADA:        { label: 'Financeiro',    bg: 'bg-emerald-50',  text: 'text-emerald-700',dot: 'bg-emerald-400' },
  MATRICULADO:            { label: 'Matrícula',     bg: 'bg-green-50',    text: 'text-green-700',  dot: 'bg-green-500' },
  VISTO:                  { label: 'Matrícula',     bg: 'bg-green-50',    text: 'text-green-700',  dot: 'bg-green-500' },
  EMBARQUE:               { label: 'Matrícula',     bg: 'bg-green-50',    text: 'text-green-700',  dot: 'bg-green-500' },
  EM_PROGRAMA:            { label: 'Matrícula',     bg: 'bg-green-50',    text: 'text-green-700',  dot: 'bg-green-500' },
  SEM_RETORNO:            { label: 'Perdido',       bg: 'bg-red-50',      text: 'text-red-600',    dot: 'bg-red-400' },
  SEM_BUDGET:             { label: 'Perdido',       bg: 'bg-red-50',      text: 'text-red-600',    dot: 'bg-red-400' },
  FECHOU_CONCORRENTE:     { label: 'Perdido',       bg: 'bg-red-50',      text: 'text-red-600',    dot: 'bg-red-400' },
  DESISTIU:               { label: 'Perdido',       bg: 'bg-red-50',      text: 'text-red-600',    dot: 'bg-red-400' },
}

const STATUS_SUBLABEL: Record<string, string> = {
  REUNIAO_AGENDADA:      'Reunião agendada',
  REUNIAO_REALIZADA:     'Reunião realizada',
  DIAGNOSTICO_CONCLUIDO: 'Diagnóstico concluído',
  PROPOSTA_ENVIADA:      'Proposta enviada',
  FOLLOWUP_ESTRATEGICO:  'Follow-up estratégico',
  EM_DECISAO:            'Em decisão',
  EM_APLICACAO:          'Em aplicação',
  DOCUMENTACAO_PENDENTE: 'Doc. pendente',
  APPLICATION_ENVIADA:   'Application enviada',
  ENTREVISTA_TESTE:      'Entrevista/Teste',
  ACEITO_PELA_ESCOLA:    'Aceito pela escola',
  OFFER_ENVIADA:         'Offer enviada',
  DEPOSIT_PAGO:          'Depósito pago',
  TUITION_PARCIAL:       'Tuition parcial',
  TUITION_QUITADA:       'Tuition quitada',
  SEM_RETORNO:           'Sem retorno',
  SEM_BUDGET:            'Sem budget',
  FECHOU_CONCORRENTE:    'Fechou concorrente',
}

function StatusBadge({ status }: { status: string }) {
  const etapa = MACROETAPA[status] ?? { label: status, bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' }
  const sub = STATUS_SUBLABEL[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${etapa.bg} ${etapa.text}`}>
      <span className={`size-1.5 rounded-full ${etapa.dot}`} />
      <span>{sub ?? etapa.label}</span>
    </span>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function buildUrl(base: Record<string, string | undefined>, overrides: Record<string, string>) {
  const params = new URLSearchParams()
  const merged = { ...base, ...overrides }
  Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
  return `/leads?${params.toString()}`
}

// ─── Table ────────────────────────────────────────────────────────────────────

type Props = {
  leads: LeadRow[]
  total: number
  page: number
  pages: number
  currentParams: Record<string, string | undefined>
}

export function LeadsTable({ leads, total, page, pages, currentParams }: Props) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-20 text-center">
        <Inbox className="mb-3 size-10 text-stone-300" />
        <p className="font-medium text-stone-500">Nenhum lead encontrado</p>
        <p className="mt-1 text-sm text-stone-400">Tente ajustar os filtros ou cadastre um novo lead.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nome do aluno</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 sm:table-cell">Cidade / Estado</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 md:table-cell">Origem</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 lg:table-cell">Consultor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 xl:table-cell">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="group transition-colors hover:bg-cream-50"
              >
                <td className="px-4 py-3.5">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-navy-900 group-hover:text-amber-600 group-hover:underline"
                  >
                    {lead.nome}
                  </Link>
                </td>
                <td className="hidden px-4 py-3.5 text-stone-600 sm:table-cell">
                  {lead.cidade && lead.estado
                    ? `${lead.cidade}, ${lead.estado}`
                    : lead.cidade ?? lead.estado ?? '—'}
                </td>
                <td className="hidden px-4 py-3.5 text-stone-500 md:table-cell">
                  {lead.origemLead ? ORIGEM_LABEL[lead.origemLead] : '—'}
                </td>
                <td className="hidden px-4 py-3.5 text-stone-600 lg:table-cell">
                  {lead.consultor.nome}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={lead.funilStatus} />
                </td>
                <td className="hidden px-4 py-3.5 text-stone-400 xl:table-cell">
                  {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>
            Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
          </span>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={buildUrl(currentParams, { page: String(page - 1) })}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-cream-200 bg-white hover:bg-cream-50"
              >
                <ChevronLeft className="size-4" />
              </Link>
            )}
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <Link
                  key={p}
                  href={buildUrl(currentParams, { page: String(p) })}
                  className={`inline-flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                    p === page
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-cream-200 bg-white text-stone-600 hover:bg-cream-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
            {page < pages && (
              <Link
                href={buildUrl(currentParams, { page: String(page + 1) })}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-cream-200 bg-white hover:bg-cream-50"
              >
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ORIGEM_LABEL: Record<string, string> = {
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  SITE: 'Site',
  FEIRA: 'Feira',
  EVENTO: 'Evento',
  WHATSAPP: 'WhatsApp',
  OUTRO: 'Outro',
}
