import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware temporariamente desabilitado para debug
  console.log("Middleware executado para:", request.nextUrl.pathname);
  
  // Verifica se a rota é /painel
  if (request.nextUrl.pathname.startsWith('/painel')) {
    console.log("Acessando rota /painel - middleware não bloqueia");
    // Middleware temporariamente desabilitado
    // const token = request.cookies.get('auth-token')
    // if (!token) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*']
}


