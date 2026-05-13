'use client'

import { useState, useActionState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserPlus, Pencil, Ban, CheckCircle2, X } from 'lucide-react'
import { Role } from '@prisma/client'
import { createUser, updateUser, toggleUserAtivo, type UserFormState } from '@/lib/actions/configuracoes'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UsuarioRow = {
  id: string
  nome: string
  email: string
  role: Role
  ativo: boolean
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<Role, string> = {
  DIRECAO:        'Direção',
  CONSULTOR:      'Consultor',
  ADMINISTRATIVO: 'Administrativo',
  OPERACOES:      'Operações',
  FINANCEIRO:     'Financeiro',
}

const ROLE_STYLE: Record<Role, string> = {
  DIRECAO:        'bg-navy-900/10 text-navy-900',
  CONSULTOR:      'bg-amber-50 text-amber-700',
  ADMINISTRATIVO: 'bg-emerald-50 text-emerald-700',
  OPERACOES:      'bg-sky-50 text-sky-700',
  FINANCEIRO:     'bg-emerald-100 text-emerald-800',
}

const INPUT =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

const SELECT =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

// ─── Dialog shell ─────────────────────────────────────────────────────────────

function Dialog({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
          <h2 className="font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-600">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormError({ state }: { state: UserFormState }) {
  if (!state?.error) return null
  return (
    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</div>
  )
}

// ─── Novo Usuário dialog ──────────────────────────────────────────────────────

function NovoUsuarioDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<UserFormState, FormData>(createUser, null)

  useEffect(() => {
    if (state?.success) { router.refresh(); onClose() }
  }, [state?.success])

  return (
    <Dialog title="Novo Usuário" onClose={onClose}>
      <form action={action} className="space-y-4 px-6 py-5">
        <FormError state={state} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Nome</label>
          <input name="nome" type="text" className={INPUT} placeholder="Nome completo" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">E-mail</label>
          <input name="email" type="email" className={INPUT} placeholder="email@exemplo.com" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Senha inicial</label>
          <input name="senha" type="password" className={INPUT} placeholder="Mínimo 6 caracteres" required minLength={6} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Role</label>
          <select name="role" className={SELECT} defaultValue="CONSULTOR">
            {Object.entries(ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t border-cream-100 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
            Cancelar
          </button>
          <button type="submit" disabled={pending}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
            {pending ? 'Criando…' : 'Criar usuário'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Editar Usuário dialog ────────────────────────────────────────────────────

function EditarUsuarioDialog({ usuario, onClose }: { usuario: UsuarioRow; onClose: () => void }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<UserFormState, FormData>(updateUser, null)

  useEffect(() => {
    if (state?.success) { router.refresh(); onClose() }
  }, [state?.success])

  return (
    <Dialog title="Editar Usuário" onClose={onClose}>
      <form action={action} className="space-y-4 px-6 py-5">
        <input type="hidden" name="id" value={usuario.id} />
        <FormError state={state} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Nome</label>
          <input name="nome" type="text" className={INPUT} defaultValue={usuario.nome} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">E-mail</label>
          <input type="text" className={`${INPUT} bg-cream-50 text-stone-400`}
            value={usuario.email} disabled />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Role</label>
          <select name="role" className={SELECT} defaultValue={usuario.role}>
            {Object.entries(ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t border-cream-100 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-stone-500 hover:bg-cream-100">
            Cancelar
          </button>
          <button type="submit" disabled={pending}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabUsuarios({ usuarios }: { usuarios: UsuarioRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showNovo, setShowNovo]   = useState(false)
  const [editando, setEditando]   = useState<UsuarioRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = (u: UsuarioRow) => {
    setTogglingId(u.id)
    startTransition(async () => {
      await toggleUserAtivo(u.id, !u.ativo)
      router.refresh()
      setTogglingId(null)
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowNovo(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <UserPlus className="size-4" /> Novo Usuário
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 bg-cream-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nome</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 md:table-cell">E-mail</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Role</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 lg:table-cell">Criado em</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {usuarios.map((u) => (
              <tr key={u.id} className={`transition-colors hover:bg-cream-50 ${!u.ativo ? 'opacity-55' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-stone-900">{u.nome}</td>
                <td className="hidden px-5 py-3.5 text-stone-500 md:table-cell">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_STYLE[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="hidden px-5 py-3.5 text-stone-500 lg:table-cell">
                  {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </td>
                <td className="px-5 py-3.5">
                  {u.ativo ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="size-3.5" /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-400">
                      <Ban className="size-3.5" /> Inativo
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditando(u)}
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-cream-100 hover:text-stone-700"
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={togglingId === u.id}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        u.ativo
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      } disabled:opacity-50`}
                      title={u.ativo ? 'Desativar' : 'Reativar'}
                    >
                      {togglingId === u.id
                        ? '…'
                        : u.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNovo  && <NovoUsuarioDialog onClose={() => setShowNovo(false)} />}
      {editando  && <EditarUsuarioDialog usuario={editando} onClose={() => setEditando(null)} />}
    </div>
  )
}
