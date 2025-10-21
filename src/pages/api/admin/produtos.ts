import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";
import { safeParseFloat, safeParseInt } from "@/lib/validation";

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

    if (method === "GET") {
      // Buscar todos os produtos
      const produtos = await db.collection("produtos")
        .find({})
        .sort({ dataCriacao: -1 })
        .toArray();

      return res.status(200).json({ success: true, produtos });
    }

    if (method === "POST") {
      // Suporte a payload antigo e novo
      const {
        // antigo
        subc,
        valor,
        vtipo,
        ingredientes,
        img,
        // novo
        nome,
        descricao,
        categoria,
        subcategoria,
        preco,
        estoque,
        imagem,
        alergicos,
        destaque,
        tags,
        status
      } = req.body;

      // Criar produto

      // Validação mínima
      if (!nome) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }

      // Gerar slug único
      const slugBase = nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      let slug = slugBase;
      let counter = 1;
      const MAX_TENTATIVAS = 100; // Prevenir loop infinito

      // ⚠️ CORREÇÃO DE BUG: Race condition em geração de slug
      while (counter < MAX_TENTATIVAS && await db.collection("produtos").findOne({ slug })) {
        slug = `${slugBase}-${counter}`;
        counter++;
      }

      if (counter >= MAX_TENTATIVAS) {
        return res.status(500).json({ error: "Erro ao gerar slug único. Tente outro nome." });
      }

      // Salvar na coleção produtos

      // Normalizações a partir do payload
      const categoriaNome = categoria?.nome || subc || "Categoria";
      const categoriaSlug = (categoria?.slug || categoriaNome)
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const precoValor = preco?.valor ?? (valor !== undefined ? safeParseFloat(valor, 0) : 0);
      const precoTipo = preco?.tipo || vtipo || "UN";
      const precoCusto = preco?.custoProducao !== undefined ? safeParseFloat(preco.custoProducao, 0) : undefined;
      const promocaoAtiva = !!preco?.promocao?.ativo;
      const promocaoValor = preco?.promocao?.valorPromocional !== undefined ? safeParseFloat(preco?.promocao?.valorPromocional, 0) : undefined;
      const promocaoInicio = preco?.promocao?.inicio ? new Date(preco.promocao.inicio) : undefined;
      const promocaoFim = preco?.promocao?.fim ? new Date(preco.promocao.fim) : undefined;

      const estoqueDisponivel = estoque?.disponivel !== undefined ? !!estoque.disponivel : true;
      const estoqueQtd = estoque?.quantidade !== undefined ? safeParseInt(estoque.quantidade, 0) : undefined;
      const estoqueMin = estoque?.minimo !== undefined ? safeParseInt(estoque.minimo, 0) : undefined;
      const unidadeMedida = estoque?.unidadeMedida || precoTipo;

      const imagemHref = imagem?.href || img;
      const imagemAlt = imagem?.alt || nome;
      const imagemGaleria: string[] = Array.isArray(imagem?.galeria) ? imagem!.galeria : [];

      const ingredientesArr: string[] = Array.isArray(ingredientes)
        ? ingredientes
        : (typeof ingredientes === 'string' ? ingredientes.split(',').map((i: string) => i.trim()) : []);
      const alergicosArr: string[] = Array.isArray(alergicos) ? alergicos : [];
      const tagsArr: string[] = Array.isArray(tags) ? tags : [];

      if (!precoValor || isNaN(precoValor) || precoValor <= 0) {
        return res.status(400).json({ error: "Preço 'valor' deve ser numérico e maior que zero" });
      }
      if (!imagemHref) {
        return res.status(400).json({ error: "Imagem 'href' é obrigatória" });
      }

      const novoProduto = {
        nome,
        slug,
        descricao: descricao || (ingredientesArr.length ? ingredientesArr.join(', ') : ""),
        categoria: {
          nome: categoriaNome,
          slug: categoriaSlug
        },
        subcategoria: subcategoria || "Tradicional",
        preco: {
          valor: Number(precoValor),
          tipo: precoTipo,
          ...(precoCusto !== undefined ? { custoProducao: precoCusto } : {}),
          ...(promocaoAtiva && promocaoValor !== undefined ? {
            promocao: {
              ativo: true,
              valorPromocional: promocaoValor,
              ...(promocaoInicio ? { inicio: promocaoInicio } : {}),
              ...(promocaoFim ? { fim: promocaoFim } : {})
            }
          } : { promocao: { ativo: false, valorPromocional: undefined, inicio: undefined, fim: undefined } })
        },
        estoque: {
          disponivel: estoqueDisponivel,
          ...(estoqueQtd !== undefined ? { quantidade: estoqueQtd } : {}),
          ...(estoqueMin !== undefined ? { minimo: estoqueMin } : {}),
          unidadeMedida
        },
        imagem: {
          href: imagemHref,
          alt: imagemAlt,
          galeria: imagemGaleria
        },
        ingredientes: ingredientesArr,
        alergicos: alergicosArr,
        avaliacao: {
          media: 0,
          quantidade: 0,
          usuarios: [] as { userId: string; nota: number; dataCriacao: Date; dataAtualizacao: Date }[]
        },
        destaque: !!destaque,
        tags: tagsArr,
        status: status === 'inativo' ? 'inativo' : 'ativo',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      try {
        const result = await db.collection("produtos").insertOne(novoProduto);
        return res.status(201).json({ 
          success: true,
          produtoId: result.insertedId,
          colecao: "produtos",
          message: "Produto criado com sucesso"
        });
      } catch (e: unknown) {
        const error = e as { code?: number; keyPattern?: { slug?: boolean } };
        if (error?.code === 11000 && error?.keyPattern?.slug) {
          return res.status(409).json({ error: "Slug já existe. Tente outro nome." });
        }
        throw e;
      }
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin produtos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
