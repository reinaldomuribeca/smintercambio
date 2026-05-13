import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getJornadaHub } from '@/lib/actions/jornada'
import { getOrCreateFechamento } from '@/lib/actions/fechamento'
import { listEmailTemplates } from '@/lib/actions/email-templates'
import { ArrowLeft, FileCheck2 } from 'lucide-react'
import { FechamentoFlow } from '@/components/jornada/fechamento-flow'
import type { EmailContext } from '@/components/jornada/fechamento-flow'

export const dynamic = 'force-dynamic'

type Params = Promise<{ jornadaId: string }>

export default async function FechamentoPage({ params }: { params: Params }) {
  const { jornadaId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [jornada, emailTemplatesRaw] = await Promise.all([
    getJornadaHub(jornadaId),
    listEmailTemplates().catch(() => []),
  ])
  if (!jornada) notFound()

  const fechamento = await getOrCreateFechamento(jornadaId)

  const emailTemplatesByStep = Object.fromEntries(
    emailTemplatesRaw
      .filter((t) => t.fechamentoStep !== null)
      .map((t) => [t.fechamentoStep!, t])
  )

  const emailCtx: EmailContext = {
    leadNome:     jornada.leadNome,
    leadEmail:    jornada.leadEmail ?? '',
    escolaNome:   jornada.escolaNome,
    paisNome:     jornada.paisNome,
    consultorNome: jornada.consultorNome,
    embarqueEm:   jornada.embarqueEm ?? '',
    retornoEm:    jornada.retornoEm ?? '',
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <Link href={`/jornada/${jornadaId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600">
          <ArrowLeft className="size-3.5" /> {jornada.leadNome}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
            <FileCheck2 className="size-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-stone-900">Fechamento e Matrícula</h1>
            <p className="text-xs text-stone-400">{jornada.escolaNome} · {jornada.paisNome}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-6 sm:px-8">
          <FechamentoFlow fechamento={fechamento} emailTemplatesByStep={emailTemplatesByStep} emailCtx={emailCtx} />
        </div>
      </div>
    </div>
  )
}
