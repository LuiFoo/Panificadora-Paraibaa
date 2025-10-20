import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

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

      console.log("📦 Tentando criar produto:", { nome });

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

      while (await db.collection("produtos").findOne({ slug })) {
        slug = `${slugBase}-${counter}`;
        counter++;
      }

      console.log(`📂 Salvando na coleção unificada: produtos`);

      // Normalizações a partir do payload
      const categoriaNome = categoria?.nome || subc || "Categoria";
      const categoriaSlug = (categoria?.slug || categoriaNome)
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const precoValor = preco?.valor ?? (valor !== undefined ? parseFloat(valor) : 0);
      const precoTipo = preco?.tipo || vtipo || "UN";
      const precoCusto = preco?.custoProducao !== undefined ? Number(preco.custoProducao) : undefined;
      const promocaoAtiva = !!preco?.promocao?.ativo;
      const promocaoValor = preco?.promocao?.valorPromocional !== undefined ? Number(preco?.promocao?.valorPromocional) : undefined;
      const promocaoInicio = preco?.promocao?.inicio ? new Date(preco.promocao.inicio) : undefined;
      const promocaoFim = preco?.promocao?.fim ? new Date(preco.promocao.fim) : undefined;

      const estoqueDisponivel = estoque?.disponivel !== undefined ? !!estoque.disponivel : true;
      const estoqueQtd = estoque?.quantidade !== undefined ? Number(estoque.quantidade) : undefined;
      const estoqueMin = estoque?.minimo !== undefined ? Number(estoque.minimo) : undefined;
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
          usuarios: [] as any[]
        },
        destaque: !!destaque,
        tags: tagsArr,
        status: status === 'inativo' ? 'inativo' : 'ativo',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      console.log("✅ Inserindo produto no MongoDB...");
      try {
        const result = await db.collection("produtos").insertOne(novoProduto);
        console.log(`✅ Produto inserido na coleção produtos com ID:`, result.insertedId);
        return res.status(201).json({ 
          success: true,
          produtoId: result.insertedId,
          colecao: "produtos",
          message: "Produto criado com sucesso"
        });
      } catch (e: any) {
        if (e?.code === 11000 && e?.keyPattern?.slug) {
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
