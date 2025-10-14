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

  // Carregar o carrinho do MongoDB
  useEffect(() => {
    const fetchCart = async () => {
      if (login === "guest") {
        setCartItems([]);
        return;
      }

      console.log(`Buscando carrinho do MongoDB para o usuário: ${login}`);

      try {
        console.log("Buscando carrinho do MongoDB...");
        const res = await fetch(`/api/cart?userId=${login}`);
        if (!res.ok) throw new Error("Erro ao buscar carrinho");
        const data = await res.json();
        setCartItems(data.produtos || []);
        console.log("Carrinho carregado do MongoDB:", data.produtos);
      } catch (err) {
        console.error("Erro ao carregar carrinho do MongoDB:", err);
        setCartItems([]);
      }
    };

    fetchCart();
  }, [login]);

  // Total de itens no carrinho
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

  // Função para remover um item
  const removeItem = async (id: string) => {
    console.log(`Removendo item com ID: ${id} do carrinho.`);
    console.log("ID do item:", id, "Tipo:", typeof id);
    
    if (!id) {
      console.error("ID do produto é undefined ou vazio!");
      return;
    }
    
    const updatedCart = cartItems.filter(item => item.id !== id);

    try {
      const requestBody = { produtoId: id };
      console.log("Enviando para API:", requestBody);
      
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Resposta da API:", res.status, res.statusText);

      if (res.ok) {
        setCartItems(updatedCart);
        console.log("Produto removido com sucesso do MongoDB.");
      } else {
        const errorData = await res.json();
        console.error("Erro ao remover produto no MongoDB:", errorData);
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
    }
  };

  // Função para adicionar um item ao carrinho
  const addItem = async (item: CartItem) => {
    console.log(`Adicionando item ao carrinho: ${item.id}`);
    console.log("Item completo:", item);
    console.log("Carrinho atual:", cartItems);

    const existingItemIndex = cartItems.findIndex((i) => i.id === item.id);
    let updatedItems: CartItem[];

    if (existingItemIndex !== -1) {
      updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantidade += item.quantidade;
      console.log(`Item já existente, quantidade atualizada de ${cartItems[existingItemIndex].quantidade} para ${updatedItems[existingItemIndex].quantidade}`);
    } else {
      updatedItems = [...cartItems, item];
      console.log("Novo item adicionado ao carrinho.");
    }

    console.log("Items atualizados antes da API:", updatedItems);

    try {
      const requestBody = {
        produtoId: item.id,
        nome: item.nome,
        valor: item.valor,
        quantidade: item.quantidade,
        img: item.img,
      };
      
      console.log("Enviando para API:", requestBody);
      
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Resposta da API:", res.status, res.statusText);

      if (res.ok) {
        console.log("Produto adicionado ou atualizado com sucesso no MongoDB.");
        setCartItems(updatedItems);
      } else {
        const errorData = await res.json();
        console.error("Erro ao adicionar produto no MongoDB:", errorData);
      }
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
    }
  };

  // Função para atualizar a quantidade de um item
  const updateItemQuantity = async (id: string, quantidade: number) => {
    console.log(`Atualizando a quantidade do item ${id} para ${quantidade}`);
    console.log("ID recebido:", id, "Tipo:", typeof id);
    
    if (!id) {
      console.error("ID do produto é undefined ou vazio!");
      return;
    }
    
    if (quantidade < 1) {
      quantidade = 1; // Impede que a quantidade seja 0 ou negativa
    }

    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantidade } : item
    );

    try {
      const requestBody = { produtoId: id, quantidade };
      console.log("Enviando para API:", requestBody);
      
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        console.log("Quantidade do produto atualizada com sucesso no MongoDB.");
        setCartItems(updatedCart);
      } else {
        console.error("Erro ao atualizar produto no MongoDB");
        const errorData = await res.json();
        console.error("Detalhes do erro:", errorData);
      }
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
    }
  };

  // Função para limpar o carrinho
  const clearCart = async () => {
    console.log("Limpar carrinho...");
    setCartItems([]);

    try {
      const res = await fetch(`/api/cart?userId=${login}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: "" }), // Limpar todos os itens do carrinho
      });

      if (res.ok) {
        console.log("Carrinho limpo com sucesso no MongoDB.");
        setCartItems([]);
      } else {
        console.error("Erro ao limpar o carrinho no MongoDB");
        const errorData = await res.json();
        console.error("Detalhes do erro:", errorData);
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
