'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { User, MapPin, Calendar, Zap, RefreshCw } from 'lucide-react'
import { reatribuirConsultor, type ReatribuirState } from '@/lib/actions/leads'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Submit button ────────────────────────────────────────────────────────────

function SaveBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
      <RefreshCw className="size-3.5" />
      {pending ? 'Salvando…' : 'Reatribuir'}
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  leadId: string
  nome: string
  cidade: string | null
  estado: string | null
  funilStatus: string
  origemLead: string | null
  createdAt: string
  consultor: { id: string; nome: string }
  consultores: { id: string; nome: string }[]
  role: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AbaPerfilLead({
  leadId, nome, cidade, estado, funilStatus, origemLead, createdAt, consultor, consultores, role,
}: Props) {
  const [state, formAction] = useActionState(reatribuirConsultor, null as ReatribuirState)

  const location = [cidade, estado].filter(Boolean).join(', ')

  return (
    <div className="max-w-xl space-y-5">
      {/* Info grid */}
      <div className="rounded-xl border border-cream-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <User className="size-4 text-amber-500" /> Dados do Lead
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Status no funil</p>
            <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              {STATUS_LABEL[funilStatus] ?? funilStatus}
            </span>
          </div>

          {location && (
            <div>
              <p className="text-xs text-stone-400 mb-0.5 flex items-center gap-1">
                <MapPin className="size-3" /> Localização
              </p>
              <p className="font-medium text-stone-800">{location}</p>
            </div>
          )}

          {origemLead && (
            <div>
              <p className="text-xs text-stone-400 mb-0.5 flex items-center gap-1">
                <Zap className="size-3" /> Origem
              </p>
              <p className="font-medium text-stone-800">{ORIGEM_LABEL[origemLead] ?? origemLead}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-stone-400 mb-0.5 flex items-center gap-1">
              <Calendar className="size-3" /> Cadastrado em
            </p>
            <p className="font-medium text-stone-800">
              {format(new Date(createdAt), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Consultor */}
      <div className="rounded-xl border border-cream-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <User className="size-4 text-amber-500" /> Consultor Responsável
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
            {consultor.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-stone-900">{consultor.nome}</p>
            <p className="text-xs text-stone-400">Consultor responsável</p>
          </div>
        </div>

        {/* Reatribuição — apenas DIRECAO */}
        {role === 'DIRECAO' && consultores.length > 0 && (
          <div className="border-t border-cream-100 pt-4">
            <p className="mb-2 text-xs font-medium text-stone-500">Reatribuir para outro consultor</p>

            {state?.success && (
              <p className="mb-2 text-sm text-emerald-600 font-medium">Consultor atualizado com sucesso.</p>
            )}
            {state?.error && (
              <p className="mb-2 text-sm text-red-600">{state.error}</p>
            )}

            <form action={formAction} className="flex items-center gap-2">
              <input type="hidden" name="leadId" value={leadId} />
              <select
                name="consultorId"
                defaultValue={consultor.id}
                className="flex-1 rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                {consultores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <SaveBtn />
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
