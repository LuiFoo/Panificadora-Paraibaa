"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
            password: parsedUser.password,
          };

          setUser(validUser);
          localStorage.setItem("usuario", JSON.stringify(validUser));
        } else {
          // Usuário não encontrado ou inválido
          setUser(parsedUser); // Ainda mantém os dados do localStorage
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        setUser(parsedUser); // Mantém o usuário no localStorage mesmo se houver erro
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    validateUser();
  }, []); // Executa uma única vez ao montar o componente

  // Verifica se o usuário tem permissão de administrador
  const isAdmin = user?.permissao === "administrador";

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
