'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';
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
  const paginationRef = useRef<HTMLDivElement>(null);

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
        slug: p.slug
      }))
    : produtosFallback.map(p => ({ ...p, slug: '' }));

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .swiper-pagination-produtos {
          position: relative !important;
          bottom: auto !important;
          left: auto !important;
          width: 100% !important;
          margin-top: 1.5rem;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 8px;
        }
        .swiper-pagination-produtos .swiper-pagination-bullet {
          width: 12px !important;
          height: 12px !important;
          background: var(--color-avocado-600, #4ade80) !important;
          opacity: 0.5 !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }
        .swiper-pagination-produtos .swiper-pagination-bullet-active {
          opacity: 1 !important;
          background: var(--color-avocado-600, #4ade80) !important;
          transform: scale(1.2) !important;
        }
      `}} />
      <div className="w-full max-w-6xl mx-auto px-4 py-1">
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
          <>
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={3}
                loop={produtosExibir.length > 3}
                autoplay={{ delay: 3000 }}
                pagination={{ 
                  clickable: true,
                  dynamicBullets: false,
                  el: '.swiper-pagination-produtos',
                }}
                breakpoints={{
                  100: {
                    slidesPerView: 1,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                }}
                className="rounded-2xl !pb-0"
              >
              {produtosExibir.map((item, index) => (
                <SwiperSlide key={item.slug || index} className="!h-auto">
                  <Link href={item.slug ? `/produtos/${item.slug}` : '/produtos'} className="block h-full">
                    <div className="rounded-2xl overflow-hidden shadow-lg bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                      <div className="relative w-full aspect-square flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          quality={80}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4 text-center font-semibold text-lg text-gray-800 flex-shrink-0">
                        {item.name}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
              </Swiper>
              {/* Paginação customizada abaixo dos produtos */}
              {produtosExibir.length > 1 && (
                <div ref={paginationRef} className="swiper-pagination-produtos"></div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
