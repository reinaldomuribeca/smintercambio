'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plane, Search, Inbox } from 'lucide-react'
import type { JornadaOverviewItem } from '@/lib/actions/jornada'
import { JornadaStatus } from '@prisma/client'

const STATUS_LABEL: Record<JornadaStatus, string> = {
  FECHAMENTO_MATRICULA: 'Fechamento e Matrícula',
  PREPARACAO_VIAGEM:    'Preparação da Viagem',
  VIAJANDO:             'Viajando',
  RETORNOU:             'Retornou',
}

const STATUS_COLOR: Record<JornadaStatus, string> = {
  FECHAMENTO_MATRICULA: 'bg-amber-50 text-amber-700',
  PREPARACAO_VIAGEM:    'bg-blue-50 text-blue-700',
  VIAJANDO:             'bg-green-50 text-green-700',
  RETORNOU:             'bg-stone-100 text-stone-500',
}

const PRE_LABEL: Record<string, string> = {
  PENDENTE: 'Pré-embarque pendente',
  REALIZADO: 'Pré-embarque realizado',
}

export function JornadaOverview({ jornadas }: { jornadas: JornadaOverviewItem[] }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = jornadas.filter((j) => {
    const q = search.toLowerCase()
    const matchSearch = !q || j.leadNome.toLowerCase().includes(q) || j.escolaNome.toLowerCase().includes(q) || j.paisNome.toLowerCase().includes(q)
    const matchStatus = !filterStatus || j.status === filterStatus
    return matchSearch && matchStatus
  })

  if (jornadas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-20 text-center">
        <Inbox className="mb-3 size-10 text-stone-300" />
        <p className="font-medium text-stone-500">Nenhuma jornada iniciada</p>
        <p className="mt-1 text-sm text-stone-400">Configure o destino de um estudante na aba Destino da ficha do lead.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Buscar estudante ou escola…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 rounded-lg border border-cream-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm outline-none focus:border-amber-500">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Estudante</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 md:table-cell">Escola / País</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 lg:table-cell">Embarque</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Progresso</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 xl:table-cell">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 xl:table-cell">Consultor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {filtered.map((j) => {
              const pct = j.totalEtapas > 0 ? Math.round((j.etapasConcluidas / j.totalEtapas) * 100) : 0
              return (
                <tr key={j.id} className="group hover:bg-cream-50">
                  <td className="px-4 py-3.5">
                    <Link href={`/jornada/${j.id}`} className="font-medium text-navy-900 group-hover:text-amber-600 group-hover:underline">
                      {j.leadNome}
                    </Link>
                    {j.preEmbarqueStatus && (
                      <p className="text-[10px] text-stone-400 mt-0.5">{PRE_LABEL[j.preEmbarqueStatus] ?? j.preEmbarqueStatus}</p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    <p className="font-medium text-stone-700">{j.escolaNome}</p>
                    <p className="text-xs text-stone-400">
                      {j.paisBandeira && j.paisBandeira.length <= 4 ? j.paisBandeira + ' ' : ''}{j.paisNome}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3.5 lg:table-cell">
                    {j.embarqueEm ? (
                      <div className="flex items-center gap-1.5">
                        <Plane className="size-3.5 text-amber-500" />
                        <span className="text-stone-600">{format(new Date(j.embarqueEm), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    ) : <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-cream-200">
                        <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-stone-500">{pct}%</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-stone-400">{j.etapasConcluidas}/{j.totalEtapas} etapas</p>
                  </td>
                  <td className="hidden px-4 py-3.5 xl:table-cell">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_COLOR[j.status]}`}>
                      {STATUS_LABEL[j.status]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3.5 text-stone-500 xl:table-cell">{j.consultorNome.split(' ')[0]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-stone-400">Nenhuma jornada encontrada com os filtros atuais.</div>
        )}
      </div>
    </div>
  )
}
