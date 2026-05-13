'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { MapPin, Plane, School, ExternalLink, AlertTriangle } from 'lucide-react'
import { upsertDestinoLead } from '@/lib/actions/jornada'
import type { JornadaFormState } from '@/lib/actions/jornada'
import type { PaisData } from '@/lib/actions/destinos'
import { JornadaStatus } from '@prisma/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

type Props = {
  leadId: string
  paises: PaisData[]
  jornada: JornadaSummary
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const INPUT = 'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
const LABEL = 'mb-1 block text-xs font-medium text-stone-600'

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
      {pending ? 'Salvando…' : label}
    </button>
  )
}

// ─── JornadaCard (read-only summary) ─────────────────────────────────────────

function JornadaCard({ jornada, onTrocar }: { jornada: NonNullable<JornadaSummary>; onTrocar: () => void }) {
  const total = jornada.etapas.length
  const concluidas = jornada.etapas.filter((e) => e.status === 'CONCLUIDO').length
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  return (
    <div className="rounded-xl border border-cream-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {jornada.escola.pais.bandeira && jornada.escola.pais.bandeira.length <= 4 && (
              <span className="text-2xl leading-none">{jornada.escola.pais.bandeira}</span>
            )}
            <h3 className="font-semibold text-stone-900">{jornada.escola.nome}</h3>
          </div>
          <p className="text-sm text-stone-500">{jornada.escola.pais.nome}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[jornada.status]}`}>
          {STATUS_LABEL[jornada.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {jornada.embarqueEm && (
          <div>
            <p className="text-xs text-stone-400">Embarque</p>
            <p className="font-medium text-stone-800 flex items-center gap-1.5">
              <Plane className="size-3.5 text-amber-500" />
              {format(new Date(jornada.embarqueEm), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        )}
        {jornada.retornoEm && (
          <div>
            <p className="text-xs text-stone-400">Retorno</p>
            <p className="font-medium text-stone-800">{format(new Date(jornada.retornoEm), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
        )}
      </div>

      {total > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span>Progresso da jornada</span>
            <span className="font-medium text-stone-700">{concluidas}/{total} etapas • {pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-cream-200">
            <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Link href={`/jornada/${jornada.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800">
          <ExternalLink className="size-4" /> Ver Jornada Completa
        </Link>
        <button onClick={onTrocar}
          className="rounded-lg border border-cream-200 px-3 py-2 text-sm text-stone-600 hover:bg-cream-50">
          Trocar Escola
        </button>
      </div>
    </div>
  )
}

// ─── AbaDestino ───────────────────────────────────────────────────────────────

export function AbaDestino({ leadId, paises, jornada }: Props) {
  const [state, formAction] = useActionState(upsertDestinoLead, null as JornadaFormState)
  const [selectedPaisId, setSelectedPaisId] = useState('')
  const [selectedEstadoId, setSelectedEstadoId] = useState('')
  const [selectedCidadeId, setSelectedCidadeId] = useState('')
  const [showTrocarAlert, setShowTrocarAlert] = useState(false)
  const [editMode, setEditMode] = useState(!jornada)
  const hasSubmitted = useRef(false)

  const paisAtivo = paises.find((p) => p.id === selectedPaisId)
  const estadosDosPais = paisAtivo?.estados.filter((e) => e.ativo) ?? []
  const cidadesDoEstado = estadosDosPais.find((e) => e.id === selectedEstadoId)?.cidades.filter((c) => c.ativo) ?? []
  const escolasDaCidade = cidadesDoEstado.find((c) => c.id === selectedCidadeId)?.escolas.filter((e) => e.ativo) ?? []

  useEffect(() => {
    if (hasSubmitted.current && state?.success) {
      hasSubmitted.current = false
      setEditMode(false)
      setShowTrocarAlert(false)
    }
  }, [state])

  function handleTrocar() {
    if (jornada) {
      setShowTrocarAlert(true)
    } else {
      setEditMode(true)
    }
  }

  if (!editMode && jornada) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="size-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-stone-700">Destino & Jornada</h2>
        </div>
        <JornadaCard jornada={jornada} onTrocar={handleTrocar} />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-stone-700">
          {jornada ? 'Trocar Destino' : 'Configurar Destino'}
        </h2>
      </div>

      {showTrocarAlert && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Atenção: trocar a escola substituirá a jornada atual</p>
            <p className="text-xs text-amber-600 mt-0.5">Todas as etapas e dados preenchidos serão perdidos. Esta ação não pode ser desfeita.</p>
          </div>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <form action={formAction} onSubmit={() => { hasSubmitted.current = true }} className="space-y-4 rounded-xl border border-cream-200 bg-white p-5">
        <input type="hidden" name="leadId" value={leadId} />

        <div>
          <label className={LABEL}>País de destino *</label>
          <select
            value={selectedPaisId}
            onChange={(e) => { setSelectedPaisId(e.target.value); setSelectedEstadoId(''); setSelectedCidadeId('') }}
            required
            className={INPUT}
          >
            <option value="">Selecione o país…</option>
            {paises.filter((p) => p.ativo).map((p) => (
              <option key={p.id} value={p.id}>
                {p.bandeira && p.bandeira.length <= 4 ? p.bandeira + ' ' : ''}{p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Estado / Região *</label>
          <select
            value={selectedEstadoId}
            onChange={(e) => { setSelectedEstadoId(e.target.value); setSelectedCidadeId('') }}
            required
            disabled={!selectedPaisId}
            className={INPUT + (!selectedPaisId ? ' opacity-50 cursor-not-allowed' : '')}
          >
            <option value="">{selectedPaisId ? 'Selecione o estado…' : 'Selecione o país primeiro'}</option>
            {estadosDosPais.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}{e.sigla ? ` (${e.sigla})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Cidade *</label>
          <select
            value={selectedCidadeId}
            onChange={(e) => setSelectedCidadeId(e.target.value)}
            required
            disabled={!selectedEstadoId}
            className={INPUT + (!selectedEstadoId ? ' opacity-50 cursor-not-allowed' : '')}
          >
            <option value="">{selectedEstadoId ? 'Selecione a cidade…' : 'Selecione o estado primeiro'}</option>
            {cidadesDoEstado.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Escola *</label>
          <select name="escolaId" required disabled={!selectedCidadeId} className={INPUT + (!selectedCidadeId ? ' opacity-50 cursor-not-allowed' : '')}>
            <option value="">{selectedCidadeId ? 'Selecione a escola…' : 'Selecione a cidade primeiro'}</option>
            {escolasDaCidade.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
          {selectedCidadeId && escolasDaCidade.length === 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <School className="size-3.5" /> Nenhuma escola ativa nesta cidade. Cadastre uma em Configurações.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Data de embarque</label>
            <input type="date" name="embarqueEm" defaultValue={jornada?.embarqueEm ? jornada.embarqueEm.split('T')[0] : ''} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Data de retorno</label>
            <input type="date" name="retornoEm" defaultValue={jornada?.retornoEm ? jornada.retornoEm.split('T')[0] : ''} className={INPUT} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <SubmitBtn label={jornada ? 'Confirmar Troca' : 'Gerar Jornada'} />
          {jornada && (
            <button type="button" onClick={() => { setEditMode(false); setShowTrocarAlert(false) }}
              className="rounded-lg border border-cream-200 px-4 py-2 text-sm text-stone-600 hover:bg-cream-50">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
