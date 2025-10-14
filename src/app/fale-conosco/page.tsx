"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";
import Image from 'next/image';
import whatsFale from "../../assets/images/whatsFale.svg";
import telFale from "../../assets/images/teleFale.svg";

function FaleConosco() {
    return(
        <>
            <Header />

            <main>
                <section className="py-[4.45rem] px-4">
                    <div className="text-center max-w-6xl mx-auto">
                        <p className="max-[600px]:text-[0.8rem] text-[var(--color-alavaco-100)] text-[1rem] uppercase font-bold">entre em contato</p>
                        <h3 
                            className="max-[600px]:text-[1.6rem] pt-[20px] pb-[50px] max-[600px]:pb-[1rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                            style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                estamos prontos para te atender</h3>
                        <p className="max-[600px]:text-[0.9rem] pb-[30px] text-[var(--color-alavaco-100)] font-semibold text-[17px]">Escolha a sua forma de contato:</p>

                        <nav>
                            <ul className="flex flex-wrap justify-center gap-4">
                                <li className="uppercase">
                                    <Link 
                                        href="https://api.whatsapp.com/send?phone=551636151947&text=Oi%2C%20tudo%20bem%3F%20Quero%20fazer%20um%20pedido%20com%20voc%C3%AAs%20da%20Padaria%20Para%C3%ADba%21" 
                                        target="_blank" 
                                        className="flex flex-row items-center gap-[8px] bg-[#25D366] hover:bg-[#1da851] transition-colors px-[1.5rem] py-[0.875rem] text-[#ffffff] rounded-lg shadow-md hover:shadow-lg font-semibold text-sm"
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
                                
                                <li className="uppercase">
                                    <Link 
                                        href="tel:+551636151947" 
                                        className="flex flex-row items-center gap-[8px] bg-[#B69B4C] hover:bg-[#9d8540] transition-colors px-[1.5rem] py-[0.875rem] text-[#ffffff] rounded-lg shadow-md hover:shadow-lg font-semibold text-sm"
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

                                <li className="uppercase">
                                    <Link 
                                        href="/chat" 
                                        className="flex flex-row items-center gap-[8px] bg-[#0084FF] hover:bg-[#0066cc] transition-colors px-[1.5rem] py-[0.875rem] text-[#ffffff] rounded-lg shadow-md hover:shadow-lg font-semibold text-sm"
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

                                <li className="uppercase">
                                    <a 
                                        href="mailto:padariaparaiba@gmail.com" 
                                        className="flex flex-row items-center gap-[8px] bg-[#EA4335] hover:bg-[#c93326] transition-colors px-[1.5rem] py-[0.875rem] text-[#ffffff] rounded-lg shadow-md hover:shadow-lg font-semibold text-sm"
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
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-500 rounded-full p-2">
                                        <Image
                                            src="/images/icone_chat.svg"
                                            alt="Chat"
                                            width={20}
                                            height={20}
                                            className="brightness-0 invert"
                                        />
                                    </div>
                                    <h4 className="font-bold text-blue-900">Chat Online</h4>
                                </div>
                                <p className="text-sm text-blue-800">
                                    💬 Converse conosco pelo chat do site!
                                </p>
                                <p className="text-sm text-blue-700 mt-2">
                                    <strong>Atendimento:</strong><br />
                                    Segunda a Sábado: 6h às 19h<br />
                                    Domingo: 6h às 12h
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-[#25D366] rounded-full p-2">
                                        <Image
                                            src={whatsFale}
                                            alt="WhatsApp"
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                    <h4 className="font-bold text-green-900">WhatsApp & Telefone</h4>
                                </div>
                                <p className="text-sm text-green-800">
                                    📱 Fale diretamente conosco!
                                </p>
                                <p className="text-sm text-green-700 mt-2">
                                    <strong>Disponível:</strong><br />
                                    Segunda a Sábado: 6h às 19h<br />
                                    Domingo: 6h às 12h
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <address className="bg-[#322922] text-[#FFFFFF]">
                        <div className="max-w-6xl mx-auto py-8 px-4">
                            <h3 className="text-center text-2xl font-semibold mb-6 text-[#B69B4C]" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                Nossa Localização
                            </h3>
                            <ul className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-center">
                                <li className="flex items-center gap-3">
                                    <div className="bg-[#B69B4C] rounded-full p-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                    </div>
                                    <span>(16) 3615-1947</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-[#B69B4C] rounded-full p-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                    <span>padariaparaiba@gmail.com</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm md:text-base max-w-sm md:max-w-md">
                                    <div className="bg-[#B69B4C] rounded-full p-2 flex-shrink-0">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span>Av. Ernesto Guevara Lã Serna, 72 - Jardim Heitor Rigon, Ribeirão Preto - SP</span>
                                </li>
                            </ul>
                        </div>
                    </address>
                </section>


                <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <figure className="w-full h-auto">
                            <Image
                                src="/images/fundo.png"
                                alt="Produtos da Padaria Paraíba"
                                width={500}
                                height={500}
                                className="w-full h-auto object-cover rounded-lg shadow-lg"
                            />
                        </figure>

                        <article className="space-y-6">
                            <h3 
                                className="text-3xl md:text-4xl font-normal text-[var(--color-fonte-100)]"
                                style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                    informações sobre encomendas
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <Image
                                            src="/images/certinho.svg"
                                            alt="Check"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        Aceitamos encomendas de todos os itens da padaria, mas nossos <strong>campeões de pedidos</strong> são bolos personalizados, baguetes crocantes e massas doces irresistíveis.
                                    </p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <Image
                                            src="/images/certinho.svg"
                                            alt="Check"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        Para garantir a qualidade e o frescor, pedimos que as encomendas sejam feitas com <strong>pelo menos 24 horas de antecedência</strong>. Para bolos personalizados e pedidos maiores, consulte nossos prazos!
                                    </p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <Image
                                            src="/images/certinho.svg"
                                            alt="Check"
                                            width={24}
                                            height={24}
                                        />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        Você pode <strong>retirar diretamente</strong> na nossa padaria ou verificar a disponibilidade de entrega para sua região.
                                    </p>
                                </li>
                            </ul>

                            <div className="mt-8 p-5 bg-yellow-50 border-l-4 border-[#B69B4C] rounded-r-lg">
                                <p className="text-sm text-gray-800">
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