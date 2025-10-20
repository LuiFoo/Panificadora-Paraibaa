"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function FaleConoscoPage() {
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4">
          {/* Breadcrumb */}
          <BreadcrumbNav 
            items={[
              { label: "Início", href: "/", icon: "🏠", color: "blue" },
              { label: "Fale Conosco", icon: "📞", color: "green" }
            ]}
          />

          {/* Hero Section */}
          <section 
            id="hero"
            ref={(el) => { sectionsRef.current['hero'] = el; }}
            className={`transition-all duration-1000 ${
              isVisible['hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  📞 Fale Conosco
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Estamos prontos para te atender! Escolha a forma de contato que preferir.
                </p>

                {/* Botões de Contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Link 
                    href="https://api.whatsapp.com/send?phone=551636151947&text=Oi%2C%20tudo%20bem%3F%20Quero%20fazer%20um%20pedido%20com%20voc%C3%AAs%20da%20Padaria%20Para%C3%ADba%21" 
                    target="_blank" 
                    className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </Link>

                  <Link 
                    href="tel:+551636151947" 
                    className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Ligar Agora
                  </Link>

                  <Link 
                    href="/chat?from=fale-conosco" 
                    className="flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat Online
                  </Link>

                  <a 
                    href="mailto:padariaparaiba@gmail.com" 
                    className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    E-mail
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Informações de Contato */}
          <section 
            id="contato"
            ref={(el) => { sectionsRef.current['contato'] = el; }}
            className={`transition-all duration-1000 delay-300 ${
              isVisible['contato'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Horários de Atendimento */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  ⏰ Horários de Atendimento
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-green-500 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-green-900">Segunda a Sábado</h3>
                    </div>
                    <p className="text-green-800 font-semibold">06:00 às 19:00</p>
                    <p className="text-sm text-green-700">Atendimento completo</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-yellow-500 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-yellow-900">Domingo</h3>
                    </div>
                    <p className="text-yellow-800 font-semibold">06:00 às 12:00</p>
                    <p className="text-sm text-yellow-700">Atendimento limitado</p>
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🏪 Nossa Padaria
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 rounded-full p-2 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Endereço</h3>
                      <p className="text-gray-700">
                        Av. Ernesto Guevara Lã Serna, 72<br />
                        Jardim Heitor Rigon<br />
                        Ribeirão Preto - SP
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 rounded-full p-2 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Telefone</h3>
                      <a href="tel:+551636151947" className="text-blue-600 hover:text-blue-800 font-semibold">
                        (16) 3615-1947
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-red-500 rounded-full p-2 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">E-mail</h3>
                      <a href="mailto:padariaparaiba@gmail.com" className="text-blue-600 hover:text-blue-800 font-semibold">
                        padariaparaiba@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção de Encomendas */}
          <section 
            id="encomendas"
            ref={(el) => { sectionsRef.current['encomendas'] = el; }}
            className={`transition-all duration-1000 delay-500 ${
              isVisible['encomendas'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                🎂 Informações sobre Encomendas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    📋 Como Funciona
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="bg-green-500 rounded-full p-2 mt-1">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Produtos Disponíveis</h4>
                        <p className="text-gray-700">
                          Aceitamos encomendas de todos os itens da padaria, especialmente bolos personalizados, baguetes e massas doces.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="bg-green-500 rounded-full p-2 mt-1">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Prazo de Antecedência</h4>
                        <p className="text-gray-700">
                          Pedidos devem ser feitos com pelo menos 24 horas de antecedência. Para bolos personalizados, consulte nossos prazos.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="bg-green-500 rounded-full p-2 mt-1">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Retirada e Entrega</h4>
                        <p className="text-gray-700">
                          Você pode retirar diretamente na padaria ou verificar a disponibilidade de entrega para sua região.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    💡 Dicas Importantes
                  </h3>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-r-xl p-4 mb-4">
                    <p className="text-gray-800">
                      <strong className="text-yellow-700">💡 Dica:</strong> Use o <Link href="/chat?from=fale-conosco" className="text-blue-600 hover:underline font-semibold">chat online</Link> ou <a href="https://api.whatsapp.com/send?phone=551636151947" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-semibold">WhatsApp</a> para fazer sua encomenda rapidamente!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-bold text-blue-900 mb-2">🚀 Formas de Contato</h4>
                      <ul className="text-blue-800 space-y-1">
                        <li>• WhatsApp para pedidos rápidos</li>
                        <li>• Chat online para dúvidas</li>
                        <li>• Telefone para informações</li>
                        <li>• E-mail para orçamentos</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="font-bold text-green-900 mb-2">✅ Garantias</h4>
                      <ul className="text-green-800 space-y-1">
                        <li>• Produtos frescos e de qualidade</li>
                        <li>• Atendimento personalizado</li>
                        <li>• Preços competitivos</li>
                        <li>• Satisfação garantida</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer showMap={false} />
    </>
  );
}