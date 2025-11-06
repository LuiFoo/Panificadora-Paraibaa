import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");
    const avaliacoesCollection = db.collection("avaliacoes");

    if (method === "GET") {
      const { produtoId, produtoIds } = req.query;

      const produtosCol = db.collection("produtos");

      // Se produtoIds for fornecido, buscar avaliações de múltiplos produtos (embutidas)
      if (produtoIds) {
        const ids = (produtoIds as string).split(',').filter(Boolean);
        const objectIds = ids
          .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : null))
          .filter((id): id is ObjectId => !!id);

        const produtos = await produtosCol
          .find({ _id: { $in: objectIds } }, { projection: { avaliacao: 1 } })
          .toArray();

        const avaliacoesPorProduto: Record<string, { media: number; total: number }> = {};

        ids.forEach((id) => {
          const prod = produtos.find((p) => p._id?.toString() === id);
          const usuarios = prod?.avaliacao?.usuarios || [];
          if (usuarios.length > 0) {
            // 🐛 CORREÇÃO: Validar notas e prevenir NaN/Infinity
            const soma = usuarios.reduce((acc: number, av: { nota: number }) => {
              const nota = Number(av.nota) || 0;
              return acc + (isNaN(nota) || !isFinite(nota) ? 0 : nota);
            }, 0);
            const media = usuarios.length > 0 ? soma / usuarios.length : 0;
            const mediaFinal = isNaN(media) || !isFinite(media) ? 0 : Number(media.toFixed(1));
            avaliacoesPorProduto[id] = { media: mediaFinal, total: usuarios.length };
          } else {
            avaliacoesPorProduto[id] = { media: 0, total: 0 };
          }
        });

        return res.status(200).json({ success: true, avaliacoes: avaliacoesPorProduto });
      }

      // Buscar média de avaliações de um produto (embutida, com fallback)
      if (!produtoId) {
        return res.status(400).json({ error: "produtoId ou produtoIds é obrigatório" });
      }

      if (!ObjectId.isValid(produtoId as string)) {
        return res.status(400).json({ error: "produtoId inválido" });
      }

      const produto = await produtosCol.findOne(
        { _id: new ObjectId(produtoId as string) },
        { projection: { avaliacao: 1 } }
      );

      const usuariosEmb = produto?.avaliacao?.usuarios || [];
      if (usuariosEmb.length > 0) {
        // 🐛 CORREÇÃO: Validar notas e prevenir NaN/Infinity
        const soma = usuariosEmb.reduce((acc: number, av: { nota: number }) => {
          const nota = Number(av.nota) || 0;
          return acc + (isNaN(nota) || !isFinite(nota) ? 0 : nota);
        }, 0);
        const media = usuariosEmb.length > 0 ? soma / usuariosEmb.length : 0;
        const mediaFinal = isNaN(media) || !isFinite(media) ? 0 : Number(media.toFixed(1));
        return res.status(200).json({ success: true, media: mediaFinal, total: usuariosEmb.length });
      }

      // Fallback para coleção antiga, se não houver embutido
      const avals = await avaliacoesCollection.find({ produtoId: produtoId as string }).toArray();
      if (avals.length === 0) {
        return res.status(200).json({ success: true, media: 0, total: 0 });
      }
      // 🐛 CORREÇÃO: Validar notas e prevenir NaN/Infinity
      const soma = avals.reduce((acc, av) => {
        const nota = Number(av.nota) || 0;
        return acc + (isNaN(nota) || !isFinite(nota) ? 0 : nota);
      }, 0);
      const media = avals.length > 0 ? soma / avals.length : 0;
      // Garantir que media é um número válido
      const mediaFinal = isNaN(media) || !isFinite(media) ? 0 : Number(media.toFixed(1));
      return res.status(200).json({ success: true, media: mediaFinal, total: avals.length });
    }

    if (method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      // Criar/atualizar avaliação embutida
      const { produtoId, nota } = req.body;
      const userId = (session.user as { login?: string }).login || session.user.id || session.user.email;

      if (!produtoId || !userId || !nota) {
        return res.status(400).json({ error: "produtoId, userId e nota são obrigatórios" });
      }
      if (!ObjectId.isValid(produtoId)) {
        return res.status(400).json({ error: "produtoId inválido" });
      }
      if (nota < 1 || nota > 5) {
        return res.status(400).json({ error: "Nota deve ser entre 1 e 5" });
      }

      const produtosCol = db.collection("produtos");
      const _id = new ObjectId(produtoId);

      const produto = await produtosCol.findOne({ _id }, { projection: { avaliacao: 1 } });
      const usuarios: { userId: string; nota: number; dataCriacao?: Date; dataAtualizacao?: Date }[] = produto?.avaliacao?.usuarios || [];
      const agora = new Date();

      const idx = usuarios.findIndex((u: { userId: string }) => u.userId === userId);
      if (idx >= 0) {
        usuarios[idx].nota = nota;
        usuarios[idx].dataAtualizacao = agora;
      } else {
        usuarios.push({ userId, nota, dataCriacao: agora, dataAtualizacao: agora });
      }

      const soma = usuarios.reduce((acc, av) => acc + (Number(av.nota) || 0), 0);
      const media = usuarios.length > 0 ? Number((soma / usuarios.length).toFixed(1)) : 0;

      // 🐛 CORREÇÃO: Verificar resultado do updateOne
      const updateResult = await produtosCol.updateOne(
        { _id },
        {
          $set: {
            "avaliacao.media": media,
            "avaliacao.quantidade": usuarios.length,
            "avaliacao.usuarios": usuarios
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(idx >= 0 ? 200 : 201).json({
        success: true,
        message: idx >= 0 ? "Avaliação atualizada com sucesso" : "Avaliação criada com sucesso",
        media,
        total: usuarios.length
      });
    }

    if (method === "DELETE") {
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      // Remover avaliação embutida
      const { produtoId } = req.body;
      const userId = (session.user as { login?: string }).login || session.user.id || session.user.email;

      if (!produtoId || !userId) {
        return res.status(400).json({ error: "produtoId e userId são obrigatórios" });
      }
      if (!ObjectId.isValid(produtoId)) {
        return res.status(400).json({ error: "produtoId inválido" });
      }

      const produtosCol = db.collection("produtos");
      const _id = new ObjectId(produtoId);

      const produto = await produtosCol.findOne({ _id }, { projection: { avaliacao: 1 } });
      const usuarios: { userId: string; nota: number; dataCriacao?: Date; dataAtualizacao?: Date }[] = produto?.avaliacao?.usuarios || [];
      const novosUsuarios = usuarios.filter((u: { userId: string }) => u.userId !== userId);
      const soma = novosUsuarios.reduce((acc, av) => acc + (Number(av.nota) || 0), 0);
      const media = novosUsuarios.length > 0 ? Number((soma / novosUsuarios.length).toFixed(1)) : 0;

      // 🐛 CORREÇÃO: Verificar resultado do updateOne
      const deleteResult = await produtosCol.updateOne(
        { _id },
        {
          $set: {
            "avaliacao.media": media,
            "avaliacao.quantidade": novosUsuarios.length,
            "avaliacao.usuarios": novosUsuarios
          }
        }
      );

      if (deleteResult.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Avaliação removida com sucesso",
        media,
        total: novosUsuarios.length
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de avaliações:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

