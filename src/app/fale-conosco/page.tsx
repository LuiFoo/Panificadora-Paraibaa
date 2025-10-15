"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";
import Image from 'next/image';
import whatsFale from "../../assets/images/whatsFale.svg";
import telFale from "../../assets/images/teleFale.svg";
import { useEffect, useRef, useState } from "react";

function FaleConosco() {
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

    return(
        <>
            <Header />

            <main className="bg-gradient-to-b from-white to-gray-50">
                {/* Hero Section */}
                <section 
                    id="hero"
                    ref={(el) => { sectionsRef.current['hero'] = el; }}
                    className={`py-16 md:py-20 lg:py-24 px-4 transition-all duration-1000 ${
                        isVisible['hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="text-center max-w-6xl mx-auto">
                        <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-3 md:mb-4">
                            entre em contato
                        </p>
                        <h1 
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-fonte-100)] mb-4 md:mb-6"
                            style={{ fontFamily: "var(--fonte-secundaria)" }}
                        >
                            Estamos prontos para te atender
                        </h1>
                        <p className="text-base md:text-lg text-[var(--color-alavaco-100)] mb-8 md:mb-12">
                            Escolha a forma de contato que preferir. Estamos aqui para ajudar!
                        </p>

                        {/* Botões de Contato */}
                        <nav className="mb-12 md:mb-16">
                            <ul className="flex flex-wrap justify-center gap-3 md:gap-4">
                                <li>
                                    <Link 
                                        href="https://api.whatsapp.com/send?phone=551636151947&text=Oi%2C%20tudo%20bem%3F%20Quero%20fazer%20um%20pedido%20com%20voc%C3%AAs%20da%20Padaria%20Para%C3%ADba%21" 
                                        target="_blank" 
                                        className="flex flex-row items-center gap-2 bg-[#25D366] hover:bg-[#1da851] transition-all px-5 md:px-6 py-3 md:py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-semibold text-sm md:text-base transform hover:scale-105"
                                    >
                                        <Image
                                            src={whatsFale}
                                            alt="Ícone do WhatsApp"
                                            width={22}
                                            height={22}
                                        />
                                        WhatsApp
                                    </Link>
                                </li>
                                
                                <li>
                                    <Link 
                                        href="tel:+551636151947" 
                                        className="flex flex-row items-center gap-2 bg-[#B69B4C] hover:bg-[#9d8540] transition-all px-5 md:px-6 py-3 md:py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-semibold text-sm md:text-base transform hover:scale-105"
                                    >
                                        <Image
                                            src={telFale}
                                            alt="Ícone do Telefone"
                                            width={22}
                                            height={22}
                                        />
                                        Ligar Agora
                                    </Link>
                                </li>

                                <li>
                                    <Link 
                                        href="/chat" 
                                        className="flex flex-row items-center gap-2 bg-[#0084FF] hover:bg-[#0066cc] transition-all px-5 md:px-6 py-3 md:py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-semibold text-sm md:text-base transform hover:scale-105"
                                    >
                                        <Image
                                            src="/images/icone_chat.svg"
                                            alt="Ícone do Chat"
                                            width={22}
                                            height={22}
                                        />
                                        Chat Online
                                    </Link>
                                </li>

                                <li>
                                    <a 
                                        href="mailto:padariaparaiba@gmail.com" 
                                        className="flex flex-row items-center gap-2 bg-[#EA4335] hover:bg-[#c93326] transition-all px-5 md:px-6 py-3 md:py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-semibold text-sm md:text-base transform hover:scale-105"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        E-mail
                                    </a>
                                </li>
                            </ul>
                        </nav>

                        {/* Cards de horário de atendimento */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-500 rounded-full p-3">
                                        <Image
                                            src="/images/icone_chat.svg"
                                            alt="Chat"
                                            width={24}
                                            height={24}
                                            className="brightness-0 invert"
                                        />
                                    </div>
                                    <h4 className="font-bold text-blue-900 text-lg">Chat Online</h4>
                                </div>
                                <p className="text-sm md:text-base text-blue-800 mb-3">
                                    💬 Converse conosco pelo chat do site!
                                </p>
                                <div className="text-sm text-blue-700 bg-white/50 rounded-lg p-3">
                                    <strong>Atendimento:</strong><br />
                                    Segunda a Sábado: 6h às 19h<br />
                                    Domingo: 6h às 12h
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-[#25D366] rounded-full p-3">
                                        <Image
                                            src={whatsFale}
                                            alt="WhatsApp"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <h4 className="font-bold text-green-900 text-lg">WhatsApp & Telefone</h4>
                                </div>
                                <p className="text-sm md:text-base text-green-800 mb-3">
                                    📱 Fale diretamente conosco!
                                </p>
                                <div className="text-sm text-green-700 bg-white/50 rounded-lg p-3">
                                    <strong>Disponível:</strong><br />
                                    Segunda a Sábado: 6h às 19h<br />
                                    Domingo: 6h às 12h
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seção de Localização */}
                <section 
                    id="localizacao"
                    ref={(el) => { sectionsRef.current['localizacao'] = el; }}
                    className={`transition-all duration-1000 delay-300 ${
                        isVisible['localizacao'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <address className="bg-gradient-to-br from-[#322922] to-[#1a1614] text-[#FFFFFF]">
                        <div className="max-w-6xl mx-auto py-12 md:py-16 px-4">
                            <h3 className="text-center text-2xl md:text-3xl font-semibold mb-8 md:mb-12 text-[#B69B4C]" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                Nossa Localização
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
                                    <div className="bg-[#B69B4C] rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-lg">Telefone</p>
                                    <a href="tel:+551636151947" className="text-[#B69B4C] hover:text-[#d4b85e] transition-colors">
                                        (16) 3615-1947
                                    </a>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
                                    <div className="bg-[#B69B4C] rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-lg">E-mail</p>
                                    <a href="mailto:padariaparaiba@gmail.com" className="text-[#B69B4C] hover:text-[#d4b85e] transition-colors break-all">
                                        padariaparaiba@gmail.com
                                    </a>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all transform hover:scale-105">
                                    <div className="bg-[#B69B4C] rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-lg">Endereço</p>
                                    <p className="text-sm text-gray-300">
                                        Av. Ernesto Guevara Lã Serna, 72<br />
                                        Jardim Heitor Rigon<br />
                                        Ribeirão Preto - SP
                                    </p>
                                </div>
                            </div>
                        </div>
                    </address>
                </section>


                {/* Seção de Encomendas */}
                <section 
                    id="encomendas"
                    ref={(el) => { sectionsRef.current['encomendas'] = el; }}
                    className={`py-12 md:py-16 lg:py-20 px-4 bg-gradient-to-b from-white to-gray-50 transition-all duration-1000 delay-500 ${
                        isVisible['encomendas'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <figure className="w-full h-auto order-2 md:order-1">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src="/images/fundo.png"
                                        alt="Produtos da Padaria Paraíba"
                                        width={500}
                                        height={500}
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        </figure>

                        <article className="space-y-4 md:space-y-6 order-1 md:order-2">
                            <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider">
                                Como Funciona
                            </p>
                            <h3 
                                className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-fonte-100)]"
                                style={{ fontFamily: "var(--fonte-secundaria)" }}
                            >
                                Informações sobre encomendas
                            </h3>
                            
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 mt-1">
                                        <Image
                                            src="/images/certinho.svg"
                                            alt="Check"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                        Aceitamos encomendas de todos os itens da padaria, mas nossos <strong>campeões de pedidos</strong> são bolos personalizados, baguetes crocantes e massas doces irresistíveis.
                                    </p>
                                </li>
                                <li className="flex gap-3 items-start bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 mt-1">
                                        <Image
                                            src="/images/certinho.svg"
                                            alt="Check"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                        Para garantir a qualidade e o frescor, pedimos que as encomendas sejam feitas com <strong>pelo menos 24 horas de antecedência</strong>. Para bolos personalizados e pedidos maiores, consulte nossos prazos!
                                    </p>
                                </li>
                                <li className="flex gap-3 items-start bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 mt-1">
                                        <Image
                                            src="/images/certinho.svg"
                                            alt="Check"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                        Você pode <strong>retirar diretamente</strong> na nossa padaria ou verificar a disponibilidade de entrega para sua região.
                                    </p>
                                </li>
                            </ul>

                            <div className="mt-6 md:mt-8 p-4 md:p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-[#B69B4C] rounded-r-xl shadow-md">
                                <p className="text-sm md:text-base text-gray-800">
                                    <strong className="text-[#B69B4C]">💡 Dica:</strong> Use o <Link href="/chat" className="text-blue-600 hover:underline font-semibold">chat online</Link> ou <a href="https://api.whatsapp.com/send?phone=551636151947" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-semibold">WhatsApp</a> para fazer sua encomenda rapidamente!
                                </p>
                            </div>
                        </article>
                    </div>
                </section>

                
            </main>

            <Footer />
        </>
    )
}

export default FaleConosco;