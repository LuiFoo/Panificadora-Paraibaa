"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "@/context/UserContext";

export interface CartItem {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  img: string;
  user?: string;
}

interface Product {
  _id: string;
  nome: string;
  valor: number;
  img?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  totalItems: number;
  updateCart: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const login = user?.login || "guest";

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carrega o carrinho do MongoDB ao montar
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart"); // Requisição para buscar carrinho do MongoDB
        if (!res.ok) throw new Error("Erro ao buscar carrinho");
        const data = await res.json();
        setCartItems(data.produtos || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCart();
  }, [login]);

  // Atualiza o carrinho no MongoDB sempre que cartItems mudar
  useEffect(() => {
    const updateCart = async () => {
      try {
        if (cartItems.length === 0) return; // Não faz nada se o carrinho estiver vazio
        await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ produtos: cartItems }), // Envia os dados do carrinho para o MongoDB
        });
      } catch (err) {
        console.error("Erro ao atualizar o carrinho:", err);
      }
    };

    updateCart();
  }, [cartItems, login]);

  const addItem = (item: CartItem) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id && i.user === login);
      if (exists) {
        return prev.map((i) =>
          i.id === item.id && i.user === login
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i
        );
      }
      return [...prev, { ...item, user: login }];
    });
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => !(i.id === id && i.user === login)));
  };

  const updateItemQuantity = (id: string, quantidade: number) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id && i.user === login ? { ...i, quantidade } : i
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateCart = (items: CartItem[]) => {
    setCartItems(items.map((i) => ({ ...i, user: login })));
  };

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addItem, removeItem, updateItemQuantity, clearCart, totalItems, updateCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
};
