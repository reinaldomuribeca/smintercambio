import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export type AuthUser = { id: string; role: Role }

/**
 * Sessão obrigatória. Redireciona para /login se não houver usuário autenticado.
 * Usar no início de toda Server Action / Server Component que precise de sessão.
 *
 * IMPORTANTE: como o Prisma conecta com role privilegiado (bypass de RLS), a
 * checagem na Server Action é a ÚNICA barreira de autorização efetiva do app.
 * Toda action que recebe um leadId deve combinar getAuthUser() + canAccessLead().
 */
export async function getAuthUser(): Promise<AuthUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, role: true },
  })
}

/**
 * Regra de visibilidade de um lead — espelha exatamente a página leads/[id]:
 *   - CONSULTOR  → apenas leads onde é o consultor responsável
 *   - FINANCEIRO → apenas leads onde tem ao menos uma tarefa atribuída
 *   - DIRECAO / ADMINISTRATIVO / OPERACOES → todos
 *
 * Centraliza a checagem que antes era duplicada (e omitida em vários reads),
 * fechando os IDORs em getLeadHistorico/getLeadTarefas/getJornadaSummaryByLead.
 */
export async function canAccessLead(leadId: string, user: AuthUser): Promise<boolean> {
  if (!leadId) return false

  if (user.role === Role.CONSULTOR) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { consultorId: true },
    })
    return lead?.consultorId === user.id
  }

  if (user.role === Role.FINANCEIRO) {
    const tarefa = await prisma.tarefa.findFirst({
      where: { leadId, responsavelId: user.id },
      select: { id: true },
    })
    return tarefa !== null
  }

  return true
}
