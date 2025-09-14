// "use client";

// import Header from "@/components/Header";
// import { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useParams } from "next/navigation";

// interface ItemCardapio {
//   _id: string;
//   nome: string;
//   valor: number;
//   img: string;
//   subc: string;
//   vtipo: string;
// }

// const categoriasMenu: string[] = [
//   "BOLOS DOCES ESPECIAIS",
//   "DOCES INDIVIDUAIS",
//   "PAES DOCES",
//   "PAES SALGADOS ESPECIAIS",
//   "ROSCAS PAES ESPECIAIS",
//   "SALGADOS ASSADOS LANCHES",
//   "SOBREMESAS TORTAS",
// ];

// export default function ProdutoDetalhePage() {
//   const params = useParams();
//   const [produto, setProduto] = useState<ItemCardapio | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (params?.id) {
//       buscarProduto(params.id as string);
//     }
//   }, [params?.id]);

//   const buscarProduto = async (id: string) => {
//     setLoading(true);
//     setError(null);

//     try {
//       // Buscar em todas as categorias até encontrar o produto
//       for (const categoria of categoriasMenu) {
//         const categoriaUrl = categoria.toLowerCase().replace(/\s+/g, "-");
//         const response = await fetch(`/api/${categoriaUrl}`);

//         if (response.ok) {
//           const data = await response.json();

//           const chavesAPI: { [key: string]: string } = {
//             "BOLOS DOCES ESPECIAIS": "bolosDocesEspeciais",
//             "DOCES INDIVIDUAIS": "docesIndividuais",
//             "PAES DOCES": "paesDoces",
//             "PAES SALGADOS ESPECIAIS": "paesSalgadosEspeciais",
//             "ROSCAS PAES ESPECIAIS": "roscasPaesEspeciais",
//             "SALGADOS ASSADOS LANCHES": "salgadosAssadosLanches",
//             "SOBREMESAS TORTAS": "sobremesasTortas",
//           };

//           const chave = chavesAPI[categoria] || Object.keys(data)[0];
//           const itens = data[chave] || [];

//           const produtoEncontrado = itens.find((item: ItemCardapio) => item._id === id);
//           if (produtoEncontrado) {
//             setProduto(produtoEncontrado);
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       // Se chegou até aqui, não encontrou o produto
//       setError("Produto não encontrado");
//     } catch (error) {
//       console.error("Erro ao buscar produto:", error);
//       setError("Erro ao carregar produto");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <>
//         <Header />
//         <div className="mx-auto py-8">
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
//           </div>
//         </div>
//       </>
//     );
//   }

//   if (error || !produto) {
//     return (
//       <>
//         <Header />
//         <div className="mx-auto py-8 text-center">
//           <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
//           <p className="text-gray-600 mb-6">{error || "O produto que você está procurando não existe."}</p>
//           <Link
//             href="/produtos"
//             className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
//           >
//             Voltar ao Cardápio
//           </Link>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <Header />
//       <div className="mx-auto py-8 px-4 max-w-4xl">
//         <div className="mb-6">
//           <Link
//             href="/produtos"
//             className="inline-flex items-center text-amber-600 hover:text-amber-500 font-semibold"
//           >
//             ← Voltar ao Cardápio
//           </Link>
//         </div>
        

//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="md:flex">
//             <div className="md:w-1/2">
//               <Image
//                 src={produto.img}
//                 alt={produto.nome}
//                 width={600}
//                 height={600}
//                 className="w-full h-96 md:h-full object-cover"
//               />
//             </div>
//             <div className="md:w-1/2 p-8">
//               <div className="mb-4">
//                 <span className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full">
//                   {produto.subc}
//                 </span>
//               </div>
//               <h1 className="text-3xl font-bold mb-4">{produto.nome}</h1>
//               <div className="mb-6">
//                 <p className="text-2xl font-bold text-amber-600">
//                   A partir: R${produto.valor.toFixed(2).replace(".", ",")} {produto.vtipo}
//                 </p>
//               </div>
              
//               <div className="space-y-4">
//                 <div className="border-t pt-4">
//                   <h3 className="text-lg font-semibold mb-2">Informações do Produto</h3>
//                   <p className="text-gray-600">
//                     Este é um produto da categoria <strong>{produto.subc}</strong>. 
//                     Entre em contato conosco para mais informações sobre disponibilidade, 
//                     tamanhos e opções de personalização.
//                   </p>
//                 </div>
                
//                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
//                   <Link
//                     href="/fale-conosco"
//                     className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
//                   >
//                     Fazer Pedido
//                   </Link>
//                   <Link
//                     href="/produtos"
//                     className="flex-1 border border-amber-600 text-amber-600 hover:bg-amber-50 text-center px-6 py-3 rounded-lg font-semibold transition-colors"
//                   >
//                     Ver Mais Produtos
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// } 







"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ItemCardapio {
  _id: string;
  nome: string;
  valor: number;
  img: string;
  subc: string;
  vtipo: string;
}

const categoriasMenu: string[] = [
  "BOLOS DOCES ESPECIAIS",
  "DOCES INDIVIDUAIS",
  "PAES DOCES",
  "PAES SALGADOS ESPECIAIS",
  "ROSCAS PAES ESPECIAIS",
  "SALGADOS ASSADOS LANCHES",
  "SOBREMESAS TORTAS",
];

export default function ProdutoDetalhePage() {
  const params = useParams();
  const [produto, setProduto] = useState<ItemCardapio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      buscarProduto(params.id as string);
    }
  }, [params?.id]);

  const buscarProduto = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Buscar em todas as categorias até encontrar o produto
      for (const categoria of categoriasMenu) {
        const categoriaUrl = categoria.toLowerCase().replace(/\s+/g, "-");
        const response = await fetch(`/api/${categoriaUrl}`);

        if (response.ok) {
          const data = await response.json();

          const chavesAPI: { [key: string]: string } = {
            "BOLOS DOCES ESPECIAIS": "bolosDocesEspeciais",
            "DOCES INDIVIDUAIS": "docesIndividuais",
            "PAES DOCES": "paesDoces",
            "PAES SALGADOS ESPECIAIS": "paesSalgadosEspeciais",
            "ROSCAS PAES ESPECIAIS": "roscasPaesEspeciais",
            "SALGADOS ASSADOS LANCHES": "salgadosAssadosLanches",
            "SOBREMESAS TORTAS": "sobremesasTortas",
          };

          const chave = chavesAPI[categoria] || Object.keys(data)[0];
          const itens = data[chave] || [];

          const produtoEncontrado = itens.find((item: ItemCardapio) => item._id === id);
          if (produtoEncontrado) {
            setProduto(produtoEncontrado);
            setLoading(false);
            return;
          }
        }
      }

      // Se chegou até aqui, não encontrou o produto
      setError("Produto não encontrado");
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      setError("Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !produto) {
    return (
      <>
        <Header />
        <div className="mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || "O produto que você está procurando não existe."}</p>
          <Link
            href="/produtos"
            className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/produtos"
            className="inline-flex items-center text-amber-600 hover:text-amber-500 font-semibold"
          >
            ← Voltar ao Cardápio
          </Link>
        </div>
        

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <Image
                src={produto.img}
                alt={produto.nome}
                width={600}
                height={600}
                className="w-full h-96 md:h-full object-cover"
              />
              </div>
      </div>
    </>
  );
} 