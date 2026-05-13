import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CRMShell } from '@/components/layout/crm-shell'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Tenta buscar dados do usuário na nossa tabela; cai de volta no auth se o banco ainda não tiver sido migrado
  let name = authUser.email?.split('@')[0] ?? 'Usuário'
  let role = 'CONSULTOR'

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { nome: true, role: true },
    })
    if (dbUser) {
      name = dbUser.nome
      role = dbUser.role
    }
  } catch {
    // Banco ainda não migrado — usa fallback do auth
  }

  const userInfo = {
    name,
    email: authUser.email ?? '',
    role,
    initials: getInitials(name),
  }

  return <CRMShell user={userInfo}>{children}</CRMShell>
}
