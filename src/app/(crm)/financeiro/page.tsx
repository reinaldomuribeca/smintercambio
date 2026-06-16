import { notFound, redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { getFinanceiroInbox } from '@/lib/actions/fechamento'
import { FinanceiroInbox } from '@/components/financeiro/financeiro-inbox'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (!dbUser || (dbUser.role !== Role.FINANCEIRO && dbUser.role !== Role.DIRECAO)) {
    notFound()
  }

  const itens = await getFinanceiroInbox()

  return (
    <div className="mx-auto max-w-4xl px-6 py-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Wallet className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Financeiro</h1>
          <p className="text-sm text-stone-500">
            Caixa de tarefas — etapas de fechamento aguardando o financeiro
            {itens.length > 0 && (
              <span className="ml-1 font-medium text-stone-700">({itens.length})</span>
            )}
          </p>
        </div>
      </div>

      <FinanceiroInbox itens={itens} />
    </div>
  )
}
