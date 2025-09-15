"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "@/context/UserContext";

export interface CartItem {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  img: string;
  user?: string; // ✅ adiciona o login do usuário como opcional
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const login = user?.login || "guest";

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carregar carrinho do localStorage sempre que o login mudar
  useEffect(() => {
    const saved = localStorage.getItem(`carrinho_${login}`);
    if (saved) setCartItems(JSON.parse(saved));
    else setCartItems([]);
  }, [login]);

  // Salvar carrinho no localStorage sempre que itens mudarem
  useEffect(() => {
    localStorage.setItem(`carrinho_${login}`, JSON.stringify(cartItems));
  }, [cartItems, login]);

  const addItem = (item: CartItem) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id && i.user === item.user); // garante que seja do mesmo usuário
      if (exists) {
        return prev.map((i) =>
          i.id === item.id && i.user === item.user
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id || i.user !== login));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems
    .filter((i) => i.user === login) // conta apenas itens do usuário atual
    .reduce((sum, i) => sum + i.quantidade, 0);

  return (
    <CartContext.Provider value={{ cartItems, addItem, removeItem, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
};
