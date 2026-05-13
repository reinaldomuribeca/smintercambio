import { Suspense } from 'react'
import { CheckSquare } from 'lucide-react'
import { getTarefas } from '@/lib/actions/tarefas'
import { TarefasFiltros } from '@/components/tarefas/tarefas-filtros'
import { TarefasLista } from '@/components/tarefas/tarefas-lista'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | undefined>>

export default async function TarefasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const tarefas = await getTarefas({
    status: params.status,
    tipo:   params.tipo,
    prazo:  params.prazo,
  })

  const pendentes  = tarefas.filter((t) => t.status === 'PENDENTE').length
  const atrasadas  = tarefas.filter((t) => {
    if (t.status !== 'PENDENTE' || !t.prazo) return false
    const d = new Date(t.prazo)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return d < today
  }).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900/5">
            <CheckSquare className="size-4 text-navy-900" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-stone-900">Tarefas</h1>
            <p className="text-xs text-stone-400">
              {pendentes} pendente{pendentes !== 1 ? 's' : ''}
              {atrasadas > 0 && (
                <span className="ml-2 font-semibold text-red-500">· {atrasadas} atrasada{atrasadas !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-3 sm:px-8">
        <Suspense fallback={null}>
          <TarefasFiltros currentParams={params} />
        </Suspense>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-auto px-6 py-6 sm:px-8">
        <TarefasLista tarefas={tarefas} />
      </div>
    </div>
  )
}
