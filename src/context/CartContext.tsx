"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { useUser } from "@/context/UserContext";

// ---------------- Tipos ----------------
export interface CartItem {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  img: string;
}

// Resposta vinda da API / MongoDB
interface MongoCartItem {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  img?: string;
}
type GetCartResponse = { produtos?: MongoCartItem[] };

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  addItem: (item: CartItem) => void;
}

// --------------- Contexto ---------------
const CartContext = createContext<CartContextType | undefined>(undefined);

// --------------- Provider ---------------
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const login = user?.login ?? "guest";

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carregar o carrinho do MongoDB quando o login mudar
  useEffect(() => {
    const fetchCart = async () => {
      if (login === "guest") {
        setCartItems([]);
        return;
      }

      try {
        const res = await fetch(`/api/cart?userId=${encodeURIComponent(login)}`);
        if (!res.ok) throw new Error("Erro ao buscar carrinho");

        const data = (await res.json()) as GetCartResponse;

        const produtos: MongoCartItem[] = Array.isArray(data?.produtos) ? data.produtos : [];
        const mappedItems: CartItem[] = produtos.map(
          ({ produtoId, nome, valor, quantidade, img }: MongoCartItem) => ({
            id: produtoId,
            nome,
            valor,
            quantidade,
            img: img ?? "/images/default-product.png",
          })
        );

        setCartItems(mappedItems);
      } catch (err) {
        console.error("Erro ao carregar carrinho do MongoDB:", err);
        setCartItems([]);
      }
    };

    void fetchCart();
  }, [login]);

  // Total de itens no carrinho
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

  // Remover item
  const removeItem = async (id: string) => {
    if (!id) {
      console.error("ID do produto é undefined ou vazio!");
      return;
    }

    const updatedCart = cartItems.filter((item) => item.id !== id);

    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(login)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: id }),
      });

      if (res.ok) {
        setCartItems(updatedCart);
      } else {
        console.error("Erro ao remover produto no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
    }
  };

  // Adicionar item
  const addItem = async (item: CartItem) => {
    const existingItemIndex = cartItems.findIndex((i) => i.id === item.id);
    let updatedItems: CartItem[];

    if (existingItemIndex !== -1) {
      updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantidade += item.quantidade;
    } else {
      updatedItems = [...cartItems, item];
    }

    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(login)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: item.id,
          nome: item.nome,
          valor: item.valor,
          quantidade: item.quantidade,
          img: item.img,
        }),
      });

      if (res.ok) {
        setCartItems(updatedItems);
      } else {
        console.error("Erro ao adicionar produto no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
    }
  };

  // Atualizar quantidade
  const updateItemQuantity = async (id: string, quantidade: number) => {
    if (!id) {
      console.error("ID do produto é undefined ou vazio!");
      return;
    }

    if (quantidade < 1) {
      quantidade = 1; // Impede quantidade 0/negativa
    }

    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantidade } : item
    );

    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(login)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: id, quantidade }),
      });

      if (res.ok) {
        setCartItems(updatedCart);
      } else {
        console.error("Erro ao atualizar produto no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
    }
  };

  // Limpar carrinho
  const clearCart = async () => {
    setCartItems([]);

    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(login)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        // Mantido conforme seu backend: limpa tudo quando produtoId = ""
        body: JSON.stringify({ produtoId: "" }),
      });

      if (!res.ok) {
        console.error("Erro ao limpar o carrinho no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao limpar carrinho:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, totalItems, removeItem, updateItemQuantity, clearCart, addItem }}
    >
      {children}
    </CartContext.Provider>
  );
};

// --------------- Hook ---------------
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
};
