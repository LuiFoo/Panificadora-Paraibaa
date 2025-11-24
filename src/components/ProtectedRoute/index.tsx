"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: "administrador" | "usuario";
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission = "administrador",
  redirectTo = "/"
}: ProtectedRouteProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // Refs para rastrear o estado anterior e evitar verificações desnecessárias
  const lastUserIdRef = useRef<string | null>(null);
  const lastPermissionRef = useRef<string | null>(null);
  const hasCheckedRef = useRef(false);
  const isRedirectingRef = useRef(false);
  const isAuthorizedRef = useRef(false);

  useEffect(() => {
    // Aguarda o carregamento inicial do usuário
    if (loading && !hasCheckedRef.current) {
      return;
    }

    // Evitar redirecionamentos múltiplos
    if (isRedirectingRef.current) {
      return;
    }

    // Se não há usuário logado após o carregamento
    if (!loading && !user) {
      if (!isRedirectingRef.current) {
        isRedirectingRef.current = true;
        router.push(redirectTo);
      }
      return;
    }

    // Se ainda está carregando e já verificou antes, manter estado atual
    if (loading && hasCheckedRef.current) {
      return;
    }

    // Se há usuário, verificar se precisa re-verificar
    if (user) {
      const currentUserId = user._id || user.login;
      const currentPermission = user.permissao;
      
      // Se o usuário não mudou realmente e já está autorizado, não re-verificar
      if (hasCheckedRef.current && 
          currentUserId === lastUserIdRef.current && 
          currentPermission === lastPermissionRef.current &&
          isAuthorizedRef.current) {
        return;
      }
      
      // Atualizar refs
      lastUserIdRef.current = currentUserId;
      lastPermissionRef.current = currentPermission;
      
      // Verifica a permissão
      if (requiredPermission === "administrador" && user.permissao !== "administrador") {
        console.log("❌ Acesso negado! Você precisa ser um administrador para acessar esta página.");
        if (!isRedirectingRef.current) {
          isRedirectingRef.current = true;
          router.push(redirectTo);
        }
        isAuthorizedRef.current = false;
        setIsAuthorized(false);
        setChecking(false);
        return;
      }

      // Se chegou até aqui, está autorizado
      isAuthorizedRef.current = true;
      setIsAuthorized(true);
      setChecking(false);
      hasCheckedRef.current = true;
    }
  }, [user, loading, requiredPermission, redirectTo, router]);

  // Mostrar loading apenas na primeira verificação
  if ((loading && !hasCheckedRef.current) || (checking && !hasCheckedRef.current)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B69B4C] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized && !loading) {
    return null;
  }

  return <>{children}</>;
}
