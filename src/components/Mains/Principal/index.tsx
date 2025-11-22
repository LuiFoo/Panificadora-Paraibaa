'use client';

import ImagensSection from "@/components/Footer/ImagensSection";
import SectionTexImg from "@/components/SectionTexImg";
import CategoriasSwiper from "@/components/Swiper";
import MenuCategoria from "@/components/MenuCategoria";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function MainPrincipal() {
    const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
    const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible((prev) => ({
                            ...prev,
                            [entry.target.id]: true,
                        }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        Object.values(sectionsRef.current).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const handleCategoriaClick = (categoria: string) => {
        window.location.href = `/produtos?categoria=${encodeURIComponent(categoria)}`;
    };

    const features = [
        {
            icon: "🥖",
            title: "Produtos Frescos",
            description: "Tudo feito diariamente com ingredientes selecionados"
        },
        {
            icon: "❤️",
            title: "Feito com Amor",
            description: "Receitas tradicionais passadas de geração em geração"
        },
        {
            icon: "⭐",
            title: "Qualidade Garantida",
            description: "Compromisso com excelência em cada produto"
        },
        {
            icon: "🚚",
            title: "Entrega Rápida",
            description: "Receba seus produtos fresquinhos em casa"
        }
    ];

    const stats = [
        { number: "8+", label: "Anos de Tradição" },
        { number: "50+", label: "Produtos Artesanais" },
        { number: "1000+", label: "Clientes Satisfeitos" },
        { number: "365", label: "Dias Frescos" },
    ];

    return(
        <main className="bg-gradient-to-b from-white to-gray-50">

          {/* Hero Section */}
          <section 
            id="hero"
            ref={(el) => { sectionsRef.current['hero'] = el; }}
            className="relative w-full h-120 max-[400px]:h-36 max-[500px]:h-45 max-[700px]:h-55 max-[1000px]:h-70 max-[1500px]:h-90" 
          > 
            <Image 
              src="/images/back-inicial.png" 
              alt="Hero Panificadora Paraíba" 
              fill
              className="object-cover"
              quality={100}
              priority
              sizes="100vw"
            />
          </section>

          {/* Features Section */}
          <section 
            id="features"
            ref={(el) => { sectionsRef.current['features'] = el; }}
            className={`py-12 md:py-16 lg:py-20 px-4 bg-white transition-all duration-1000 delay-200 ${
                isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="container mx-auto">
                <div className="text-center mb-8 md:mb-12 lg:mb-16">
                    <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-2 md:mb-4">
                        Por que escolher a Paraíba?
                    </p>
                    <h2 
                        className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)] px-4"
                        style={{ fontFamily: "var(--fonte-secundaria)" }}
                    >
                        O melhor para você e sua família
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <div 
                            key={index}
                            className="bg-white p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-center"
                        >
                            <div className="text-4xl md:text-5xl mb-3 md:mb-4">{feature.icon}</div>
                            <h3 className="text-lg md:text-xl font-bold text-[var(--color-fonte-100)] mb-2 md:mb-3">{feature.title}</h3>
                            <p className="text-[var(--color-alavaco-100)] text-xs md:text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          {/* Menu de Categorias e Swiper */}
          <section 
            id="produtos"
            ref={(el) => { sectionsRef.current['produtos'] = el; }}
            className={`pt-12 md:pt-16 lg:pt-20 bg-white transition-all duration-1000 delay-300 ${
                isVisible['produtos'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <MenuCategoria 
                categories={[
                  { id: "doces", nome: "Doces & Sobremesas", icon: "🍰" },
                  { id: "paes", nome: "Pães & Especiais", icon: "🥖" },
                  { id: "salgados", nome: "Salgados & Lanches", icon: "🥐" },
                  { id: "bebidas", nome: "Bebidas", icon: "🥤" },
                ]}
                variant="button"
                onCategoryClick={handleCategoriaClick}
              />
            </div>

            <CategoriasSwiper />
          </section>

          {/* Seção Sobre */}
          <SectionTexImg />

          {/* Estatísticas */}
          <section 
            id="stats"
            ref={(el) => { sectionsRef.current['stats'] = el; }}
            className={`py-12 md:py-14 lg:py-16 px-4 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] transition-all duration-1000 delay-400 ${
                isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {stats.map((stat, index) => (
                        <div 
                            key={index}
                            className="text-center text-white transform hover:scale-110 transition-transform duration-300"
                        >
                            <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">{stat.number}</div>
                            <div className="text-xs md:text-sm lg:text-base opacity-90 px-2">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          {/* Imagem de Destaque */}
          <ImagensSection />

          {/* CTA Final */}
          <section 
            id="cta"
            ref={(el) => { sectionsRef.current['cta'] = el; }}
            className={`py-12 md:py-16 lg:py-20 px-4 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 delay-500 ${
                isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="container mx-auto text-center">
                <h2 
                    className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)] mb-4 md:mb-6 px-4"
                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                >
                    Pronto para experimentar?
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-[var(--color-alavaco-100)] mb-6 md:mb-8 max-w-2xl mx-auto px-4">
                    Venha conhecer nossos produtos artesanais feitos com todo carinho e tradição
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                    <Link 
                        href="/produtos" 
                        className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                    >
                        Ver Cardápio Completo
                    </Link>
                    <Link 
                        href="/fale-conosco" 
                        className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                    >
                        Fale Conosco
                    </Link>
                </div>
            </div>
          </section>

        </main>
    )
}

export default MainPrincipal;
