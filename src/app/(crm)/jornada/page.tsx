import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MapPin } from 'lucide-react'
import { getJornadasOverview } from '@/lib/actions/jornada'
import { JornadaOverview } from '@/components/jornada/jornada-overview'

export const dynamic = 'force-dynamic'

export default async function JornadaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jornadas = await getJornadasOverview()

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900/5">
            <MapPin className="size-4 text-navy-900" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-stone-900">Jornada do Estudante</h1>
            <p className="text-xs text-stone-400">{jornadas.length} estudante(s) com jornada ativa</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
        <JornadaOverview jornadas={jornadas} />
      </div>
    </div>
  )
}
