'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProdutoDestaque {
  _id: string;
  nome: string;
  slug: string;
  imagem: {
    href: string;
    alt: string;
  };
  preco: {
    valor: number;
    tipo: string;
  };
}

// Fallback para quando não houver produtos destacados
const produtosFallback = [
  { name: 'Bolo Cenoura ', image: '/images/cenoura.png' },
  { name: 'Baguete pequeno', image: '/images/baguetePequeno.png' },
  { name: 'Baguete Grande', image: '/images/bagueteGrande.png' },
  { name: 'Forrozinho', image: '/images/forrozinho.png' },
  { name: 'Rosca de Chocolate', image: '/images/roscaChocolate.png' },
  { name: 'Filão', image: '/images/filao.png' },
  { name: 'Bolo Kinder Bueno', image: '/images/boloKinderBueno.png' },
  { name: 'Pao de Queijo', image: '/images/paoQueijo.png' }
];

export default function CategoriasSwiper() {
  const [produtos, setProdutos] = useState<ProdutoDestaque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProdutosDestaque() {
      try {
        const response = await fetch('/api/produtos/destaques');
        const data = await response.json();
        
        if (data.success && data.produtos && data.produtos.length > 0) {
          setProdutos(data.produtos);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos destacados:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProdutosDestaque();
  }, []);

  // Usar produtos da API se disponíveis, senão usar fallback
  const produtosExibir = produtos.length > 0 
    ? produtos.map(p => ({
        name: p.nome,
        image: p.imagem?.href || '/images/placeholder.png',
        id: p._id
      }))
    : produtosFallback.map(p => ({ ...p, id: '' }));

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <h2
        className="text-center text-[var(--color-fonte-100)] pb-8 text-2xl"
        style={{ fontFamily: "var(--fonte-secundaria)" }}
      >
        ALGUNS DOS NOSSOS PRODUTOS
      </h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-avocado-600)]"></div>
        </div>
      ) : (
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={3}
            loop={produtosExibir.length > 3}
            autoplay={{ delay: 3000 }}
            pagination={{ 
              clickable: true,
            }}
            breakpoints={{
              100: {
                slidesPerView: 1,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
            }}
            className="produtos-swiper"
          >
            {produtosExibir.map((item, index) => (
              <SwiperSlide key={item.id || index}>
                <Link href={item.id ? `/produtos/${item.id}` : '/produtos'}>
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="relative w-full aspect-square">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        quality={80}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-4 text-center font-semibold text-lg text-gray-800">
                      {item.name}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      <style jsx global>{`
        .produtos-swiper {
          padding-bottom: 3rem !important;
        }
        .produtos-swiper .swiper-pagination {
          bottom: 0 !important;
        }
        .produtos-swiper .swiper-pagination-bullet {
          background: var(--color-avocado-600, #4ade80);
          opacity: 0.5;
        }
        .produtos-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
