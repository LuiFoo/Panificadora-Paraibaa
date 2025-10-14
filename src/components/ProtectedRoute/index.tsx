"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const checkPermission = () => {
      // Aguarda o carregamento do usuário
      if (loading) {
        return;
      }

      // Se não há usuário logado
      if (!user) {
        router.replace("/");
        return;
      }

      // Verifica a permissão
      if (requiredPermission === "administrador" && user.permissao !== "administrador") {
        alert("Acesso negado! Você precisa ser um administrador para acessar esta página.");
        router.replace("/");
        return;
      }

      // Se chegou até aqui, está autorizado
      setIsAuthorized(true);
      setChecking(false);
    };

    checkPermission();
  }, [user, loading, requiredPermission, redirectTo, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B69B4C] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
