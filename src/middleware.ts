import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verifica se a rota é /painel
  if (request.nextUrl.pathname.startsWith('/painel')) {
    // Verifica se há token de autenticação (você pode implementar JWT aqui)
    const token = request.cookies.get('auth-token')
    
    // Se não há token, redireciona para login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*']
}


