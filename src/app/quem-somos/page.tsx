'use client';

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function PaginaQuemSomos() {
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

    const stats = [
        { number: "8+", label: "Anos de Tradição" },
        { number: "1000+", label: "Clientes Satisfeitos" },
        { number: "50+", label: "Produtos Artesanais" },
        { number: "365", label: "Dias Frescos" },
    ];

    const valores = [
        {
            icon: "🥖",
            title: "Qualidade",
            description: "Selecionamos os melhores ingredientes para garantir sabor e frescor em cada produto."
        },
        {
            icon: "❤️",
            title: "Tradição",
            description: "Receitas passadas de geração em geração, mantendo o sabor autêntico da nossa família."
        },
        {
            icon: "🤝",
            title: "Compromisso",
            description: "Dedicação total aos nossos clientes, sempre com respeito e atenção especial."
        },
        {
            icon: "✨",
            title: "Inovação",
            description: "Buscamos constantemente novas receitas e técnicas para surpreender você."
        },
    ];

    const timeline = [
        { year: "2016", title: "O Início", description: "Edilson e Rafaela abrem a primeira unidade com paixão e determinação." },
        { year: "2018", title: "Crescimento", description: "Ampliamos nosso cardápio e conquistamos a confiança da comunidade." },
        { year: "2020", title: "Adaptação", description: "Superamos desafios e nos reinventamos, sempre priorizando qualidade." },
        { year: "2024", title: "Hoje", description: "Seguimos crescendo, inovando e espalhando sabor e alegria!" },
    ];

    return (
        <>
            <Header />

            <main className="bg-gradient-to-b from-[var(--cor-main)] to-[#f9f9f9]">
                
                {/* Hero Section */}
                <section 
                    id="hero"
                    ref={(el) => { sectionsRef.current['hero'] = el; }}
                    className={`relative pt-20 md:pt-24 lg:pt-32 pb-12 md:pb-16 lg:pb-20 overflow-hidden transition-all duration-1000 ${
                        isVisible['hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-avocado-600)]/10 via-transparent to-[var(--color-avocado-600)]/10"></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-3 md:mb-4">
                            Bem-vindo à Padaria Paraíba
                        </p>
                        <h1 
                            className="text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-[var(--color-fonte-100)] mb-4 md:mb-6 px-4"
                            style={{ fontFamily: "var(--fonte-secundaria)" }}
                        >
                            Nossa História
                        </h1>
                        <p className="text-base md:text-lg lg:text-xl text-[var(--color-alavaco-100)] max-w-3xl mx-auto px-4">
                            De um sonho familiar a uma tradição que aquece corações
                        </p>
                    </div>
                </section>

                {/* História Principal */}
                <section 
                    id="historia"
                    ref={(el) => { sectionsRef.current['historia'] = el; }}
                    className={`py-12 md:py-16 lg:py-20 transition-all duration-1000 delay-200 ${
                        isVisible['historia'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className="space-y-4 md:space-y-6">
                                <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider">
                                    Nossa Jornada
                                </p>
                                <h2 
                                    className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)]"
                                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                                >
                                    Uma história de paixão e dedicação
                                </h2>
                                <div className="space-y-3 md:space-y-4 text-[var(--color-alavaco-100)] text-sm md:text-base">
                                    <p className="leading-relaxed">
                                        Nossa história começou em <strong>2016</strong>, quando <strong>Edilson e Rafaela</strong>, pai e filha, transformaram um sonho em realidade. Com paixão pela panificação e compromisso com a qualidade, abriram uma pequena padaria para oferecer produtos frescos e saborosos, sempre feitos com carinho.
                                    </p>
                                    <p className="leading-relaxed">
                                        Desde o primeiro dia, conquistamos algo especial: a confiança e o carinho dos nossos clientes. Com dedicação, cada pão quentinho e doce artesanal carrega a tradição e o cuidado que nos definem.
                                    </p>
                                    <p className="leading-relaxed">
                                        Com o tempo, crescemos, inovamos e ampliamos nosso cardápio, sem perder nossa essência. Seguimos selecionando os melhores ingredientes e mantendo o toque especial que torna cada fornada única.
                                    </p>
                                    <p className="leading-relaxed font-semibold">
                                        Hoje, a Panificadora Paraíba é mais que uma padaria – é um ponto de encontro, um lugar onde tradição e sabor criam momentos inesquecíveis. Seja bem-vindo à nossa história!
                                    </p>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-2xl md:rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src="/images/imagemsectionsec.png"
                                        alt="Produtos da Padaria Paraíba"
                                        width={600}
                                        height={700}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Estatísticas */}
                <section 
                    id="stats"
                    ref={(el) => { sectionsRef.current['stats'] = el; }}
                    className={`py-12 md:py-14 lg:py-16 px-4 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] transition-all duration-1000 delay-300 ${
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

                {/* Timeline */}
                <section 
                    id="timeline"
                    ref={(el) => { sectionsRef.current['timeline'] = el; }}
                    className={`py-12 md:py-16 lg:py-20 transition-all duration-1000 delay-400 ${
                        isVisible['timeline'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-8 md:mb-12 lg:mb-16">
                            <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-2 md:mb-4">
                                Nossa Evolução
                            </p>
                            <h2 
                                className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)] px-4"
                                style={{ fontFamily: "var(--fonte-secundaria)" }}
                            >
                                Uma jornada de crescimento
                            </h2>
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <div className="relative">
                                <div className="absolute left-6 md:left-8 lg:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] transform md:-translate-x-1/2"></div>
                                {timeline.map((item, index) => (
                                    <div 
                                        key={index}
                                        className={`relative mb-8 md:mb-12 ${index % 2 === 0 ? 'md:pr-1/2 md:pr-8' : 'md:ml-1/2 md:pl-8'}`}
                                    >
                                        <div className="flex items-start gap-4 md:gap-6">
                                            <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg">
                                                {item.year}
                                            </div>
                                            <div className="flex-1 bg-white p-4 md:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 text-center">
                                                <h3 className="text-lg md:text-xl font-bold text-[var(--color-fonte-100)] mb-2">{item.title}</h3>
                                                <p className="text-sm md:text-base text-[var(--color-alavaco-100)]">{item.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Valores */}
                <section 
                    id="valores"
                    ref={(el) => { sectionsRef.current['valores'] = el; }}
                    className={`py-12 md:py-16 lg:py-20 bg-gray-50 transition-all duration-1000 delay-500 ${
                        isVisible['valores'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-8 md:mb-12 lg:mb-16">
                            <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-2 md:mb-4">
                                O que nos move
                            </p>
                            <h2 
                                className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)] px-4"
                                style={{ fontFamily: "var(--fonte-secundaria)" }}
                            >
                                Nossos Valores
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                            {valores.map((valor, index) => (
                                <div 
                                    key={index}
                                    className="bg-white p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-center"
                                >
                                    <div className="text-4xl md:text-5xl mb-3 md:mb-4">{valor.icon}</div>
                                    <h3 className="text-lg md:text-xl font-bold text-[var(--color-fonte-100)] mb-2 md:mb-3">{valor.title}</h3>
                                    <p className="text-[var(--color-alavaco-100)] text-xs md:text-sm leading-relaxed">{valor.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Missão */}
                <section 
                    id="missao"
                    ref={(el) => { sectionsRef.current['missao'] = el; }}
                    className={`py-12 md:py-16 lg:py-20 transition-all duration-1000 delay-600 ${
                        isVisible['missao'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className="relative group order-2 md:order-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-2xl md:rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src="/images/imagem3.png"
                                        alt="Produtos da Padaria Paraíba"
                                        width={600}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-6 order-1 md:order-2">
                                <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider">
                                    Nossa Missão
                                </p>
                                <h2 
                                    className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[var(--color-fonte-100)]"
                                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                                >
                                    Receitas da nossa família para a sua casa
                                </h2>
                                <div className="space-y-3 md:space-y-4 text-sm md:text-base text-[var(--color-alavaco-100)]">
                                    <p className="leading-relaxed">
                                        Venha conhecer os sabores da Panificadora Paraíba! Cada pão, bolo e doce é feito com ingredientes selecionados e muito carinho, garantindo sempre frescor e qualidade. Do café da manhã ao lanche da tarde, temos delícias para todos os momentos do seu dia.
                                    </p>
                                    <p className="leading-relaxed">
                                        Experimente nossas especialidades e sinta o sabor da tradição em cada mordida. Estamos esperando por você!
                                    </p>
                                </div>
                                <div className="pt-4 md:pt-6">
                                    <Link 
                                        href="/produtos" 
                                        className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                                    >
                                        Conheça Nossos Produtos
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section 
                    id="cta"
                    ref={(el) => { sectionsRef.current['cta'] = el; }}
                    className={`py-12 md:py-16 lg:py-20 px-4 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] transition-all duration-1000 delay-700 ${
                        isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="container mx-auto text-center">
                        <h2 
                            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 md:mb-6 px-4"
                            style={{ fontFamily: "var(--fonte-secundaria)" }}
                        >
                            Venha nos visitar!
                        </h2>
                        <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
                            Estamos prontos para recebê-lo com o melhor da nossa tradição e sabor
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                            <Link 
                                href="/produtos" 
                                className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-white hover:border-[var(--color-avocado-500)]"
                            >
                                Ver Produtos
                            </Link>
                            <Link 
                                href="/fale-conosco" 
                                className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-white hover:border-[var(--color-avocado-500)]"
                            >
                                Fale Conosco
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

export default PaginaQuemSomos;