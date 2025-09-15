"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface CartItem {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  img: string; // ✅ Adicionado campo da imagem
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("carrinho");
    if (saved) setCartItems(JSON.parse(saved));
  }, []);

  // Salvar no localStorage sempre que itens mudarem
  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = (item: CartItem) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantidade: i.quantidade + item.quantidade } : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantidade, 0);

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
