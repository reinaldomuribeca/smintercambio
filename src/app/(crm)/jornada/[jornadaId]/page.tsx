import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getJornadaHub } from '@/lib/actions/jornada'
import { JornadaHub } from '@/components/jornada/jornada-hub'

export const dynamic = 'force-dynamic'

type Params = Promise<{ jornadaId: string }>

export default async function JornadaHubPage({ params }: { params: Params }) {
  const { jornadaId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jornada = await getJornadaHub(jornadaId)
  if (!jornada) notFound()

  return <JornadaHub jornada={jornada} />
}
