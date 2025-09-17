"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "@/context/UserContext";

// Define o tipo do item no carrinho
export interface CartItem {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  img: string;
}

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  addItem: (item: CartItem) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const login = user?.login || "guest"; // Usa o login para buscar o carrinho

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carregar o carrinho do localStorage e sincronizar com o MongoDB
  useEffect(() => {
    const fetchCart = async () => {
      console.log(`Buscando carrinho para o usuário: ${login}`);

      // Primeiro tenta carregar o carrinho do localStorage
      const storedCart = localStorage.getItem(`carrinho_${login}`);
      if (storedCart) {
        console.log("Carrinho carregado do localStorage.");
        setCartItems(JSON.parse(storedCart));
      } else {
        try {
          console.log("Buscando carrinho do MongoDB...");
          const res = await fetch(`/api/cart?userId=${login}`);
          if (!res.ok) throw new Error("Erro ao buscar carrinho");
          const data = await res.json();
          setCartItems(data.produtos || []);
          localStorage.setItem(`carrinho_${login}`, JSON.stringify(data.produtos)); // Salva no localStorage
          console.log("Carrinho carregado do MongoDB.");
        } catch (err) {
          console.error("Erro ao carregar carrinho do MongoDB:", err);
        }
      }
    };

    fetchCart();
  }, [login]);

  // Total de itens no carrinho
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

  // Função para remover um item
  const removeItem = async (id: string) => {
    console.log(`Removendo item com ID: ${id} do carrinho.`);
    const updatedCart = cartItems.filter(item => item.id !== id);

    try {
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: id }), // A chave deve ser produtoId
      });

      if (res.ok) {
        setCartItems(updatedCart);
        localStorage.setItem(`carrinho_${login}`, JSON.stringify(updatedCart));
        console.log("Produto removido com sucesso.");
      } else {
        console.error("Erro ao remover produto no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
    }
  };

  // Função para adicionar um item ao carrinho
  const addItem = async (item: CartItem) => {
    console.log(`Adicionando item ao carrinho: ${item.id}`);

    const existingItemIndex = cartItems.findIndex((i) => i.id === item.id);
    let updatedItems: CartItem[];

    if (existingItemIndex !== -1) {
      updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantidade += item.quantidade;
      console.log(`Item já existente, quantidade atualizada: ${item.quantidade}`);
    } else {
      updatedItems = [...cartItems, item];
      console.log("Novo item adicionado ao carrinho.");
    }

    try {
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: item.id, // Mudança aqui, utilizando produtoId
          nome: item.nome,
          valor: item.valor,
          quantidade: item.quantidade,
          img: item.img,
        }),
      });

      if (res.ok) {
        setCartItems(updatedItems);
        localStorage.setItem(`carrinho_${login}`, JSON.stringify(updatedItems));
        console.log("Produto adicionado ou atualizado com sucesso.");
      } else {
        console.error("Erro ao adicionar produto no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
    }
  };

  // Função para atualizar a quantidade de um item
  const updateItemQuantity = async (id: string, quantidade: number) => {
    console.log(`Atualizando a quantidade do item ${id} para ${quantidade}`);
    if (quantidade < 1) {
      quantidade = 1; // Impede que a quantidade seja 0 ou negativa
    }

    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantidade } : item
    );

    try {
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: id, quantidade }),
      });

      if (res.ok) {
        setCartItems(updatedCart);
        localStorage.setItem(`carrinho_${login}`, JSON.stringify(updatedCart));
        console.log("Quantidade do produto atualizada com sucesso.");
      } else {
        console.error("Erro ao atualizar produto no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
    }
  };

  // Função para limpar o carrinho
  const clearCart = async () => {
    console.log("Limpar carrinho...");
    setCartItems([]);
    localStorage.removeItem(`carrinho_${login}`);

    try {
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: "" }), // Limpar todos os itens do carrinho
      });

      if (!res.ok) {
        console.error("Erro ao limpar o carrinho no MongoDB");
      }
    } catch (err) {
      console.error("Erro ao limpar carrinho:", err);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, totalItems, removeItem, updateItemQuantity, clearCart, addItem }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook para usar o contexto do carrinho
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
};
