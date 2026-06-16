import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { supabaseResponse, user } = await updateSession(request)

  const isAuthenticated = !!user
  const isLoginPage = pathname === '/login'

  // Autenticado tentando acessar /login → redireciona para /dashboard
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Não autenticado tentando acessar rota protegida → redireciona para /login
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/leads/:path*',
    '/funil/:path*',
    '/jornada/:path*',
    '/financeiro/:path*',
    '/tarefas/:path*',
    '/relatorios/:path*',
    '/configuracoes/:path*',
  ],
}
