'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  ClipboardList,
  BarChart3,
  Settings2,
  LogOut,
  Menu,
  X,
  MapPin,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/leads',        label: 'Leads',         icon: Users },
  { href: '/funil',        label: 'Funil',         icon: Kanban },
  { href: '/jornada',      label: 'Jornada',       icon: MapPin },
  { href: '/tarefas',      label: 'Tarefas',       icon: ClipboardList },
  { href: '/relatorios',   label: 'Relatórios',    icon: BarChart3 },
]

type UserInfo = {
  name: string
  email: string
  role: string
  initials: string
}

const ROLE_LABELS: Record<string, string> = {
  DIRECAO: 'Direção',
  CONSULTOR: 'Consultor',
  ADMINISTRATIVO: 'Administrativo',
  OPERACOES: 'Operações',
  FINANCEIRO: 'Financeiro',
}

function SidebarNav({
  items,
  showConfig,
  onNavClick,
}: {
  items: NavItem[]
  showConfig: boolean
  onNavClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-white/10 text-white border-l-2 border-amber-400 pl-[10px]'
                : 'border-l-2 border-transparent text-white/50 hover:bg-white/8 hover:text-white/90'
            }`}
          >
            <Icon
              className={`size-4 shrink-0 transition-colors ${
                active ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70'
              }`}
            />
            {label}
          </Link>
        )
      })}

      {showConfig && (
        <Link
          href="/configuracoes"
          onClick={onNavClick}
          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname.startsWith('/configuracoes')
              ? 'bg-white/10 text-white border-l-2 border-amber-400 pl-[10px]'
              : 'border-l-2 border-transparent text-white/50 hover:bg-white/8 hover:text-white/90'
          }`}
        >
          <Settings2
            className={`size-4 shrink-0 transition-colors ${
              pathname.startsWith('/configuracoes')
                ? 'text-amber-400'
                : 'text-white/40 group-hover:text-white/70'
            }`}
          />
          Configurações
        </Link>
      )}
    </nav>
  )
}

function UserCard({ user }: { user: UserInfo }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center gap-3 px-1">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
          {user.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-white/40">{user.email}</p>
        </div>
      </div>

      <div className="mb-3 px-1">
        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/40 transition hover:bg-white/8 hover:text-red-400"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </form>
    </div>
  )
}

function Sidebar({
  user,
  onClose,
}: {
  user: UserInfo
  onClose?: () => void
}) {
  const showConfig = user.role === 'DIRECAO'

  return (
    <aside className="flex h-full w-64 flex-col bg-navy-900 px-3 py-5">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-between px-1">
        <Image
          src="/sm-logo.png"
          alt="SM Intercâmbio"
          width={148}
          height={38}
          className="object-contain brightness-0 invert"
          priority
        />
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Navegação */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav
          items={NAV_ITEMS}
          showConfig={showConfig}
          onNavClick={onClose}
        />
      </div>

      {/* Usuário */}
      <UserCard user={user} />
    </aside>
  )
}

export function CRMShell({
  user,
  children,
}: {
  user: UserInfo
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Sidebar mobile — overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-cream-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-cream-100 hover:text-slate-900"
          >
            <Menu className="size-5" />
          </button>
          <Image
            src="/sm-logo.png"
            alt="SM Intercâmbio"
            width={110}
            height={28}
            className="object-contain"
          />
          <div className="size-8" />
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
