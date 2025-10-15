"use client";

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
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
  forcarAtualizacao: () => Promise<void>;
}

// --------------- Contexto ---------------
const CartContext = createContext<CartContextType | undefined>(undefined);

// --------------- Provider ---------------
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { showToast } = useToast();
  const login = user?.login ?? "guest";

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Função para verificar e remover produtos pausados e atualizar preços
  const verificarProdutosPausados = useCallback(async (items: CartItem[]) => {
    const produtosValidos: CartItem[] = [];
    const produtosPausados: string[] = [];
    const produtosComPrecoAtualizado: string[] = [];

    for (const item of items) {
      try {
        // Verificar se o produto ainda está ativo em todas as coleções
        const colecoes = [
          'produtos', 'bolos-doces-especiais', 'paes-doces', 'paes-salgados-especiais',
          'roscas-paes-especiais', 'salgados-assados-lanches', 'sobremesas-tortas', 'doces-individuais'
        ];
        
        let produtoEncontrado = false;
        let novoValor = item.valor;
        
        for (const colecao of colecoes) {
          const response = await fetch(`/api/${colecao}`);
          if (response.ok) {
            const data = await response.json();
            const produtos = data[colecao] || data.bolosDocesEspeciais || data.paesDoces || 
                           data.paesSalgadosEspeciais || data.roscasPaesEspeciais || 
                           data.salgadosAssadosLanches || data.sobremesasTortas || data.docesIndividuais || [];
            
            const produto = produtos.find((p: { _id: string; status?: string; valor?: number }) => p._id === item.id);
            if (produto && !produto.status) {
              produtoEncontrado = true;
              // Verificar se o preço mudou
              if (produto.valor !== undefined && produto.valor !== item.valor) {
                novoValor = produto.valor;
                produtosComPrecoAtualizado.push(`${item.nome} (R$ ${item.valor.toFixed(2)} → R$ ${novoValor.toFixed(2)})`);
              }
              break;
            }
          }
        }
        
        if (produtoEncontrado) {
          produtosValidos.push({
            ...item,
            valor: novoValor
          });
        } else {
          produtosPausados.push(item.nome);
        }
      } catch (error) {
        console.error(`Erro ao verificar produto ${item.nome}:`, error);
        // Em caso de erro, manter o produto no carrinho
        produtosValidos.push(item);
      }
    }

    // Se há produtos pausados ou com preço atualizado, atualizar o carrinho
    if (produtosPausados.length > 0 || produtosComPrecoAtualizado.length > 0) {
      setCartItems(produtosValidos);
      
      // Notificar sobre produtos pausados
      if (produtosPausados.length > 0) {
        showToast(`Produtos pausados removidos do carrinho: ${produtosPausados.join(', ')}`, "warning");
      }
      
      // Notificar sobre preços atualizados
      if (produtosComPrecoAtualizado.length > 0) {
        showToast(`Preços atualizados: ${produtosComPrecoAtualizado.join(', ')}`, "info");
      }
      
      // Atualizar o carrinho no backend
      try {
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: login,
            produtos: produtosValidos.map(item => ({
              produtoId: item.id,
              nome: item.nome,
              valor: item.valor,
              quantidade: item.quantidade,
              img: item.img
            }))
          })
        });
      } catch (error) {
        console.error("Erro ao atualizar carrinho:", error);
      }
    }

    return produtosValidos;
  }, [login, showToast]);

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

        // Verificar produtos pausados após carregar o carrinho
        const produtosValidos = await verificarProdutosPausados(mappedItems);
        setCartItems(produtosValidos);
      } catch (err) {
        console.error("Erro ao carregar carrinho do MongoDB:", err);
        setCartItems([]);
      }
    };

    void fetchCart();
  }, [login, verificarProdutosPausados]);

  // Atualização automática de preços e verificação de produtos pausados
  useEffect(() => {
    if (cartItems.length === 0) return;

    // Verificação mais frequente para detectar mudanças rapidamente
    const interval = setInterval(async () => {
      try {
        const produtosValidos = await verificarProdutosPausados(cartItems);
        
        // Verificar se houve mudanças
        const mudancas = produtosValidos.length !== cartItems.length || 
          produtosValidos.some((novo, index) => {
            const antigo = cartItems[index];
            return antigo && (novo.valor !== antigo.valor || novo.nome !== antigo.nome);
          });

        if (mudancas) {
          setCartItems(produtosValidos);
          console.log("🔄 Carrinho atualizado automaticamente");
        }
      } catch (error) {
        console.error("Erro na atualização automática de preços:", error);
      }
    }, 5000); // 5 segundos para verificação ainda mais rápida

    return () => clearInterval(interval);
  }, [cartItems, verificarProdutosPausados]);

  // Verificação adicional quando a página ganha foco (usuário volta à aba)
  useEffect(() => {
    const handleFocus = async () => {
      if (cartItems.length === 0) return;
      
      try {
        const produtosValidos = await verificarProdutosPausados(cartItems);
        setCartItems(produtosValidos);
        console.log("🔄 Carrinho verificado ao retornar à página");
      } catch (error) {
        console.error("Erro na verificação ao retornar:", error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cartItems, verificarProdutosPausados]);

  // Listener para eventos de atualização de produtos (quando admin edita)
  useEffect(() => {
    const handleProdutoEditado = async () => {
      if (cartItems.length === 0) return;
      
      try {
        console.log("🔄 Produto editado detectado - verificando carrinho...");
        const produtosValidos = await verificarProdutosPausados(cartItems);
        setCartItems(produtosValidos);
      } catch (error) {
        console.error("Erro na verificação após edição:", error);
      }
    };

    // Escutar eventos customizados de atualização de produtos
    window.addEventListener('produtoEditado', handleProdutoEditado);
    window.addEventListener('produtoPausado', handleProdutoEditado);
    window.addEventListener('produtoAtivado', handleProdutoEditado);
    
    return () => {
      window.removeEventListener('produtoEditado', handleProdutoEditado);
      window.removeEventListener('produtoPausado', handleProdutoEditado);
      window.removeEventListener('produtoAtivado', handleProdutoEditado);
    };
  }, [cartItems, verificarProdutosPausados]);

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
      // Substituir quantidade em vez de somar
      const novaQuantidade = item.quantidade;
      
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

  // Forçar atualização do carrinho (verificar produtos pausados e preços)
  const forcarAtualizacao = async () => {
    if (cartItems.length === 0) return;
    
    try {
      console.log("🔄 Forçando atualização do carrinho...");
      const produtosValidos = await verificarProdutosPausados(cartItems);
      setCartItems(produtosValidos);
      showToast("Carrinho atualizado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao forçar atualização:", error);
      showToast("Erro ao atualizar carrinho", "error");
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, totalItems, removeItem, updateItemQuantity, clearCart, addItem, forcarAtualizacao }}
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
