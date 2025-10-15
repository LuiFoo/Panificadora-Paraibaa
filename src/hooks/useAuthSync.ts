import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/UserContext";

export const useAuthSync = () => {
  const { data: session, status } = useSession();
  const { setUser } = useUser();

  useEffect(() => {
    const syncUserData = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          console.log("Sincronizando dados do usuário:", session.user.email);
          
          // Primeiro tenta buscar dados existentes do usuário
          let response = await fetch('/api/auth/get-user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: session.user.id
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
                googleId: session.user.id,
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
            const userData = {
              _id: data.user._id,
              login: data.user.login,
              password: 'google-auth',
              name: data.user.name,
              email: data.user.email,
              permissao: data.user.permissao || "usuario",
              googleId: data.user.googleId,
              picture: data.user.picture,
            };

            localStorage.setItem("usuario", JSON.stringify(userData));
            setUser(userData);
            console.log("✅ Usuário sincronizado com dados do MongoDB");
          } else {
            // Fallback para dados do NextAuth
            const userData = {
              _id: session.user.id,
              login: session.user.email?.split('@')[0] || session.user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
              password: 'google-auth',
              name: session.user.name || 'Usuário',
              email: session.user.email || '',
              permissao: (session.user as { permissao?: string }).permissao || "usuario",
              googleId: session.user.id,
              picture: session.user.image,
            };

            localStorage.setItem("usuario", JSON.stringify(userData));
            setUser(userData);
          }
        } catch (error) {
          console.error("Erro ao sincronizar dados do usuário:", error);
          
          // Fallback para dados do NextAuth em caso de erro
          const userData = {
            _id: session.user.id,
            login: session.user.email?.split('@')[0] || session.user.name?.toLowerCase().replace(/\s+/g, '') || 'user',
            password: 'google-auth',
            name: session.user.name || 'Usuário',
            email: session.user.email || '',
              permissao: (session.user as { permissao?: string }).permissao || "usuario",
            googleId: session.user.id,
            picture: session.user.image,
          };

          localStorage.setItem("usuario", JSON.stringify(userData));
          setUser(userData);
        }
      } else if (status === "unauthenticated") {
        // Remove dados do localStorage se não autenticado
        localStorage.removeItem("usuario");
        setUser(null);
      }
    };

    syncUserData();
  }, [session, status, setUser]);

  return { session, status };
};
