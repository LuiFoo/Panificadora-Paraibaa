// const fs = require('fs');
// const path = require('path');

// Mapeamento das APIs antigas para as novas
// const mapeamentoAPIs = {
//   'bolos-doces-especiais': 'bolos-doces-especiais',
//   'doces-individuais': 'doces-individuais',
//   'paes-doces': 'paes-doces',
//   'paes-salgados-especiais': 'paes-salgados-especiais',
//   'roscas-paes-especiais': 'roscas-paes-especiais',
//   'salgados-assados-lanches': 'salgados-assados-lanches',
//   'sobremesas-tortas': 'sobremesas-tortas'
// };

// Interface unificada para todos os produtos
const interfaceUnificada = `interface Produto {
  _id: string;
  nome: string;
  slug: string;
  descricao: string;
  categoria: {
    nome: string;
    slug: string;
  };
  subcategoria: string;
  preco: {
    valor: number;
    tipo: string;
    promocao?: {
      ativo: boolean;
      valorPromocional: number;
    };
  };
  imagem: {
    href: string;
    alt: string;
  };
  avaliacao: {
    media: number;
    quantidade: number;
  };
  destaque: boolean;
  tags: string[];
  status: string;
}`;

// Função para atualizar um arquivo
function atualizarArquivo(caminhoArquivo, categoriaSlug) {
  try {
    let conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    
    // Substituir interface
    const regexInterface = /interface \w+ \{[\s\S]*?\}/;
    conteudo = conteudo.replace(regexInterface, interfaceUnificada);
    
    // Substituir fetch da API
    const regexFetch = /fetch\("\/api\/[^"]+"\)/;
    conteudo = conteudo.replace(regexFetch, `fetch("/api/produtos/categoria/${categoriaSlug}")`);
    
    // Substituir chave da resposta
    const regexChave = /data\.\w+/;
    conteudo = conteudo.replace(regexChave, 'data.produtos');
    
    // Substituir renderização do valor
    const regexValor = /parseFloat\([^)]+\)\.toFixed\(2\)/;
    conteudo = conteudo.replace(regexValor, 'produto.preco.valor.toFixed(2).replace(".", ",")');
    
    fs.writeFileSync(caminhoArquivo, conteudo);
    console.log(`✅ Atualizado: ${caminhoArquivo}`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${caminhoArquivo}:`, error.message);
  }
}

// Lista de arquivos para atualizar
const arquivos = [
  'src/components/produtos/paes-doces.tsx',
  'src/components/produtos/paes-salgados-especiais.tsx',
  'src/components/produtos/roscas-paes-especiais.tsx',
  'src/components/produtos/salgados-assados-lanches.tsx',
  'src/components/produtos/sobremesas-tortas.tsx'
];

const categorias = [
  'paes-doces',
  'paes-salgados-especiais',
  'roscas-paes-especiais',
  'salgados-assados-lanches',
  'sobremesas-tortas'
];

// Atualizar todos os arquivos
arquivos.forEach((arquivo, index) => {
  const caminhoCompleto = path.join(process.cwd(), arquivo);
  if (fs.existsSync(caminhoCompleto)) {
    atualizarArquivo(caminhoCompleto, categorias[index]);
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${arquivo}`);
  }
});

console.log('🎉 Atualização dos componentes concluída!');
