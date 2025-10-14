"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";

interface User {
  _id: string;
  login: string;
  name: string;
  permissao: string; // "administrador" ou outro
  password: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Debug logs removidos para produção

  // Recupera o usuário armazenado no localStorage e valida se ainda é válido no servidor
  useEffect(() => {
    const savedUser = localStorage.getItem("usuario");

    if (!savedUser) {
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(savedUser) as User;

    // Função para verificar o usuário no servidor
    const validateUser = async () => {
      try {
        const res = await fetch("/api/verificar-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: parsedUser.login, password: parsedUser.password }),
        });

        const data = await res.json();

        if (data.ok && data.user) {
          // Usuário válido no servidor
          const validUser: User = {
            _id: data.user._id,
            login: data.user.login,
            name: data.user.name,
            permissao: data.user.permissao,
            password: parsedUser.password, // Mantém a senha para futuras validações
          };

          setUser(validUser);
          localStorage.setItem("usuario", JSON.stringify(validUser));
        } else {
          // Usuário não válido, limpando localStorage
          localStorage.removeItem("usuario");
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        // Se erro ocorrer, mantém o usuário no localStorage temporariamente
        setUser(parsedUser);
      } finally {
        setLoading(false);
      }
    };

    validateUser();
  }, []); // Executa uma única vez ao montar o componente

  // Verifica se o usuário tem permissão de administrador usando useMemo para performance
  const isAdmin = useMemo(() => {
    return user?.permissao === "administrador";
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook para acessar o contexto de usuário
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser deve ser usado dentro de UserProvider");
  return context;
};
