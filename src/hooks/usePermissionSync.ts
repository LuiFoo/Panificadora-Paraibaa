import { useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';

/**
 * Hook para sincronizar permissões em tempo real
 * Escuta eventos de atualização de permissões e atualiza o contexto do usuário
 */
export function usePermissionSync() {
  const { user, setUser } = useUser();

  // Função estável para verificar permissões
  // Usar ref para evitar recriação constante da função
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const checkPermissionUpdate = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    try {
      // Verificar se é usuário Google
      if (currentUser.password === 'google-auth' && currentUser.googleId) {
        const response = await fetch("/api/auth/get-user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleId: currentUser.googleId }),
        });

        const data = await response.json();
        if (data.ok && data.user) {
          // Verificar se a permissão mudou
          if (data.user.permissao !== currentUser.permissao) {
            console.log("🔄 Permissão atualizada detectada:", data.user.permissao);
            
            // Atualizar usuário no contexto usando setUser do contexto
            const updatedUser = {
              ...currentUser,
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
          body: JSON.stringify({ login: currentUser.login, password: currentUser.password }),
        });

        const data = await response.json();
        if (data.ok && data.user) {
          // Verificar se a permissão mudou
          if (data.user.permissao !== currentUser.permissao) {
            console.log("🔄 Permissão atualizada detectada:", data.user.permissao);
            
            // Atualizar usuário no contexto
            const updatedUser = {
              ...currentUser,
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
  }, [setUser]); // Removido 'user' das dependências para evitar loops

  useEffect(() => {
    // Verificar atualizações a cada 30 segundos (aumentado de 10s para reduzir carga)
    // A verificação de permissões não precisa ser tão frequente
    const interval = setInterval(checkPermissionUpdate, 30000);

    // Verificar imediatamente quando o hook é montado (apenas uma vez)
    // Adicionar um pequeno delay para evitar conflitos na inicialização
    const initialCheckTimeout = setTimeout(() => {
      checkPermissionUpdate();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialCheckTimeout);
    };
  }, [checkPermissionUpdate]);

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
