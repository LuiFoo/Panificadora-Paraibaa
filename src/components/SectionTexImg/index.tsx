'use client';

import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function SectionTexImg() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section 
            ref={sectionRef}
            aria-labelledby="sobre-padaria" 
            className="pt-0 pb-20 bg-white max-[1190px]:flex-col flex justify-center gap-[6rem] items-center"
        >
            
            <article className={`max-[1190px]:py-5 max-[1190px]:px-5 w-[34rem] max-[1190px]:w-full max-[1190px]:flex max-[1190px]:flex-col max-[1190px]:items-center transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
                <p className="max-[600px]:text-[0.8rem] text-[var(--color-alavaco-100)] text-[1rem] uppercase font-bold">Conheça a Padaria Paraíba</p>
                <h2 
                    className="max-[600px]:text-[1.5rem] max-[600px]:py-6 pt-[1rem] pb-[0.68rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                >
                    Sabor e tradição em cada um de nossos produtos
                </h2>
                <p className="max-[600px]:text-[0.9rem] pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base leading-relaxed">
                    Na Panificadora Paraíba, desde 2016, unimos tradição e qualidade para oferecer pães e doces feitos com carinho. O que começou como um sonho de pai e filha se tornou um ponto de encontro querido pelos clientes. Crescemos, inovamos, mas sem perder nossa essência: ingredientes selecionados e o sabor de sempre. Seja bem-vindo ao nosso mundo de aromas e sabores!</p>
                
                <div className="pt-7 flex flex-col sm:flex-row gap-5">
                    <Link 
                        href="/produtos" 
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                    >
                        ver produtos
                    </Link>
                    <Link 
                        href="/quem-somos" 
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                    >
                        nossa história
                    </Link>
                </div>
            </article>

            <figure className={`relative w-100 h-120 max-[600px]:w-[90%] max-[600px]:h-120 transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-3xl blur-2xl opacity-20"></div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <OptimizedImage
                        src="/images/imagemsectionprin.png"
                        alt="Produtos da Padaria Paraíba"
                        width={500}
                        height={600}
                        quality={85}
                    />
                </div>
            </figure>

        </section>
    )
}

export default SectionTexImg;