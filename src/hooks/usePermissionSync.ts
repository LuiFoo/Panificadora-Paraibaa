import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';

/**
 * Hook para sincronizar permissões em tempo real
 * Escuta eventos de atualização de permissões e atualiza o contexto do usuário
 */
export function usePermissionSync() {
  const { user, setUser } = useUser();

  useEffect(() => {
    // Função para verificar e atualizar permissões do usuário atual
    const checkPermissionUpdate = async () => {
      if (!user) return;

      try {
        // Verificar se é usuário Google
        if (user.password === 'google-auth' && user.googleId) {
          const response = await fetch("/api/auth/get-user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ googleId: user.googleId }),
          });

          const data = await response.json();
          if (data.ok && data.user) {
            // Verificar se a permissão mudou
            if (data.user.permissao !== user.permissao) {
              console.log("🔄 Permissão atualizada detectada:", data.user.permissao);
              
              // Atualizar usuário no contexto
              const updatedUser = {
                ...user,
                permissao: data.user.permissao
              };
              
              setUser(updatedUser);
              localStorage.setItem("usuario", JSON.stringify(updatedUser));
              
              // Disparar evento para notificar outras partes do sistema
              window.dispatchEvent(new CustomEvent('permissionUpdated', {
                detail: { newPermission: data.user.permissao }
              }));
            }
          }
        } else {
          // Para usuários tradicionais, usar verificar-admin
          const response = await fetch("/api/verificar-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: user.login, password: user.password }),
          });

          const data = await response.json();
          if (data.ok && data.user) {
            // Verificar se a permissão mudou
            if (data.user.permissao !== user.permissao) {
              console.log("🔄 Permissão atualizada detectada:", data.user.permissao);
              
              // Atualizar usuário no contexto
              const updatedUser = {
                ...user,
                permissao: data.user.permissao
              };
              
              setUser(updatedUser);
              localStorage.setItem("usuario", JSON.stringify(updatedUser));
              
              // Disparar evento para notificar outras partes do sistema
              window.dispatchEvent(new CustomEvent('permissionUpdated', {
                detail: { newPermission: data.user.permissao }
              }));
            }
          }
        }
      } catch (error) {
        console.error("Erro ao verificar atualização de permissão:", error);
      }
    };

    // Verificar atualizações a cada 10 segundos
    const interval = setInterval(checkPermissionUpdate, 10000);

    // Verificar imediatamente quando o hook é montado
    checkPermissionUpdate();

    return () => clearInterval(interval);
  }, [user, setUser]);

  // Função para forçar verificação manual
  const forcePermissionCheck = async () => {
    if (!user) return;

    try {
      if (user.password === 'google-auth' && user.googleId) {
        const response = await fetch("/api/auth/get-user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleId: user.googleId }),
        });

        const data = await response.json();
        if (data.ok && data.user) {
          const updatedUser = {
            ...user,
            permissao: data.user.permissao
          };
          
          setUser(updatedUser);
          localStorage.setItem("usuario", JSON.stringify(updatedUser));
          
          return data.user.permissao;
        }
      } else {
        const response = await fetch("/api/verificar-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: user.login, password: user.password }),
        });

        const data = await response.json();
        if (data.ok && data.user) {
          const updatedUser = {
            ...user,
            permissao: data.user.permissao
          };
          
          setUser(updatedUser);
          localStorage.setItem("usuario", JSON.stringify(updatedUser));
          
          return data.user.permissao;
        }
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
    }
  };

  return { forcePermissionCheck };
}
