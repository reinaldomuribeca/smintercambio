'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { X, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createLead, type CreateLeadState } from '@/lib/actions/leads'
import { OrigemLead } from '@prisma/client'

type Consultor = { id: string; nome: string }

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

const ORIGEM_OPTIONS: { value: OrigemLead; label: string }[] = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK',  label: 'Facebook' },
  { value: 'GOOGLE',    label: 'Google' },
  { value: 'SITE',      label: 'Site' },
  { value: 'FEIRA',     label: 'Feira' },
  { value: 'EVENTO',    label: 'Evento' },
  { value: 'WHATSAPP',  label: 'WhatsApp' },
  { value: 'OUTRO',     label: 'Outro' },
]

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>
}

const INPUT =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50'
const SELECT =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-stone-500'

function Field({
  label,
  children,
  errors,
  required,
}: {
  label: string
  children: React.ReactNode
  errors?: string[]
  required?: boolean
}) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      <FieldError errors={errors} />
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function NovoLeadForm({
  role,
  userId,
  consultores,
  onSuccess,
}: {
  role: string
  userId: string
  consultores: Consultor[]
  onSuccess: () => void
}) {
  const [state, action, isPending] = useActionState<CreateLeadState, FormData>(
    createLead,
    null,
  )
  const formRef = useRef<HTMLFormElement>(null)
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current && state === null && !isPending) {
      hasSubmitted.current = false
      formRef.current?.reset()
      onSuccess()
    }
  }, [state, isPending, onSuccess])

  const fe = state?.fieldErrors ?? {}

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => { hasSubmitted.current = true }}
      className="flex flex-col gap-5 px-6 py-5"
    >
      {/* Erro global */}
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Seção: Aluno */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">
          Aluno
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Nome do aluno" errors={fe.nome} required>
              <input name="nome" className={INPUT} placeholder="Nome completo" disabled={isPending} />
            </Field>
          </div>
          <Field label="Data de nascimento" errors={fe.dataNascimento}>
            <input name="dataNascimento" type="date" className={INPUT} disabled={isPending} />
          </Field>
          <Field label="Série / Ano" errors={fe.serieAtual}>
            <input name="serieAtual" className={INPUT} placeholder="Ex: 9º ano" disabled={isPending} />
          </Field>
          <div className="col-span-2">
            <Field label="Escola atual" errors={fe.escolaAtual}>
              <input name="escolaAtual" className={INPUT} placeholder="Nome da escola" disabled={isPending} />
            </Field>
          </div>
        </div>
      </div>

      {/* Seção: Responsáveis */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">
          Responsáveis
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Nome dos responsáveis" errors={fe.nomeResponsaveis} required>
              <input name="nomeResponsaveis" className={INPUT} placeholder="Nome do pai / mãe / responsável" disabled={isPending} />
            </Field>
          </div>
          <Field label="Telefone" errors={fe.telefone} required>
            <input name="telefone" type="tel" className={INPUT} placeholder="(11) 99999-9999" disabled={isPending} />
          </Field>
          <Field label="E-mail" errors={fe.email}>
            <input name="email" type="email" className={INPUT} placeholder="email@exemplo.com" disabled={isPending} />
          </Field>
        </div>
      </div>

      {/* Seção: Localização */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">
          Localização
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Cidade" errors={fe.cidade} required>
              <input name="cidade" className={INPUT} placeholder="Ex: São Paulo" disabled={isPending} />
            </Field>
          </div>
          <Field label="Estado" errors={fe.estado} required>
            <select name="estado" className={SELECT} defaultValue="" disabled={isPending}>
              <option value="">UF</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Seção: Comercial */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">
          Comercial
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Origem do lead" errors={fe.origemLead} required>
            <select name="origemLead" className={SELECT} defaultValue="" disabled={isPending}>
              <option value="">Selecione</option>
              {ORIGEM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {role === 'DIRECAO' ? (
            <Field label="Consultor responsável" errors={fe.consultorId} required>
              <select name="consultorId" className={SELECT} defaultValue="" disabled={isPending}>
                <option value="">Selecione</option>
                {consultores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              {/* CONSULTOR: campo oculto com seu próprio ID */}
              <input type="hidden" name="consultorId" value={userId} />
              <Field label="Consultor responsável">
                <input
                  className={`${INPUT} cursor-not-allowed bg-cream-50 text-stone-400`}
                  value="Você (atribuído automaticamente)"
                  readOnly
                />
              </Field>
            </>
          )}

          <div className="col-span-2">
            <Field label="Observações" errors={fe.observacoes}>
              <textarea
                name="observacoes"
                rows={3}
                className={`${INPUT} resize-none`}
                placeholder="Contexto inicial, interesses, urgência…"
                disabled={isPending}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            Criar lead
          </>
        )}
      </button>
    </form>
  )
}

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

type SheetProps = {
  role: string
  userId: string
  consultores: Consultor[]
}

export function NovoLeadSheet({ role, userId, consultores }: SheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botão trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Plus className="size-4" />
        Novo Lead
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden bg-cream-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header do sheet */}
        <div className="flex shrink-0 items-center justify-between border-b border-cream-200 bg-navy-900 px-6 py-4">
          <div>
            <h2 className="font-brand text-lg italic text-white">Novo Lead</h2>
            <p className="text-xs text-navy-600/60">
              Preencha as informações do aluno e responsáveis
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-navy-600/60 transition hover:bg-navy-800 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form (scroll) */}
        <div className="flex-1 overflow-y-auto">
          {open && (
            <NovoLeadForm
              role={role}
              userId={userId}
              consultores={consultores}
              onSuccess={() => setOpen(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
