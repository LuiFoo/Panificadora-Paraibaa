import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/UserContext";

// Interfaces para tipagem
interface GoogleUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  permissao?: string;
}

interface UserData {
  _id: string;
  login: string;
  password: string;
  name: string;
  email: string;
  permissao: string;
  googleId: string;
  picture?: string;
}

export const useAuthSync = () => {
  const { data: session, status } = useSession();
  const { setUser, user } = useUser();

  useEffect(() => {
    // Evitar execuções desnecessárias
    if (status === "loading") return;
    
    console.log("🔍 useAuthSync: Status:", status, "Session:", !!session, "User:", !!user);
    
    const syncUserData = async () => {
      // Verificar se foi logout manual
      const manualLogout = localStorage.getItem("manual_logout");
      const logoutTimestamp = localStorage.getItem("logout_timestamp");
      
      // Se o usuário fez logout manualmente, não relogar automaticamente
      if (manualLogout === "true") {
        const timeSinceLogout = logoutTimestamp ? Date.now() - parseInt(logoutTimestamp) : 0;
        console.log("🚫 Logout manual detectado - não relogando automaticamente");
        
        // Aguardar um tempo antes de remover a flag para evitar relogin imediato
        // Se já passou mais de 10 segundos, pode limpar a flag
        if (timeSinceLogout > 10000) {
          localStorage.removeItem("manual_logout");
          localStorage.removeItem("logout_timestamp");
        }
        return;
      }

      if (status === "authenticated" && session?.user) {
        console.log("🔍 useAuthSync: Tentando sincronizar usuário autenticado:", session.user.email);
        try {
          console.log("Sincronizando dados do usuário:", session.user.email);
          
          // Primeiro tenta buscar dados existentes do usuário
          let response = await fetch('/api/auth/get-user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: (session.user as GoogleUser).id
            }),
          });

          let data = await response.json();
          console.log("Resposta da busca:", data);

          // Se usuário não existe, registra no MongoDB
          if (!data.ok) {
            console.log("Usuário não existe, criando novo...");
            response = await fetch('/api/auth/google-user-register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                googleId: (session.user as GoogleUser).id,
                email: session.user.email,
                name: session.user.name,
                picture: session.user.image
              }),
            });

            data = await response.json();
            console.log("Resposta do registro:", data);
          }
          
          if (data.ok && data.user) {
            // Usa dados do MongoDB
            const userData: UserData = {
              _id: data.user._id,
              login: data.user.login,
              password: 'google-auth',
              name: data.user.name,
              email: data.user.email,
              permissao: data.user.permissao || "usuario",
              googleId: data.user.googleId,
              picture: data.user.picture || undefined,
            };

            // Só atualiza se o usuário atual for diferente ou não existir
            if (!user || user.login !== userData.login) {
              localStorage.setItem("usuario", JSON.stringify(userData));
              
              // Disparar múltiplos eventos para garantir sincronização
              window.dispatchEvent(new Event('localStorageUpdated'));
              window.dispatchEvent(new Event('userLoggedIn'));
              window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
              
              setUser(userData);
              
              // Limpar flag de logout manual quando usuário faz login
              localStorage.removeItem("manual_logout");
              localStorage.removeItem("logout_timestamp");
              
              console.log("✅ Usuário sincronizado com dados do MongoDB");
            } else {
              console.log("✅ Usuário já está sincronizado");
            }
          } else {
            // Fallback para dados do NextAuth
            const userData: UserData = {
              _id: (session.user as GoogleUser).id,
              login: session.user.email?.split('@')[0] || session.user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
              password: 'google-auth',
              name: session.user.name || 'Usuário',
              email: session.user.email || '',
              permissao: (session.user as GoogleUser).permissao || "usuario",
              googleId: (session.user as GoogleUser).id,
              picture: session.user.image || undefined,
            };

            // Só atualiza se o usuário atual for diferente ou não existir
            if (!user || user.login !== userData.login) {
              localStorage.setItem("usuario", JSON.stringify(userData));
              
              // Disparar múltiplos eventos para garantir sincronização
              window.dispatchEvent(new Event('localStorageUpdated'));
              window.dispatchEvent(new Event('userLoggedIn'));
              window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
              
              setUser(userData);
              
              // Limpar flag de logout manual quando usuário faz login
              localStorage.removeItem("manual_logout");
              localStorage.removeItem("logout_timestamp");
              
              console.log("✅ Usuário sincronizado com dados do NextAuth (fallback)");
            } else {
              console.log("✅ Usuário já está sincronizado (fallback)");
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar dados do usuário:", error);
          
          // Fallback para dados do NextAuth em caso de erro
          const userData: UserData = {
            _id: (session.user as GoogleUser).id,
            login: session.user.email?.split('@')[0] || session.user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
            password: 'google-auth',
            name: session.user.name || 'Usuário',
            email: session.user.email || '',
            permissao: (session.user as GoogleUser).permissao || "usuario",
            googleId: (session.user as GoogleUser).id,
            picture: session.user.image || undefined,
          };

          // Só atualiza se o usuário atual for diferente ou não existir
          if (!user || user.login !== userData.login) {
            localStorage.setItem("usuario", JSON.stringify(userData));
            
            // Disparar múltiplos eventos para garantir sincronização
            window.dispatchEvent(new Event('localStorageUpdated'));
            window.dispatchEvent(new Event('userLoggedIn'));
            window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
            
            setUser(userData);
            
            // Limpar flag de logout manual quando usuário faz login
            localStorage.removeItem("manual_logout");
            localStorage.removeItem("logout_timestamp");
            
            console.log("✅ Usuário sincronizado com dados do NextAuth (erro fallback)");
          } else {
            console.log("✅ Usuário já está sincronizado (erro fallback)");
          }
        }
      } else if (status === "unauthenticated") {
        // Remove dados do localStorage se não autenticado
        localStorage.removeItem("usuario");
        
        // Disparar múltiplos eventos para notificar outros componentes
        window.dispatchEvent(new Event('localStorageUpdated'));
        window.dispatchEvent(new Event('userLoggedOut'));
        
        setUser(null);
        console.log("🔓 Usuário deslogado - sessão limpa");
      }
    };

    // Debounce para evitar múltiplas execuções
    const timeoutId = setTimeout(syncUserData, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [session, status, setUser, user]);

  return { session, status };
};
