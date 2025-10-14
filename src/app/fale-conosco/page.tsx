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
                <section className="py-[4.45rem]">
                    <div className="text-center">
                    <p className="max-[600px]:text-[0.8rem] text-[var(--color-alavaco-100)] text-[1rem] uppercase font-bold">entre em contato</p>
                        <h3 
                            className="max-[600px]:text-[1.6rem] pt-[20px] pb-[50px] max-[600px]:pb-[1rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                            style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                estamos prontos para te entender</h3>
                                <p className="max-[600px]:text-[0.9rem] pb-[30px] text-[var(--color-alavaco-100)] font-semibold text-[17px]">Escolha a sua forma de contato:</p>

                        <nav >
                        <ul className="flex justify-center gap-4">
                                <li className="uppercase ">
                                    <Link href="https://api.whatsapp.com/send?phone=551636151947&text=Oi%2C%20tudo%20bem%3F%20Quero%20fazer%20um%20pedido%20com%20voc%C3%AAs%20da%20Padaria%20Para%C3%ADba%21" target="_blank" className="flex flex-row items-center gap-[5px] bg-[#099700] px-[1rem] py-[0.75rem] text-[#ffffff]">
                                        <Image
                                            src={whatsFale}
                                            alt="Ícone do WhatsApp"
                                            width={20}
                                            height={20}
                                        />
                                        whatsapp
                                    </Link>
                                </li>
                                <li className="uppercase">
                                    <Link href="tel:+551636151947" className="flex flex-row items-center gap-[5px] bg-[#099700] px-[1rem] py-[0.75rem]">
                                        <Image
                                            src={telFale}
                                            alt="Ícone do WhatsApp"
                                            width={20}
                                            height={20}
                                        />
                                        ligar agora
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </section>

                <section>
                <address className="bg-[#322922] text-[#FFFFFF]">
                    <ul className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10 py-5 px-4 text-center">
                    <li className="flex items-center gap-2">
                        <Image
                        src={telFale}
                        alt="Ícone do WhatsApp"
                        width={20}
                        height={20}
                        />
                        (16) 3615-1947
                    </li>
                    <li className="flex items-center gap-2">
                        <Image
                        src={telFale}
                        alt="Ícone do WhatsApp"
                        width={20}
                        height={20}
                        />
                        padariaparaiba@gmail.com
                    </li>
                    <li className="flex items-center gap-2 text-sm md:text-base max-w-sm md:max-w-full">
                        <Image
                        src={telFale}
                        alt="Ícone do WhatsApp"
                        width={20}
                        height={20}
                        />
                        Av. Ernesto Guevara Lã Serna, 72 - Jardim Heitor Rigon, Ribeirão Preto - SP
                    </li>
                    </ul>
                </address>
                </section>


                <section className="grid grid-cols-2 gap-[50px] max-[650px]:grid-cols-1 items-center">
                    <figure className="w-full h-auto justify-self-center relative max-[600px]:w-full">
                        <Image
                            src="/images/fundo.png"
                            alt="Produtos da Padaria Paraíba"
                            width={500}
                            height={500}
                            className="w-full h-auto object-cover max-[600px]:h-auto"
                        />
                    </figure>

                    <article className="justify-self-center mr-[80px] max-[600px]:mr-0 max-[600px]:w-[80%]">
                        <h3 
                            className="max-[600px]:text-[1.6rem] pt-[20px] pb-[50px] max-[600px]:pb-[1rem] text-4xl font-normal text-[var(--color-fonte-100)]"
                            style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                informações sobre encomendas
                        </h3>
                        <ul>
                            <li className="flex gap-2">
                                <Image
                                    src="/images/certinho.svg"
                                    alt="Ícone do WhatsApp"
                                    width={20}
                                    height={20}
                                />
                                <p>Aceitamos encomendas de todos os itens da padaria, mas nossos campeões de pedidos são bolos personalizados, baguetes crocantes e massas doces irresistíveis.</p>
                            </li>
                            <li className="flex gap-2">
                                <Image
                                    src="/images/certinho.svg"
                                    alt="Ícone do WhatsApp"
                                    width={20}
                                    height={20}
                                />
                                <p>Para garantir a qualidade e o frescor, pedimos que as encomendas sejam feitas com pelo menos 24 horas de antecedência. Para bolos personalizados e pedidos maiores, consulte nossos prazos!</p>
                            </li>
                            <li className="flex gap-2 mb-7">
                                <Image
                                    src="/images/certinho.svg"
                                    alt="Ícone do WhatsApp"
                                    width={20}
                                    height={20}
                                />
                                <p>Você pode retirar diretamente na nossa padaria ou verificar a disponibilidade de entrega para sua região.</p>
                            </li>
                        </ul>
                    </article>
                </section>

                
            </main>

            <Footer />
        </>
    )
}

export default FaleConosco;