import { getFunilLeads, getFunilEtapas } from '@/lib/actions/funil'
import { FunilBoard } from '@/components/funil/funil-board'

export const dynamic = 'force-dynamic'

export default async function FunilPage() {
  const [leads, etapas] = await Promise.all([getFunilLeads(), getFunilEtapas()])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4">
        <h1 className="font-brand text-2xl font-semibold text-navy-900">Funil de Vendas</h1>
        <p className="mt-0.5 text-sm text-stone-500">{leads.length} lead{leads.length !== 1 ? 's' : ''} no funil</p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <FunilBoard initialLeads={leads} etapas={etapas} />
      </div>
    </div>
  )
}
