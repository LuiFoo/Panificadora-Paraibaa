// "use client";

// import Header from "@/components/Header";
// import MenuCategoria from "@/components/MenuCategoria";
// import { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";

// interface ItemCardapio {
//   _id: string;
//   nome: string;
//   valor: number;
//   img: string;
//   subc: string;
//   vtipo: string;

// }

// const categoriasMenu: string[] = [
//   'BOLOS DOCES ESPECIAIS',
//   'DOCES INDIVIDUAIS',
//   'PAES DOCES',
//   'PAES SALGADOS ESPECIAIS',
//   'ROSCAS PAES ESPECIAIS',
//   'SALGADOS ASSADOS LANCHES',
//   'SOBREMESAS TORTAS',
// ];

// // Definindo categoria padrão aqui
// const categoriaPadrao = categoriasMenu[0];

// export default function CardapioPage() {
//   const [categoriaAtual, setCategoriaAtual] = useState<string | null>(null);
//   const [itens, setItens] = useState<ItemCardapio[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//     const params = new URLSearchParams(window.location.search);
//     const categoriaParam = params.get("categoria");

//     if (categoriaParam && categoriasMenu.includes(categoriaParam)) {
//       setCategoriaAtual(categoriaParam);
//       buscarItensPorCategoria(categoriaParam);
//     } else {
//       // Setando categoria padrão se não tiver param
//       setCategoriaAtual(categoriaPadrao);
//       buscarItensPorCategoria(categoriaPadrao);

//       // Atualizando a URL sem dar refresh
//       const url = new URL(window.location.href);
//       url.searchParams.set("categoria", categoriaPadrao);
//       window.history.replaceState({}, "", url);
//     }
//   }, []);

//   const buscarItensPorCategoria = async (categoria: string) => {
//     setLoading(true);

//     try {
//       const categoriaUrl = categoria.toLowerCase().replace(/\s+/g, '-');
//       const response = await fetch(`/api/${categoriaUrl}`);

//       if (!response.ok) {
//         throw new Error(`Falha ao buscar itens da categoria ${categoria}`);
//       }

//       const data = await response.json();

//       const chavesAPI: { [key: string]: string } = {
//         'BOLOS DOCES ESPECIAIS': 'bolosDocesEspeciais',
//         'DOCES INDIVIDUAIS': 'docesIndividuais',
//         'PAES DOCES': 'paesDoces',
//         'PAES SALGADOS ESPECIAIS': 'paesSalgadosEspeciais',
//         'ROSCAS PAES ESPECIAIS': 'roscasPaesEspeciais',
//         'SALGADOS ASSADOS LANCHES': 'salgadosAssadosLanches',
//         'SOBREMESAS TORTAS': 'sobremesasTortas',
//       };

//       const chave = chavesAPI[categoria] || Object.keys(data)[0];
//       setItens(data[chave] || []);
//     } catch (error) {
//       console.error(`Erro ao buscar itens da categoria ${categoria}:`, error);
//       setItens([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCategoriaClick = (categoria: string) => {
//     setCategoriaAtual(categoria);
//     buscarItensPorCategoria(categoria);

//     const url = new URL(window.location.href);
//     url.searchParams.set("categoria", categoria);
//     window.history.pushState({}, "", url);
//   };

//   return (
//     <>
//       <Header />
//       <div className="mx-auto py-8">
//         <h1 className="text-3xl font-bold text-center mb-6">Nosso Cardápio</h1>

//         <MenuCategoria
//           categories={categoriasMenu}
//           activeCategory={categoriaAtual}
//           variant="button"
//           onCategoryClick={handleCategoriaClick}
//         />

//         <div className="mt-12">
//           {categoriaAtual && (
//             <h2 className="text-2xl font-bold mb-6 text-center">{categoriaAtual}</h2>
//           )}

//           {!isClient ? (
//             <p className="text-center text-gray-500">Carregando...</p>
//           ) : loading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
//             </div>
//           ) : categoriaAtual ? (
//             <div className="flex flex-wrap justify-center gap-[30px]">
//               {itens.length ? (
//                 itens.map((item) => (
//                   <div
//                     key={item._id}
//                     className="bg-[#e6e6e6] w-75 rounded-lg shadow-md p-5 hover:shadow-lg transition"
//                   >
//                     <Image
//                       src={item.img}
//                       alt={item.nome}
//                       width={250}
//                       height={250}
//                       className="object-cover rounded mb-4 justify-self-center"
//                     />
//                     <p className="font-bold text-[#646464]">{item.subc}</p>
//                     <h3 className="text-lg font-semibold mb-2">{item.nome}</h3>
//                     <p className="text-amber-600 font-bold mb-8">
//                       A partir: R${item.valor.toFixed(2).replace(".", ",")} {item.vtipo} 
//                     </p>
//                     {/* <Link href="/" className="font-semibold bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] px-[0.7rem] py-[0.4rem] rounded-lg">Ver opções</Link> */}
//                   </div>
//                 ))
//               ) : (
//                 <p className="col-span-full text-center text-gray-500 py-8">
//                   Nenhum item encontrado nesta categoria.
//                 </p>
//               )}
//             </div>
//           ) : (
//             <p className="text-center text-gray-500 py-8 px-4">
//               Selecione uma categoria para ver os itens disponíveis.
//             </p>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }


"use client";

import Header from "@/components/Header";
import MenuCategoria from "@/components/MenuCategoria";
import { useEffect, useState } from "react";
import Image from "next/image";

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

const categoriaPadrao = categoriasMenu[0];

export default function CardapioPage() {
  const [categoriaAtual, setCategoriaAtual] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemCardapio | null>(null);

  useEffect(() => {
    setIsClient(true);
    const params = new URLSearchParams(window.location.search);
    const categoriaParam = params.get("categoria");

    if (categoriaParam && categoriasMenu.includes(categoriaParam)) {
      setCategoriaAtual(categoriaParam);
      buscarItensPorCategoria(categoriaParam);
    } else {
      setCategoriaAtual(categoriaPadrao);
      buscarItensPorCategoria(categoriaPadrao);

      const url = new URL(window.location.href);
      url.searchParams.set("categoria", categoriaPadrao);
      window.history.replaceState({}, "", url);
    }
  }, []);

  const buscarItensPorCategoria = async (categoria: string) => {
    setLoading(true);
    try {
      const categoriaUrl = categoria.toLowerCase().replace(/\s+/g, "-");
      const response = await fetch(`/api/${categoriaUrl}`);

      if (!response.ok) {
        throw new Error(`Falha ao buscar itens da categoria ${categoria}`);
      }

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
      setItens(data[chave] || []);
    } catch (error) {
      console.error(`Erro ao buscar itens da categoria ${categoria}:`, error);
      setItens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaClick = (categoria: string) => {
    setCategoriaAtual(categoria);
    buscarItensPorCategoria(categoria);

    const url = new URL(window.location.href);
    url.searchParams.set("categoria", categoria);
    window.history.pushState({}, "", url);
  };

  const abrirModal = (item: ItemCardapio) => {
    setItemSelecionado(item);
  };

  const fecharModal = () => {
    setItemSelecionado(null);
  };

  return (
    <>
      <Header />
      <div className="mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-6">Nosso Cardápio</h1>

        <MenuCategoria
          categories={categoriasMenu}
          activeCategory={categoriaAtual}
          variant="button"
          onCategoryClick={handleCategoriaClick}
        />

        <div className="mt-12">
          {categoriaAtual && (
            <h2 className="text-2xl font-bold mb-6 text-center">{categoriaAtual}</h2>
          )}

          {!isClient ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : categoriaAtual ? (
            <div className="flex flex-wrap justify-center gap-[30px]">
              {itens.length ? (
                itens.map((item) => (
                  <div
                    key={item._id}
                    className="bg-[#e6e6e6] w-75 rounded-lg shadow-md p-5 hover:shadow-lg transition"
                  >
                    <Image
                      src={item.img}
                      alt={item.nome}
                      width={250}
                      height={250}
                      className="object-cover rounded mb-4 justify-self-center"
                    />
                    <p className="font-bold text-[#646464]">{item.subc}</p>
                    <h3 className="text-lg font-semibold mb-2">{item.nome}</h3>
                    <p className="text-amber-600 font-bold mb-8">
                      A partir: R${item.valor.toFixed(2).replace(".", ",")} {item.vtipo}
                    </p>
                    <button
                      onClick={() => abrirModal(item)}
                      className="font-semibold bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg"
                    >
                      Ver opções
                    </button>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-8">
                  Nenhum item encontrado nesta categoria.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 px-4">
              Selecione uma categoria para ver os itens disponíveis.
            </p>
          )}
        </div>
      </div>

      {/* Modal tela cheia */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white w-full h-full max-w-3xl p-8 rounded-lg shadow-lg overflow-y-auto relative">
            <button
              onClick={fecharModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>
            <Image
              src={itemSelecionado.img}
              alt={itemSelecionado.nome}
              width={400}
              height={400}
              className="mx-auto object-cover rounded mb-6"
            />
            <h2 className="text-2xl font-bold mb-2 text-center">{itemSelecionado.nome}</h2>
            <p className="text-center text-gray-600 mb-4">{itemSelecionado.subc}</p>
            <p className="text-amber-600 font-bold text-center text-xl mb-6">
              A partir: R${itemSelecionado.valor.toFixed(2).replace(".", ",")} {itemSelecionado.vtipo}
            </p>
            <div className="text-center">
              {/* <p className="text-gray-700">
                Aqui você pode adicionar mais detalhes ou opções do produto futuramente.
              </p> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
