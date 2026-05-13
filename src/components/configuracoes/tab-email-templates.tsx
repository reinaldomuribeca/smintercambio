'use client'

import { useState, useActionState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, Pencil, Trash2, X, Mail, Info, Link2 } from 'lucide-react'
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  type EmailTemplateItem,
  type EmailTemplateState,
} from '@/lib/actions/email-templates'
import type { EmailPlaceholderItem } from '@/lib/actions/email-placeholders'

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT  = 'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
const LABEL  = 'mb-1 block text-xs font-semibold text-stone-500'

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
      <div className="relative mt-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
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

function TemplateForm({
  action,
  defaultValues,
  onClose,
  submitLabel,
  placeholders,
}: {
  action: (prev: EmailTemplateState, fd: FormData) => Promise<EmailTemplateState>
  defaultValues?: EmailTemplateItem
  onClose: () => void
  submitLabel: string
  placeholders: EmailPlaceholderItem[]
}) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL}>Nome do template *</label>
          <input name="nome" className={INPUT} defaultValue={defaultValues?.nome} placeholder="Ex: Envio de contrato" required />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Assunto do e-mail *</label>
          <input name="assunto" className={INPUT} defaultValue={defaultValues?.assunto} placeholder="Ex: Contrato e documentação — {{nome_aluno}}" required />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Vincular ao step de Fechamento e Matrícula</label>
          <select
            name="fechamentoStep"
            className={INPUT}
            defaultValue={defaultValues?.fechamentoStep?.toString() ?? ''}
          >
            <option value="">Nenhum (template genérico)</option>
            <option value="1">Step 1 — Envio do Contrato e Documentos</option>
            <option value="4">Step 4 — Envio de Documentação à Escola</option>
          </select>
          <p className="mt-1 text-xs text-stone-400">
            Quando vinculado, o template será sugerido automaticamente no step correspondente do Fechamento.
          </p>
        </div>
      </div>

      {/* Placeholders reference */}
      <div className="rounded-lg border border-cream-200 bg-cream-50 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <Info className="size-3.5" /> Placeholders disponíveis (clique para copiar)
        </div>
        {placeholders.length === 0 ? (
          <p className="text-xs text-stone-400">
            Nenhum placeholder configurado. Crie em{' '}
            <span className="font-medium text-amber-700">Configurações → Placeholders de E-mail</span>.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map((p) => (
              <button
                key={p.tag}
                type="button"
                title={p.label}
                onClick={() => navigator.clipboard.writeText(p.tag)}
                className="rounded-md bg-white border border-cream-200 px-2 py-0.5 font-mono text-[11px] text-amber-700 hover:border-amber-300 hover:bg-amber-50 transition-colors"
              >
                {p.tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={LABEL}>Corpo do e-mail *</label>
        <textarea
          name="corpo"
          className={INPUT + ' resize-y font-mono text-xs'}
          rows={12}
          defaultValue={defaultValues?.corpo}
          placeholder={`Olá {{nome_aluno}},\n\nSegue em anexo o contrato e as condições de pagamento para o seu intercâmbio em {{escola}}, {{pais}}.\n\nQualquer dúvida, entre em contato.\n\nAtenciosamente,\n{{consultor}}`}
          required
        />
        <p className="mt-1 text-xs text-stone-400">Use os placeholders acima — eles serão substituídos pelos dados reais ao gerar o e-mail.</p>
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

export function TabEmailTemplates({ templates, placeholders }: { templates: EmailTemplateItem[]; placeholders: EmailPlaceholderItem[] }) {
  const [showCreate, setShowCreate]         = useState(false)
  const [editing, setEditing]               = useState<EmailTemplateItem | null>(null)
  const [previewing, setPreviewing]         = useState<EmailTemplateItem | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [, startTransition]                 = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEmailTemplate(id)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-800">Templates de E-mail</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Templates reutilizáveis com placeholders para envio automático no Fechamento e Matrícula.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> Novo template
        </button>
      </div>

      {/* List */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 py-16 text-center">
          <Mail className="mb-3 size-10 text-stone-300" />
          <p className="font-medium text-stone-500">Nenhum template cadastrado</p>
          <p className="mt-1 text-sm text-stone-400">Crie templates para automatizar os e-mails do Fechamento.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 hidden sm:table-cell">Assunto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-stone-800">{t.nome}</span>
                      {t.fechamentoStep && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <Link2 className="size-3" /> Step {t.fechamentoStep}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 text-stone-500 sm:table-cell truncate max-w-xs">{t.assunto}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPreviewing(t)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-700"
                        title="Visualizar"
                      >
                        <Mail className="size-4" />
                      </button>
                      <button
                        onClick={() => setEditing(t)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-700"
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="rounded-lg p-1.5 text-red-300 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
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

      {/* Create dialog */}
      {showCreate && (
        <Dialog title="Novo template de e-mail" onClose={() => setShowCreate(false)}>
          <TemplateForm action={createEmailTemplate} onClose={() => setShowCreate(false)} submitLabel="Criar template" placeholders={placeholders} />
        </Dialog>
      )}

      {/* Edit dialog */}
      {editing && (
        <Dialog title="Editar template" onClose={() => setEditing(null)}>
          <TemplateForm action={updateEmailTemplate} defaultValues={editing} onClose={() => setEditing(null)} submitLabel="Salvar" placeholders={placeholders} />
        </Dialog>
      )}

      {/* Preview dialog */}
      {previewing && (
        <Dialog title={previewing.nome} onClose={() => setPreviewing(null)}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-1">Assunto</p>
              <p className="rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-stone-700">{previewing.assunto}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-1">Corpo</p>
              <pre className="rounded-lg border border-cream-200 bg-cream-50 px-3 py-3 text-xs text-stone-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">{previewing.corpo}</pre>
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <Dialog title="Excluir template?" onClose={() => setDeletingId(null)}>
          <p className="mb-4 text-sm text-stone-600">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeletingId(null)} className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(deletingId)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
