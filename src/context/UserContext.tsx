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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("usuario");
    if (!saved) {
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(saved) as User;

    // Verifica no servidor se o login e senha ainda são válidos
    fetch("/api/verificar-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: parsed.login, password: parsed.password }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          // Mantém todos os campos importantes, inclusive permissao
          const userWithInfo: User = {
            _id: data.user._id,
            login: data.user.login,
            name: data.user.name,
            permissao: data.user.permissao, // mantém o valor do MongoDB
            password: parsed.password,       // mantém a senha
          };
          setUser(userWithInfo);
          localStorage.setItem("usuario", JSON.stringify(userWithInfo));
        } else {
          setUser(null);
          localStorage.removeItem("usuario");
        }
      })
      .catch(err => {
        console.error("Erro ao verificar usuário:", err);
        setUser(null);
        localStorage.removeItem("usuario");
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.permissao === "administrador";

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser deve ser usado dentro de UserProvider");
  return context;
};
