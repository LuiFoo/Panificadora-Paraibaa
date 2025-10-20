import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

// Usar apenas a coleção unificada "produtos"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "PUT") {
      // Aceita payload novo e antigo
      const {
        id,
        // novo
        nome,
        descricao,
        categoria,
        subcategoria,
        preco,
        estoque,
        imagem,
        ingredientes,
        alergicos,
        destaque,
        tags,
        status,
        // legado
        valor,
        vtipo,
        img
      } = req.body;

      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      if (!nome) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }

      const updateData: Record<string, unknown> = {
        nome,
        atualizadoEm: new Date()
      };

      // Categoria
      if (categoria?.nome || categoria?.slug) {
        const catNome = categoria?.nome || categoria?.slug;
        const catSlug = (categoria?.slug || catNome).toString().toLowerCase().replace(/\s+/g, "-");
        updateData.categoria = { nome: catNome, slug: catSlug };
      }
      if (typeof subcategoria === 'string') {
        updateData.subcategoria = subcategoria;
      }

      // Preço (novo ou legado)
      const precoValor = preco?.valor ?? (valor !== undefined ? parseFloat(valor) : undefined);
      const precoTipo = preco?.tipo || vtipo;
      const precoCusto = preco?.custoProducao;
      const prom = preco?.promocao;
      if (precoValor !== undefined || precoTipo || precoCusto !== undefined || prom) {
        updateData.preco = {
          ...(precoValor !== undefined ? { valor: Number(precoValor) } : {}),
          ...(precoTipo ? { tipo: precoTipo } : {}),
          ...(precoCusto !== undefined ? { custoProducao: Number(precoCusto) } : {}),
          ...(prom ? {
            promocao: {
              ativo: !!prom.ativo,
              ...(prom.valorPromocional !== undefined ? { valorPromocional: Number(prom.valorPromocional) } : {}),
              ...(prom.inicio ? { inicio: new Date(prom.inicio) } : {}),
              ...(prom.fim ? { fim: new Date(prom.fim) } : {})
            }
          } : {})
        };
      }

      // Estoque
      if (estoque) {
        updateData.estoque = {
          ...(estoque.disponivel !== undefined ? { disponivel: !!estoque.disponivel } : {}),
          ...(estoque.quantidade !== undefined ? { quantidade: Number(estoque.quantidade) } : {}),
          ...(estoque.minimo !== undefined ? { minimo: Number(estoque.minimo) } : {}),
          ...(estoque.unidadeMedida ? { unidadeMedida: estoque.unidadeMedida } : {})
        };
      }

      // Imagem (novo ou legado)
      if (imagem?.href || img) {
        updateData.imagem = {
          href: imagem?.href || img,
          alt: imagem?.alt || nome,
          galeria: Array.isArray(imagem?.galeria) ? imagem!.galeria : undefined
        };
      }

      // Descrição
      if (typeof descricao === 'string') {
        updateData.descricao = descricao;
      }

      // Ingredientes / Alérgicos / Tags / Destaque
      if (ingredientes !== undefined) {
        updateData.ingredientes = Array.isArray(ingredientes)
          ? ingredientes
          : (typeof ingredientes === 'string' ? ingredientes.split(',').map((i: string) => i.trim()) : []);
      }
      if (alergicos !== undefined) {
        updateData.alergicos = Array.isArray(alergicos) ? alergicos : [];
      }
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags : [];
      }
      if (destaque !== undefined) {
        updateData.destaque = !!destaque;
      }
      if (status) {
        const s = String(status).toLowerCase();
        updateData.status = (s === 'inativo' || s === 'pause' || s === 'paused') ? 'inativo' : 'ativo';
      }

      const result = await db.collection("produtos").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ success: true, message: "Produto atualizado com sucesso" });
    }

    if (method === "PATCH") {
      // Método para atualizar apenas o status do produto (pausar/ativar)
      const { id, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const statusLower = String(status || '').toLowerCase();
      const normalized = (statusLower === 'ativo' || statusLower === 'active') ? 'ativo' : 'inativo';
      const result = await db.collection("produtos").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: normalized, atualizadoEm: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Se o produto foi pausado, remover de todos os carrinhos
      if (normalized === "inativo") {
        try {
          // Remover o produto de todos os carrinhos dos usuários
          const updateOperation = {
            $pull: { 
              "carrinho.produtos": { produtoId: id }
            },
            $set: {
              "carrinho.updatedAt": new Date().toISOString()
            }
          };
          
          await db.collection("users").updateMany(
            { "carrinho.produtos.produtoId": id },
            updateOperation as Record<string, unknown>
          );
          
          console.log(`Produto ${id} removido de todos os carrinhos após ser pausado`);
        } catch (error) {
          console.error("Erro ao remover produto dos carrinhos:", error);
          // Não falhar a operação principal se houver erro na remoção dos carrinhos
        }
      }

      return res.status(200).json({ success: true, message: `Produto ${normalized === 'inativo' ? 'pausado' : 'ativado'} com sucesso` });
    }

    if (method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      // Excluir permanentemente da coleção unificada
      const deleteResult = await db.collection("produtos").deleteOne({ _id: new ObjectId(id) });

      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto excluído definitivamente com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de edição de produtos existentes:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

