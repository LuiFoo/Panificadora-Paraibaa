import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  console.log("Middleware executado para:", request.nextUrl.pathname);
  console.log("NEXTAUTH_SECRET definido:", !!process.env.NEXTAUTH_SECRET);
  console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
  
  // Verifica se a rota é /painel
  if (request.nextUrl.pathname.startsWith('/painel')) {
    console.log("Acessando rota /painel - verificando autenticação");
    
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      console.log("Token encontrado:", !!token);
      console.log("Token email:", token?.email);
      
      if (!token) {
        console.log("Token não encontrado, redirecionando para login");
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      console.log("Token encontrado, permitindo acesso");
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*']
}


