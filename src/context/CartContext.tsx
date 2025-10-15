"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";

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
  addItem: (item: CartItem) => Promise<{ success: boolean; message: string }>;
}

// --------------- Contexto ---------------
const CartContext = createContext<CartContextType | undefined>(undefined);

// --------------- Provider ---------------
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { showToast } = useToast();
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
  const addItem = async (item: CartItem): Promise<{ success: boolean; message: string }> => {
    // Validações do frontend antes de enviar para API
    if (item.quantidade <= 0) {
      const msg = "Quantidade deve ser maior que zero";
      showToast(msg, "warning");
      return { success: false, message: msg };
    }

    if (item.quantidade > 20) {
      const msg = "Quantidade máxima permitida por produto é 20 unidades";
      showToast(msg, "warning");
      return { success: false, message: msg };
    }

    // Limite de valor removido

    const existingItemIndex = cartItems.findIndex((i) => i.id === item.id);
    let updatedItems: CartItem[];

    if (existingItemIndex !== -1) {
      updatedItems = [...cartItems];
      const novaQuantidade = updatedItems[existingItemIndex].quantidade + item.quantidade;
      
      // Verificar limite por produto (20 unidades)
      if (novaQuantidade > 20) {
        const msg = "Quantidade máxima permitida por produto é 20 unidades";
        showToast(msg, "warning");
        return { success: false, message: msg };
      }
      
      // Limite total do carrinho removido

      updatedItems[existingItemIndex].quantidade = novaQuantidade;
    } else {
      // Verificar limite de tipos de produtos
      if (cartItems.length >= 20) {
        const msg = "Limite máximo de 20 tipos de produtos no carrinho atingido";
        showToast(msg, "warning");
        return { success: false, message: msg };
      }

      // Limite total do carrinho removido

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
        const msg = "Produto adicionado ao carrinho!";
        showToast(msg, "success");
        return { success: true, message: msg };
      } else {
        const errorData = await res.json();
        const msg = errorData.error || "Erro ao adicionar produto";
        showToast(msg, "error");
        return { success: false, message: msg };
      }
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
      const msg = "Erro ao adicionar produto. Tente novamente.";
      showToast(msg, "error");
      return { success: false, message: msg };
    }
  };

  // Atualizar quantidade
  const updateItemQuantity = async (id: string, quantidade: number) => {
    if (!id) {
      console.error("ID do produto é undefined ou vazio!");
      return;
    }

    // Validações de quantidade
    if (quantidade < 1) {
      quantidade = 1; // Impede quantidade 0/negativa
    }

    // Buscar item atual para comparar
    const itemAtual = cartItems.find(item => item.id === id);
    const quantidadeAtual = itemAtual?.quantidade || 0;

    // Só validar limites se estiver AUMENTANDO a quantidade
    if (quantidade > quantidadeAtual) {
      if (quantidade > 20) {
        showToast("Quantidade máxima permitida por produto é 20 unidades", "warning");
        return;
      }

      // Limite total do carrinho removido
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
        const errorData = await res.json();
        showToast(errorData.error || "Erro ao atualizar produto", "error");
      }
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      showToast("Erro ao atualizar produto. Tente novamente.", "error");
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
