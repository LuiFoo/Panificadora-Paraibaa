/**
 * Script de migração para converter produtos das coleções antigas
 * para a nova estrutura unificada na coleção "produtos"
 */

import clientPromise from "@/modules/mongodb";

// Função para gerar slug a partir do nome
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

// Mapeamento das coleções antigas para as novas categorias
const MAPEAMENTO_COLECOES = {
  "bolos-doces-especiais": {
    nome: "BOLOS DOCES ESPECIAIS",
    slug: "bolos-doces-especiais"
  },
  "doces-individuais": {
    nome: "DOCES INDIVIDUAIS",
    slug: "doces-individuais"
  },
  "paes-doces": {
    nome: "PAES DOCES",
    slug: "paes-doces"
  },
  "paes-salgados-especiais": {
    nome: "PAES SALGADOS ESPECIAIS",
    slug: "paes-salgados-especiais"
  },
  "roscas-paes-especiais": {
    nome: "ROSCAS PAES ESPECIAIS",
    slug: "roscas-paes-especiais"
  },
  "salgados-assados-lanches": {
    nome: "SALGADOS ASSADOS LANCHES",
    slug: "salgados-assados-lanches"
  },
  "sobremesas-tortas": {
    nome: "SOBREMESAS TORTAS",
    slug: "sobremesas-tortas"
  }
};

async function migrarProdutos() {
  try {
    console.log("🚀 Iniciando migração dos produtos...");
    
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Verificar se já existe a coleção produtos
    const colecaoProdutos = db.collection("produtos");
    const existeProdutos = await colecaoProdutos.findOne({});
    
    if (existeProdutos) {
      console.log("⚠️  Coleção 'produtos' já existe. Pulando migração.");
      return;
    }

    const colecoesAntigas = Object.keys(MAPEAMENTO_COLECOES);
    let totalMigrados = 0;

    for (const nomeColecao of colecoesAntigas) {
      console.log(`📦 Migrando coleção: ${nomeColecao}`);
      
      const colecao = db.collection(nomeColecao);
      const produtos = await colecao.find({}).toArray();
      
      const categoria = MAPEAMENTO_COLECOES[nomeColecao];
      
      for (const produto of produtos) {
        // Gerar slug único
        const slugBase = gerarSlug(produto.nome);
        let slug = slugBase;
        let counter = 1;

        while (await colecaoProdutos.findOne({ slug })) {
          slug = `${slugBase}-${counter}`;
          counter++;
        }

        // Converter para nova estrutura
        const produtoMigrado = {
          nome: produto.nome,
          slug,
          descricao: produto.descricao || produto.ingredientes || "",
          categoria: {
            nome: categoria.nome,
            slug: categoria.slug
          },
          subcategoria: produto.subc || "Padrão",
          preco: {
            valor: produto.valor,
            tipo: produto.vtipo || "UN",
            custoProducao: produto.custoProducao || null
          },
          estoque: {
            disponivel: produto.status !== "pause",
            unidadeMedida: produto.vtipo || "UN"
          },
          imagem: {
            href: produto.img || "https://via.placeholder.com/300x200?text=Sem+Imagem",
            alt: produto.nome
          },
          ingredientes: produto.ingredientes ? 
            (Array.isArray(produto.ingredientes) ? produto.ingredientes : produto.ingredientes.split(',').map(i => i.trim())) : 
            [],
          alergicos: produto.alergicos || [],
          avaliacao: {
            media: produto.mediaAvaliacao || 0,
            quantidade: produto.totalAvaliacoes || 0,
            usuarios: []
          },
          destaque: produto.destaque || false,
          tags: produto.tags || [],
          status: produto.status === "pause" ? "inativo" : "ativo",
          criadoEm: produto.dataCriacao || new Date(),
          atualizadoEm: produto.dataAtualizacao || new Date()
        };

        await colecaoProdutos.insertOne(produtoMigrado);
        totalMigrados++;
      }
      
      console.log(`✅ ${produtos.length} produtos migrados de ${nomeColecao}`);
    }

    console.log(`🎉 Migração concluída! Total de produtos migrados: ${totalMigrados}`);
    
  } catch (error) {
    console.error("❌ Erro na migração:", error);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrarProdutos().then(() => {
    console.log("Migração finalizada.");
    process.exit(0);
  });
}

export default migrarProdutos;
