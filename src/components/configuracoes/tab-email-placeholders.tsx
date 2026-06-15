'use client'

import { useState, useActionState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, Pencil, Trash2, X, Hash, AlertTriangle } from 'lucide-react'
import {
  createEmailPlaceholder,
  updateEmailPlaceholder,
  deleteEmailPlaceholder,
  type EmailPlaceholderItem,
  type EmailPlaceholderState,
} from '@/lib/actions/email-placeholders'
import { CAMPOS_SISTEMA, CAMPO_LABEL } from '@/lib/email-placeholders-config'

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
const LABEL = 'mb-1 block text-xs font-semibold text-stone-500'

// ─── Grupos de campos ─────────────────────────────────────────────────────────

const GRUPOS = [...new Set(CAMPOS_SISTEMA.map((c) => c.grupo))]

// ─── Submit button ────────────────────────────────────────────────────────────

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
      {pending ? 'Salvando…' : label}
    </button>
  )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
      <div className="relative mt-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-100 px-6 py-4">
          <h2 className="font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:bg-cream-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function PlaceholderForm({
  action,
  defaultValues,
  onClose,
  submitLabel,
}: {
  action: (prev: EmailPlaceholderState, fd: FormData) => Promise<EmailPlaceholderState>
  defaultValues?: EmailPlaceholderItem
  onClose: () => void
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

      <div>
        <label className={LABEL}>Tag do placeholder *</label>
        <div className="flex items-center gap-1">
          <span className="rounded-l-lg border border-r-0 border-cream-200 bg-cream-50 px-3 py-2 font-mono text-sm text-stone-400">{'{{'}</span>
          <input
            name="tag"
            className="flex-1 rounded-none border border-cream-200 bg-white px-3 py-2 font-mono text-sm text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            defaultValue={defaultValues?.tag.replace(/^\{\{|\}\}$/g, '')}
            placeholder="nome_aluno"
            required
          />
          <span className="rounded-r-lg border border-l-0 border-cream-200 bg-cream-50 px-3 py-2 font-mono text-sm text-stone-400">{'}}'}</span>
        </div>
        <p className="mt-1 text-xs text-stone-400">Use apenas letras minúsculas, números e underline.</p>
      </div>

      <div>
        <label className={LABEL}>Descrição *</label>
        <input
          name="label"
          className={INPUT}
          defaultValue={defaultValues?.label}
          placeholder="Ex: Nome do aluno"
          required
        />
      </div>

      <div>
        <label className={LABEL}>Campo do sistema *</label>
        <select name="campoSistema" className={INPUT} defaultValue={defaultValues?.campoSistema ?? ''} required>
          <option value="">Selecione o campo…</option>
          {GRUPOS.map((grupo) => (
            <optgroup key={grupo} label={grupo}>
              {CAMPOS_SISTEMA.filter((c) => c.grupo === grupo).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-400">Qual dado do cadastro do estudante essa tag representa.</p>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-cream-100 pt-4">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
          Cancelar
        </button>
        <SaveBtn label={submitLabel} />
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabEmailPlaceholders({ placeholders }: { placeholders: EmailPlaceholderItem[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<EmailPlaceholderItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition]         = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEmailPlaceholder(id)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-800">Placeholders de E-mail</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Defina as tags <span className="font-mono text-amber-700">{'{{tag}}'}</span> que podem ser usadas nos templates de e-mail.
            Cada tag é vinculada a um campo do cadastro do estudante.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> Novo placeholder
        </button>
      </div>

      {/* Reference card */}
      <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
        <p className="mb-3 text-xs font-semibold text-stone-500">Campos disponíveis do sistema</p>
        <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo}>
              <p className="mt-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">{grupo}</p>
              {CAMPOS_SISTEMA.filter((c) => c.grupo === grupo).map((c) => (
                <p key={c.value} className="text-xs text-stone-600">
                  <span className="font-mono text-stone-400">{c.value}</span>
                  <span className="text-stone-400"> — </span>
                  {c.label}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      {placeholders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-16 text-center">
          <Hash className="mb-3 size-10 text-stone-300" />
          <p className="font-medium text-stone-500">Nenhum placeholder cadastrado</p>
          <p className="mt-1 text-sm text-stone-400">Crie placeholders para usar nos templates de e-mail.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Tag</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 hidden sm:table-cell">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 hidden md:table-cell">Campo do sistema</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {placeholders.map((p) => (
                <tr key={p.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3.5 font-mono text-sm text-amber-700">{p.tag}</td>
                  <td className="hidden px-4 py-3.5 text-stone-700 sm:table-cell">{p.label}</td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    {CAMPO_LABEL[p.campoSistema as keyof typeof CAMPO_LABEL] ? (
                      <>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-500">
                          {p.campoSistema}
                        </span>
                        <span className="ml-2 text-xs text-stone-400">
                          {CAMPO_LABEL[p.campoSistema as keyof typeof CAMPO_LABEL]}
                        </span>
                      </>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"
                        title="Esse campo não existe no catálogo do sistema — a tag não será substituída no e-mail. Edite e selecione um campo válido."
                      >
                        <AlertTriangle className="size-3" /> campo inválido: {p.campoSistema}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(p)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-700">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => setDeletingId(p.id)}
                        className="rounded-lg p-1.5 text-red-300 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Dialog title="Novo placeholder" onClose={() => setShowCreate(false)}>
          <PlaceholderForm action={createEmailPlaceholder} onClose={() => setShowCreate(false)} submitLabel="Criar" />
        </Dialog>
      )}

      {editing && (
        <Dialog title="Editar placeholder" onClose={() => setEditing(null)}>
          <PlaceholderForm action={updateEmailPlaceholder} defaultValues={editing} onClose={() => setEditing(null)} submitLabel="Salvar" />
        </Dialog>
      )}

      {deletingId && (
        <Dialog title="Excluir placeholder?" onClose={() => setDeletingId(null)}>
          <p className="mb-4 text-sm text-stone-600">
            A tag será removida. Templates que a usam continuarão com o texto literal, sem substituição.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeletingId(null)} className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
              Cancelar
            </button>
            <button onClick={() => handleDelete(deletingId)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Excluir
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
