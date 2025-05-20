import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

function PaginaQuemSomos() {
    return (
        <>
         <Header/>

        
        <main className="bg-[var(--cor-main)]">
            
            <section aria-labelledby="sobre-padaria" className="max-[600px]:pt-[3.5rem] pt-[7.5rem] flex max-[600px]:flex-col justify-center max-[600px]:gap-[2rem] gap-[6rem] items-center">
                
                <article className="w-[34rem] max-[600px]:w-85">
                <p className="max-[600px]:text-[0.8rem] text-[var(--color-alavaco-100)] text-[1rem] uppercase font-bold">Bem-vindo à Padaria PaRAIBA</p>
                <h2 
                    className="max-[600px]:text-[1.6rem] pt-[1rem] pb-[0.68rem] max-[600px]:pb-[1rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                >
                    conheça a nossa história
                </h2>
                <p className="max-[600px]:text-[0.9rem] pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">Nossa história começou em 2016, quando Edilson e Rafaela, pai e filha, transformaram um sonho em realidade. Com paixão pela panificação e compromisso com a qualidade, abriram uma pequena padaria para oferecer produtos frescos e saborosos, sempre feitos com carinho.</p>
                <p className="max-[600px]:text-[0.9rem] pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">Desde o primeiro dia, conquistamos algo especial: a confiança e o carinho dos nossos clientes. Com dedicação, cada pão quentinho e doce artesanal carrega a tradição e o cuidado que nos definem.</p>
                <p className="max-[600px]:text-[0.9rem] pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">Com o tempo, crescemos, inovamos e ampliamos nosso cardápio, sem perder nossa essência. Seguimos selecionando os melhores ingredientes e mantendo o toque especial que torna cada fornada única.</p>
                <p className="max-[600px]:text-[0.9rem] pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">Hoje, a Panificadora Paraíba é mais que uma padaria – é um ponto de encontro, um lugar onde tradição e sabor criam momentos inesquecíveis. Seja bem-vindo à nossa história!</p>
                

                </article>

                <figure className="relative w-100 h-120 max-[600px]:w-[90%] max-[600px]:h-120">
                <Image
                    src="/images/imagemsectionsec.png"
                    alt="Produtos da Padaria Paraíba"
                    layout="fill"
                />
                </figure>

            </section>

            <section aria-labelledby="sobre-padaria" className="max-[600px]:pt-[3.5rem] pt-[7.5rem] flex gap-[6rem] items-center max-[600px]:flex-col">
            
                <figure className="max-[600px]:hidden">
                    <Image
                        src="/images/imagem3.png"
                        alt="Produtos da Padaria Paraíba"
                        width={720} 
                        height={391.3} 
                    />
                </figure>


                <article className="w-[34rem] max-[600px]:w-85">
                <h3
                    className="max-[600px]:text-[1.6rem] max-[600px]:pt-[0] pt-[1rem] pb-[0.68rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                    style={{ fontFamily: "var(--fonte-secundaria)" }}
                >
                    receitas da nossa família para a sua casa
                </h3>
                <p className="pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">Venha conhecer os sabores da Panificadora Paraíba! Cada pão, bolo e doce é feito com ingredientes selecionados e muito carinho, garantindo sempre frescor e qualidade. Do café da manhã ao lanche da tarde, temos delícias para todos os momentos do seu dia.</p>
                <p className="pb-[1.25rem] text-[var(--color-alavaco-100)] font-semibold text-base">Experimente nossas especialidades e sinta o sabor da tradição em cada mordida. Estamos esperando por você!</p>
                
                <div className="pt-7 flex gap-8">
                    <Link href="/" className="mb-5 uppercase bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] py-[0.75rem] px-[1rem] font-bold rounded-lg">conheça nossos produtos</Link>
                
                </div>

                </article>



            </section>

        </main>


         <Footer />       
        </>

    )
}
export default PaginaQuemSomos;