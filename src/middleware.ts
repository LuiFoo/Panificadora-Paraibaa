import { NextResponse } from 'next/server'

export async function middleware() {
  // Removido o middleware NextAuth que estava causando conflito
  // A autenticação agora é gerenciada apenas pelo UserContext e ProtectedRoute
  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*']
}


