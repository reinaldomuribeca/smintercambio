import { Suspense } from 'react'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getLeads, getConsultores } from '@/lib/actions/leads'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadsFilters } from '@/components/leads/leads-filters'
import { NovoLeadSheet } from '@/components/leads/novo-lead-sheet'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { role: 'CONSULTOR', id: '' }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, id: true },
    })
    return { role: dbUser?.role ?? 'CONSULTOR', id: user.id }
  } catch {
    return { role: 'CONSULTOR', id: user.id }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SearchParams = Promise<Record<string, string | undefined>>

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const currentUser = await getCurrentUser()

  const [result, consultores] = await Promise.allSettled([
    getLeads({
      search: params.search,
      status: params.status,
      consultorId: params.consultorId,
      origem: params.origem,
      page: params.page ? parseInt(params.page, 10) : 1,
    }),
    currentUser.role === 'DIRECAO' ? getConsultores() : Promise.resolve([]),
  ])

  const data = result.status === 'fulfilled'
    ? result.value
    : { leads: [], total: 0, page: 1, pages: 0 }

  const consultoresList =
    consultores.status === 'fulfilled' ? (consultores.value as { id: string; nome: string }[]) : []

  return (
    <div className="flex h-full flex-col">
      {/* Header da página */}
      <div className="border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900/5">
              <Users className="size-4 text-navy-900" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-stone-900">Leads</h1>
              <p className="text-xs text-stone-400">
                {data.total} {data.total === 1 ? 'registro' : 'registros'}
              </p>
            </div>
          </div>

          <NovoLeadSheet
            role={currentUser.role}
            userId={currentUser.id}
            consultores={consultoresList}
          />
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="border-b border-cream-200 bg-white px-6 py-3 sm:px-8">
        <Suspense fallback={null}>
          <LeadsFilters
            role={currentUser.role}
            consultores={consultoresList}
            currentParams={params}
          />
        </Suspense>
      </div>

      {/* Tabela + paginação */}
      <div className="flex-1 overflow-auto px-6 py-6 sm:px-8">
        {result.status === 'rejected' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Não foi possível carregar os leads. Verifique se o banco de dados está configurado
            e as migrations foram executadas.
          </div>
        ) : (
          <LeadsTable
            leads={data.leads}
            total={data.total}
            page={data.page}
            pages={data.pages}
            currentParams={params}
          />
        )}
      </div>
    </div>
  )
}
