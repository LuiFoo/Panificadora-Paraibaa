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
  addItem: (item: CartItem) => void; // Função para adicionar item
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const login = user?.login || "guest"; // Usa o login para buscar o carrinho

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carregar o carrinho do localStorage e sincronizar com o MongoDB
  useEffect(() => {
    const fetchCart = async () => {
      // Primeiro, tenta carregar o carrinho do localStorage
      const storedCart = localStorage.getItem(`carrinho_${login}`);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      } else {
        // Caso não haja carrinho no localStorage, tenta carregar do MongoDB
        try {
          const res = await fetch(`/api/cart?userId=${login}`);
          if (!res.ok) throw new Error("Erro ao buscar carrinho");
          const data = await res.json();
          setCartItems(data.produtos || []); // Pega os produtos do carrinho do MongoDB
          localStorage.setItem(`carrinho_${login}`, JSON.stringify(data.produtos)); // Salva o carrinho no localStorage
        } catch (err) {
          console.error("Erro ao carregar carrinho do MongoDB:", err);
        }
      }
    };

    fetchCart();
  }, [login]); // Executa a lógica de carga apenas na primeira renderização ou se o login mudar

  // Total de itens no carrinho
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

  // Função para remover um item
  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    // Atualiza o localStorage
    localStorage.setItem(`carrinho_${login}`, JSON.stringify(updatedCart));

    // Envia a requisição para o MongoDB (mas sem sobrescrever o localStorage)
    fetch(`/api/cart?userId=${login}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtoId: id }),
    }).catch((err) => console.error("Erro ao remover produto:", err));
  };

  // Função para adicionar um item ao carrinho
  const addItem = (item: CartItem) => {
    const existingItemIndex = cartItems.findIndex((i) => i.id === item.id);
    
    if (existingItemIndex !== -1) {
      // Se o item já existe, atualiza a quantidade
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantidade += item.quantidade;
      setCartItems(updatedItems);
    } else {
      // Se o item não existe, adiciona ao carrinho
      setCartItems((prevItems) => [...prevItems, item]);
    }

    // Atualiza o localStorage imediatamente
    localStorage.setItem(`carrinho_${login}`, JSON.stringify(cartItems));

    // Envia os dados para o MongoDB (sem sobrescrever localStorage)
    fetch(`/api/cart?userId=${login}`, {
      method: "POST", // Ou "PUT", dependendo do caso
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }).catch((err) => console.error("Erro ao adicionar produto:", err));
  };

  // Função para atualizar a quantidade de um item
  const updateItemQuantity = (id: string, quantidade: number) => {
    if (quantidade < 1) {
      quantidade = 1; // Impede que a quantidade seja 0 ou negativa
    }

    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantidade } : item
    );
    setCartItems(updatedCart);

    // Atualiza o localStorage e MongoDB
    localStorage.setItem(`carrinho_${login}`, JSON.stringify(updatedCart));
    fetch(`/api/cart?userId=${login}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtoId: id, quantidade }),
    }).catch((err) => console.error("Erro ao atualizar produto:", err));
  };

  // Função para limpar o carrinho
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(`carrinho_${login}`); // Limpa o localStorage
    // Limpa o carrinho no MongoDB
    fetch(`/api/cart?userId=${login}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtoId: "" }), // Limpar todos os itens do carrinho
    }).catch((err) => console.error("Erro ao limpar carrinho:", err));
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
