import Image from "next/image";
import Link from "next/link";

function SectionTexImg() {
    return (
        <section aria-labelledby="sobre-padaria" className="max-[1190px]:flex-col flex justify-center gap-[6rem] items-center">
            
            <article className="max-[1190px]:py-5 max-[1190px]:px-5 w-[34rem] max-[1190px]:w-full max-[1190px]:flex max-[1190px]:flex-col max-[1190px]:items-center">
                <p className="max-[600px]:text-[0.8rem] text-[var(--color-alavaco-100)] text-[1rem] uppercase font-bold">Conheça a Padaria Paraíba</p>
                <h2 
                    className="max-[600px]:text-[1.5rem] max-[600px]:py-6 pt-[1rem] pb-[0.68rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                >
                    Sabor e tradição em cada um de nossos produtos
                </h2>
                <p className="max-[600px]:text-[0.9rem] pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">
                    Na Panificadora Paraíba, desde 2016, unimos tradição e qualidade para oferecer pães e doces feitos com carinho. O que começou como um sonho de pai e filha se tornou um ponto de encontro querido pelos clientes. Crescemos, inovamos, mas sem perder nossa essência: ingredientes selecionados e o sabor de sempre. Seja bem-vindo ao nosso mundo de aromas e sabores!</p>
                
                <div className="pt-7 flex gap-5">
                    <Link href="/" className="max-[600px]:text-[0.9rem] text-center uppercase bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] py-4 px-5 font-bold rounded-lg">ver produtos</Link>
                    <Link href="/" className="max-[600px]:text-[0.9rem] uppercase bg-[var(--background)] hover:bg-[var(--background2)] py-4 px-5 font-bold border-2 border-black rounded-lg">nossa história</Link>
                </div>
            </article>

            <figure className="relative w-100 h-120 max-[600px]:w-[90%] max-[600px]:h-120">
            <Image
                src="/images/imagemsectionprin.png"
                alt="Produtos da Padaria Paraíba"
                layout="fill"
            />
            </figure>

        </section>
    )
}

export default SectionTexImg;