import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware para proteção de rotas administrativas
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota administrativa
  if (pathname.startsWith('/painel')) {
    // A autenticação é gerenciada pelo ProtectedRoute component
    // Este middleware apenas registra o acesso
    console.log(`🔒 Acesso à rota administrativa: ${pathname}`);
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*']
}


