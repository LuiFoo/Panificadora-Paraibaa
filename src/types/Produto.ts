// Interface unificada para produtos
export interface Produto {
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
    custoProducao?: number;
    promocao?: {
      ativo: boolean;
      valorPromocional: number;
      inicio: Date;
      fim: Date;
    };
  };
  estoque: {
    disponivel: boolean;
    quantidade?: number;
    minimo?: number;
    unidadeMedida: string;
  };
  imagem: {
    href: string;
    alt: string;
    galeria?: string[]; // Galeria de imagens adicionais
  };
  ingredientes: string[];
  alergicos: string[];
  avaliacao: {
    media: number;
    quantidade: number;
    usuarios?: Array<{
      userId: string;
      nota: number;
      dataCriacao: Date;
      dataAtualizacao: Date;
    }>;
  };
  destaque: boolean;
  tags: string[];
  status: "ativo" | "inativo" | "sazonal";
  criadoEm: Date;
  atualizadoEm: Date;
  // Campos de compatibilidade com sistema antigo
  subc?: string;
  valor?: number;
  vtipo?: string;
  img?: string;
  colecaoOrigem?: string;
  dataCriacao?: string | Date;
  dataAtualizacao?: string | Date;
}
