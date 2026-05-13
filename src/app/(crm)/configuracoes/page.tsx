import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role, ObjetivoPrograma } from '@prisma/client'
import { Settings } from 'lucide-react'
import { ConfiguracoesAbas } from '@/components/configuracoes/configuracoes-abas'
import type { UsuarioRow } from '@/components/configuracoes/tab-usuarios'
import type { TemplateMap } from '@/components/configuracoes/tab-templates'
import type { TemplateDoc } from '@/lib/actions/configuracoes'
import type { FunilEtapaRow } from '@/components/configuracoes/tab-funil'
import { listPaises, listEscolas } from '@/lib/actions/destinos'
import { listEmailTemplates } from '@/lib/actions/email-templates'
import { listEmailPlaceholders } from '@/lib/actions/email-placeholders'

export const dynamic = 'force-dynamic'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  try {
    return await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { id: true, role: true },
    })
  } catch {
    redirect('/login')
  }
}

export default async function ConfiguracoesPage() {
  const currentUser = await getCurrentUser()

  if (currentUser.role !== Role.DIRECAO) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Settings className="size-8 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-stone-800">Acesso restrito</h1>
        <p className="text-sm text-stone-500">
          Esta página é acessível apenas para usuários com role <strong>Direção</strong>.
        </p>
      </div>
    )
  }

  const [usuarios, templates, etapas, paises, escolas, emailTemplates, emailPlaceholders] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    }),
    prisma.checklistTemplate.findMany({
      select: { objetivoPrograma: true, documentos: true },
    }),
    prisma.funilEtapa.findMany({
      select: { id: true, slug: true, nome: true, cor: true, ordem: true, ativa: true, perdido: true },
      orderBy: { ordem: 'asc' },
    }),
    listPaises(),
    listEscolas(),
    listEmailTemplates().catch(() => []),
    listEmailPlaceholders().catch(() => []),
  ])

  const usuariosRows: UsuarioRow[] = usuarios.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  const templateMap: TemplateMap = {}
  for (const t of templates) {
    templateMap[t.objetivoPrograma as ObjetivoPrograma] =
      (t.documentos as unknown as TemplateDoc[]) ?? []
  }

  const etapasRows: FunilEtapaRow[] = etapas

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900/5">
            <Settings className="size-4 text-navy-900" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-stone-900">Configurações</h1>
            <p className="text-xs text-stone-400">Usuários, templates e funil</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConfiguracoesAbas usuarios={usuariosRows} templates={templateMap} etapas={etapasRows} paises={paises} escolas={escolas} emailTemplates={emailTemplates} emailPlaceholders={emailPlaceholders} />
      </div>
    </div>
  )
}
