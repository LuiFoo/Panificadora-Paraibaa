import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  console.log("Middleware executado para:", request.nextUrl.pathname);
  
  // Verifica se a rota é /painel
  if (request.nextUrl.pathname.startsWith('/painel')) {
    console.log("Acessando rota /painel - verificando autenticação");
    
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      console.log("Token não encontrado, redirecionando para login");
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log("Token encontrado, permitindo acesso");
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*']
}


