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

  // Carrega do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem(`carrinho_${login}`);
    if (saved) setCartItems(JSON.parse(saved));
  }, [login]);

  // Filtra itens inválidos e sincroniza com localStorage
  useEffect(() => {
    const syncCart = async () => {
      try {
        const res = await fetch("/api/bolos-doces-especiais");
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        const data: { bolosDocesEspeciais: Product[] } = await res.json();
        const products = data.bolosDocesEspeciais;

        setCartItems(prev =>
          prev
            .filter(i => products.some(p => p._id === i.id))
            .map(i => {
              const prod = products.find(p => p._id === i.id)!;
              return { ...i, nome: prod.nome, valor: prod.valor, img: prod.img || "/images/default-product.png" };
            })
        );
      } catch (err) {
        console.error(err);
      }
    };

    syncCart();
  }, []);

  // Atualiza localStorage sempre que cartItems muda
  useEffect(() => {
    if (cartItems.length === 0) {
      localStorage.removeItem(`carrinho_${login}`);
    } else {
      localStorage.setItem(`carrinho_${login}`, JSON.stringify(cartItems));
    }
  }, [cartItems, login]);

  const addItem = (item: CartItem) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === item.id && i.user === login);
      if (exists) {
        return prev.map(i =>
          i.id === item.id && i.user === login
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i
        );
      }
      return [...prev, { ...item, user: login }];
    });
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.user === login)));
  };

  const updateItemQuantity = (id: string, quantidade: number) => {
    setCartItems(prev =>
      prev.map(i =>
        i.id === id && i.user === login ? { ...i, quantidade } : i
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateCart = (items: CartItem[]) => {
    setCartItems(items.map(i => ({ ...i, user: login })));
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
