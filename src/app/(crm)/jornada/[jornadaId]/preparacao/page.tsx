import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getJornadaHub } from '@/lib/actions/jornada'
import { ArrowLeft, Luggage } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Params = Promise<{ jornadaId: string }>

export default async function PreparacaoPage({ params }: { params: Params }) {
  const { jornadaId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jornada = await getJornadaHub(jornadaId)
  if (!jornada) notFound()

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <Link href={`/jornada/${jornadaId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600">
          <ArrowLeft className="size-3.5" /> {jornada.leadNome}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100">
            <Luggage className="size-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-stone-900">Preparação da Viagem</h1>
            <p className="text-xs text-stone-400">{jornada.escolaNome} · {jornada.paisNome}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-stone-400">Em construção</p>
      </div>
    </div>
  )
}
