'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, ChevronDown, ChevronUp, AlertTriangle, RotateCcw, Lock, Mail, Send, Copy, CheckCheck, Paperclip, X } from 'lucide-react'
import { concluirEtapa } from '@/lib/actions/fechamento'
import { CampoField, ConcluirBtn, DevolverForm } from '@/components/fechamento/etapa-form'
import { sendEmailFechamento } from '@/lib/actions/email-templates'
import type { FechamentoData, FechamentoActionState } from '@/lib/actions/fechamento'
import type { EmailTemplateItem } from '@/lib/actions/email-templates'
import type { EmailPlaceholderItem } from '@/lib/actions/email-placeholders'
import { ETAPAS_DEF } from '@/lib/fechamento-config'
import type { EtapaRole } from '@/lib/fechamento-config'

// ─── Email types (exported for the page) ─────────────────────────────────────

export type EmailContext = {
  leadNome:            string
  leadEmail:           string
  leadTelefone:        string
  leadCidade:          string
  leadEstado:          string
  nomeResponsaveis:    string
  nomePai:             string
  nomeMae:             string
  emailResponsavel:    string
  telefoneResponsavel: string
  objetivoPrograma:    string
  duracaoMeses:        string
  destinosDesejados:   string
  escolaNome:          string
  paisNome:            string
  embarqueEm:          string
  retornoEm:           string
  consultorNome:       string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<EtapaRole, string> = {
  CONSULTOR: 'bg-blue-50 text-blue-700',
  FINANCEIRO: 'bg-emerald-50 text-emerald-700',
}

const ROLE_LABEL: Record<EtapaRole, string> = {
  CONSULTOR: 'Consultor',
  FINANCEIRO: 'Financeiro',
}

// ─── EmailComposePanel ────────────────────────────────────────────────────────

const EMAIL_STEPS = [1, 4]

const DATE_FIELDS = new Set<keyof EmailContext>(['embarqueEm', 'retornoEm'])

function resolvePlaceholders(
  text: string,
  ctx: EmailContext,
  placeholders: EmailPlaceholderItem[],
): string {
  const tagMap: Record<string, keyof EmailContext> = Object.fromEntries(
    placeholders.map((p) => [p.tag, p.campoSistema as keyof EmailContext])
  )
  return text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const key = tagMap[match]
    if (!key) return match
    const val = ctx[key]
    if (!val) return match
    if (DATE_FIELDS.has(key)) {
      try { return new Date(val).toLocaleDateString('pt-BR') } catch { return val }
    }
    return val
  })
}

function SendEmailBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60">
      <Send className="size-3.5" />
      {pending ? 'Enviando…' : 'Enviar'}
    </button>
  )
}

function EmailComposePanel({
  template,
  ctx,
  stepNumero,
  placeholders,
}: {
  template: EmailTemplateItem | null
  ctx: EmailContext
  stepNumero: number
  placeholders: EmailPlaceholderItem[]
}) {
  const [destinatario, setDestinatario] = useState(ctx.leadEmail)
  const [assunto, setAssunto]           = useState('')
  const [corpo, setCorpo]               = useState('')
  const [generated, setGenerated]       = useState(false)
  const [anexos, setAnexos]             = useState<File[]>([])
  const [copied, setCopied]             = useState(false)
  const fileInputRef                    = useRef<HTMLInputElement>(null)

  const [sendState, sendAction] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, fd: FormData) =>
      sendEmailFechamento(fd),
    null,
  )

  function handleGenerate() {
    if (!template) return
    setAssunto(resolvePlaceholders(template.assunto, ctx, placeholders))
    setCorpo(resolvePlaceholders(template.corpo, ctx, placeholders))
    setGenerated(true)
  }

  function handleCopy() {
    navigator.clipboard.writeText(corpo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setAnexos((prev) => [...prev, ...Array.from(e.target.files!)])
    e.target.value = ''
  }

  function removeAnexo(idx: number) {
    setAnexos((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <Mail className="size-4" /> Enviar e-mail para o aluno
        </div>
        {!template && (
          <span className="text-xs text-stone-400">Nenhum template vinculado</span>
        )}
      </div>

      {template && !generated && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-400">Template vinculado</p>
            <p className="text-sm font-medium text-stone-800 truncate">{template.nome}</p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            <Mail className="size-3.5" /> Gerar e-mail
          </button>
        </div>
      )}

      {!template && (
        <p className="rounded-lg border border-dashed border-amber-200 px-3 py-3 text-center text-xs text-stone-400">
          Configure um template vinculado ao Step {stepNumero} em{' '}
          <span className="font-medium text-amber-700">Configurações → Templates de e-mail</span>.
        </p>
      )}

      {generated && (
        <form
          action={sendAction}
          className="space-y-2"
          onSubmit={(e) => {
            // inject selected files into FormData before submit
            const form = e.currentTarget
            anexos.forEach((f) => {
              const dt = new DataTransfer()
              dt.items.add(f)
              const input = document.createElement('input')
              input.type = 'file'
              input.name = 'anexos'
              input.files = dt.files
              form.appendChild(input)
            })
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Destinatário</label>
            <input name="destinatario" type="email" value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Assunto</label>
            <input name="assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)}
              placeholder="Assunto do e-mail"
              className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Corpo</label>
            <textarea name="corpo" value={corpo} onChange={(e) => setCorpo(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-lg border border-cream-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Anexos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-stone-600">Anexos</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800"
              >
                <Paperclip className="size-3" /> Adicionar arquivo
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFiles}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            />
            {anexos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {anexos.map((f, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs text-stone-700"
                  >
                    <Paperclip className="size-3 text-stone-400" />
                    <span className="max-w-[140px] truncate">{f.name}</span>
                    <button type="button" onClick={() => removeAnexo(i)} className="text-stone-400 hover:text-red-500">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {sendState?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{sendState.error}</p>
          )}
          {sendState?.success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">E-mail enviado com sucesso!</p>
          )}

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <SendEmailBtn />
            <button type="button" onClick={handleCopy} disabled={!corpo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-600 hover:bg-cream-50 disabled:opacity-40"
            >
              {copied ? <CheckCheck className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {copied ? 'Copiado!' : 'Copiar corpo'}
            </button>
            <button type="button"
              onClick={() => { setGenerated(false); setAssunto(''); setCorpo(''); setAnexos([]) }}
              className="text-xs text-stone-400 hover:text-stone-600 ml-auto"
            >
              Refazer
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── EtapaCard ────────────────────────────────────────────────────────────────

type EtapaCardProps = {
  def: typeof ETAPAS_DEF[0]
  etapaAtual: number
  fechamentoId: string
  dadosSalvos: Record<string, string>
  concluidaEm: string | null
  total: number
  emailTemplate: EmailTemplateItem | null
  emailCtx: EmailContext
  emailPlaceholders: EmailPlaceholderItem[]
}

function EtapaCard({ def, etapaAtual, fechamentoId, dadosSalvos, concluidaEm, total, emailTemplate, emailCtx, emailPlaceholders }: EtapaCardProps) {
  const isCurrent = def.numero === etapaAtual
  const isConcluida = def.numero < etapaAtual || (def.numero === etapaAtual && concluidaEm !== null)
  const isLocked = def.numero > etapaAtual
  const [expanded, setExpanded] = useState(isCurrent)
  const [showDevolver, setShowDevolver] = useState(false)
  const [state, formAction] = useActionState(concluirEtapa, null as FechamentoActionState)
  const hasSubmitted = useRef(false)
  const isLast = def.numero === total

  useEffect(() => {
    if (hasSubmitted.current && state?.success) {
      hasSubmitted.current = false
      setExpanded(false)
    }
  }, [state])

  const devolveParaDef = def.podeDevolver && def.devolveParaNumero
    ? ETAPAS_DEF.find((e) => e.numero === def.devolveParaNumero)
    : null

  return (
    <div className={`rounded-xl border transition-all ${
      isCurrent ? 'border-amber-300 bg-white shadow-sm' :
      isConcluida ? 'border-cream-200 bg-cream-50' :
      'border-cream-200 bg-white opacity-60'
    }`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => !isLocked && setExpanded((v) => !v)}
        disabled={isLocked}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        {/* Step indicator */}
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isConcluida ? 'bg-emerald-500 text-white' :
          isCurrent ? 'bg-amber-500 text-white' :
          'bg-cream-200 text-stone-400'
        }`}>
          {isConcluida ? <Check className="size-4" /> : isLocked ? <Lock className="size-3.5" /> : def.numero}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isCurrent ? 'text-stone-900' : isConcluida ? 'text-stone-700' : 'text-stone-400'}`}>
              {def.titulo}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[def.role]}`}>
              {ROLE_LABEL[def.role]}
            </span>
            {isConcluida && concluidaEm && (
              <span className="text-xs text-stone-400">
                {new Date(concluidaEm).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          {(isCurrent || isLocked) && !isConcluida && (
            <p className="mt-0.5 text-xs text-stone-500 line-clamp-1">{def.descricao}</p>
          )}
        </div>

        {!isLocked && (
          <div className="shrink-0 text-stone-400">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && !isLocked && (
        <div className="border-t border-cream-200 px-5 pb-5 pt-4">
          <p className="mb-4 text-sm text-stone-600">{def.descricao}</p>

          {/* Completed: show saved data */}
          {isConcluida && Object.keys(dadosSalvos).length > 0 && (
            <div className="mb-4 space-y-2 rounded-lg bg-white border border-cream-200 p-4">
              {def.campos.map((c) => dadosSalvos[c.name] ? (
                <div key={c.name}>
                  <p className="text-xs text-stone-400">{c.label}</p>
                  <p className="text-sm text-stone-800 whitespace-pre-wrap">{dadosSalvos[c.name]}</p>
                </div>
              ) : null)}
            </div>
          )}

          {/* Active form */}
          {isCurrent && (
            <>
              {state?.error && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  {state.error}
                </div>
              )}

              <form
                action={formAction}
                onSubmit={() => { hasSubmitted.current = true }}
                className="space-y-4"
              >
                <input type="hidden" name="fechamentoId" value={fechamentoId} />
                <input type="hidden" name="numero" value={def.numero} />

                {def.campos.map((campo) => (
                  <CampoField key={campo.name} campo={campo} defaultValue={dadosSalvos[campo.name]} />
                ))}

                <div className="flex items-center gap-2 pt-1">
                  <ConcluirBtn />
                  {isLast && (
                    <p className="text-xs text-stone-500">Esta é a última etapa do processo.</p>
                  )}
                </div>
              </form>

              {/* Devolver section */}
              {def.podeDevolver && devolveParaDef && !showDevolver && (
                <div className="mt-4 border-t border-cream-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDevolver(true)}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
                  >
                    <RotateCcw className="size-3.5" />
                    Devolver para etapa {devolveParaDef.numero}
                  </button>
                </div>
              )}

              {showDevolver && devolveParaDef && def.devolveParaNumero && (
                <DevolverForm
                  fechamentoId={fechamentoId}
                  numero={def.numero}
                  devolveParaNumero={def.devolveParaNumero}
                  devolveParaTitulo={devolveParaDef.titulo}
                  onCancel={() => setShowDevolver(false)}
                />
              )}

              {EMAIL_STEPS.includes(def.numero) && (
                <EmailComposePanel template={emailTemplate} ctx={emailCtx} stepNumero={def.numero} placeholders={emailPlaceholders} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── FechamentoFlow ───────────────────────────────────────────────────────────

type Props = {
  fechamento: FechamentoData
  emailTemplatesByStep: Record<number, EmailTemplateItem>
  emailCtx: EmailContext
  emailPlaceholders: EmailPlaceholderItem[]
}

export function FechamentoFlow({ fechamento, emailTemplatesByStep, emailCtx, emailPlaceholders }: Props) {
  const etapaMap = new Map(fechamento.etapas.map((e) => [e.numero, e]))

  if (fechamento.concluido) {
    return (
      <div className="overflow-hidden rounded-xl border border-emerald-300 bg-emerald-50">
        {/* Faixa 100% concluída */}
        <div className="bg-emerald-500/30 px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-3">
            <Check className="size-5 text-emerald-800" />
            <span className="text-sm font-bold uppercase tracking-widest text-emerald-900">
              Etapa 100% Concluída
            </span>
            <Check className="size-5 text-emerald-800" />
          </div>
        </div>

        {/* Step cards */}
        <div className="space-y-3 p-5">
          {ETAPAS_DEF.map((def) => {
            const etapa = etapaMap.get(def.numero)
            return (
              <EtapaCard
                key={def.numero}
                def={def}
                etapaAtual={fechamento.etapaAtual}
                fechamentoId={fechamento.id}
                dadosSalvos={etapa?.dados ?? {}}
                concluidaEm={etapa?.concluidaEm ?? null}
                total={ETAPAS_DEF.length}
                emailTemplate={emailTemplatesByStep[def.numero] ?? null}
                emailPlaceholders={emailPlaceholders}
                emailCtx={emailCtx}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
        <span>Etapa {fechamento.etapaAtual} de {ETAPAS_DEF.length}</span>
        <span className="font-medium text-stone-700">
          {Math.round(((fechamento.etapaAtual - 1) / ETAPAS_DEF.length) * 100)}% concluído
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-cream-200 mb-4">
        <div
          className="h-1.5 rounded-full bg-amber-400 transition-all"
          style={{ width: `${((fechamento.etapaAtual - 1) / ETAPAS_DEF.length) * 100}%` }}
        />
      </div>

      {ETAPAS_DEF.map((def) => {
        const etapa = etapaMap.get(def.numero)
        return (
          <EtapaCard
            key={def.numero}
            def={def}
            etapaAtual={fechamento.etapaAtual}
            fechamentoId={fechamento.id}
            dadosSalvos={etapa?.dados ?? {}}
            concluidaEm={etapa?.concluidaEm ?? null}
            total={ETAPAS_DEF.length}
            emailTemplate={emailTemplatesByStep[def.numero] ?? null}
                emailPlaceholders={emailPlaceholders}
            emailCtx={emailCtx}
          />
        )
      })}
    </div>
  )
}
