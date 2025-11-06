'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-4 md:mb-6">
            ALGUNS DOS NOSSOS PRODUTOS
          </p>
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)] px-4"
            style={{ fontFamily: "var(--fonte-secundaria)" }}
          >
            Conheça nossos produtos em destaque
          </h2>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-avocado-600)]"></div>
        </div>
      </div>
    );
  }

  if (produtos.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white pt-12 md:pt-16 pb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-4 md:mb-6">
            ALGUNS DOS NOSSOS PRODUTOS
          </p>
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)] px-4"
            style={{ fontFamily: "var(--fonte-secundaria)" }}
          >
            Conheça nossos produtos em destaque
          </h2>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            loop={produtos.length > 3}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              bulletClass: 'swiper-pagination-bullet-custom',
              bulletActiveClass: 'swiper-pagination-bullet-active-custom'
            }}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="!pb-16"
          >
            {produtos.map((produto) => (
              <SwiperSlide key={produto._id} className="!h-auto">
                <Link 
                  href={`/produtos/${produto._id}`}
                  className="group block h-full"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[var(--color-avocado-200)] transform hover:-translate-y-2 h-full flex flex-col">
                    {/* Imagem do Produto */}
                    <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <Image
                        src={produto.imagem?.href || '/images/placeholder.png'}
                        alt={produto.imagem?.alt || produto.nome}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        quality={90}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Badge Destaque */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold rounded-full shadow-xl backdrop-blur-sm border border-yellow-300/50">
                          ⭐ DESTAQUE
                        </span>
                      </div>
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[var(--color-avocado-600)] transition-colors">
                        {produto.nome}
                      </h3>
                      
                      <div className="mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Preço</p>
                            <p className="text-2xl font-bold text-[var(--color-avocado-600)]">
                              R$ {produto.preco?.valor?.toFixed(2).replace(".", ",") || "0,00"}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500 font-medium">
                            / {produto.preco?.tipo || 'UN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Botões de Navegação Customizados */}
          <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 -translate-x-6 hidden md:flex">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 translate-x-6 hidden md:flex">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Estilos Customizados */}
        <style jsx global>{`
          .swiper-pagination {
            position: relative !important;
            bottom: auto !important;
            margin-top: 2rem !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 8px !important;
          }

          .swiper-pagination-bullet-custom {
            width: 12px !important;
            height: 12px !important;
            background: #d1d5db !important;
            opacity: 1 !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            margin: 0 4px !important;
          }

          .swiper-pagination-bullet-active-custom {
            background: var(--color-avocado-600, #4ade80) !important;
            width: 32px !important;
            border-radius: 6px !important;
            transform: scale(1) !important;
          }

          .swiper-button-prev-custom::after,
          .swiper-button-next-custom::after {
            display: none !important;
          }

          .swiper-button-prev-custom.swiper-button-disabled,
          .swiper-button-next-custom.swiper-button-disabled {
            opacity: 0.3 !important;
            cursor: not-allowed !important;
          }

          @media (max-width: 768px) {
            .swiper-button-prev-custom,
            .swiper-button-next-custom {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
