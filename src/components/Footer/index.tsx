"use client";

import Link from "next/link";

interface FooterProps {
  showMap?: boolean; // controla se o mapa aparece
}

function Footer({ showMap = true }: FooterProps) {
  return (
    <footer>
      {/* Mapa condicional */}
      {showMap && (
        <iframe
          title="Localização da Panificadora Paraíba no Google Maps"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14887.332009890566!2d-47.827383518174614!3d-21.11922302639198!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94b9951b9396d22d%3A0xd0bd2576f3107240!2sPanificadora%20Paraiba!5e0!3m2!1spt-BR!2sbr!4v1744143622485!5m2!1spt-BR!2sbr"
          className="w-full rounded-lg"
          height="425"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      )}

      <figure>
        <img
          src="/images/linha.png"
          alt="Produtos da Padaria Paraíba"
          className="w-full"
        />
        <figcaption className="sr-only">Linha de produtos da padaria</figcaption>
      </figure>

      <div className="flex flex-wrap max-[830px]:gap-2 max-[830px]:flex-col justify-between pt-24 px-23 max-[600px]:pt-10 max-[600px]:px-12">
        {/* Seção de Marca */}
        <section className="brand-section mb-6 md:mb-0" aria-labelledby="brand-title">
          <h2 id="brand-title" className="sr-only">Marca</h2>
          <img
            src="/images/logo.svg"
            alt="Logo da Padaria Paraíba"
            className="w-36 mb-4"
          />
          <p className="text-4 font-semibold max-w-70 mb-6">
            Receitas da nossa família para a sua casa.
          </p>
          <a
            href="https://instagram.com/panificadora.paraiba"
            target="_blank"
            aria-label="Siga-nos no Instagram"
            className="inline-block"
          >
            <img
              src="/images/logoInstagram.svg"
              alt="Instagram da padaria"
              className="w-12 h-12"
            />
          </a>
        </section>

        {/* Navegação */}
        <nav className="mb-6 md:mb-0" aria-labelledby="footer-navigation">
          <h2 id="footer-navigation" className="font-bold mb-3">Navegue</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <img src="/images/seta.svg" alt="Seta" />
              <Link href="/quem-somos" className="hover:underline">Quem Somos</Link>
            </li>
            <li className="flex items-center gap-2">
              <img src="/images/seta.svg" alt="Seta" />
              <Link href="/fale-conosco" className="hover:underline">Fale Conosco</Link>
            </li>
            <li className="flex items-center gap-2">
              <img src="/images/seta.svg" alt="Seta" />
              <Link href="/produtos" className="hover:underline">Produtos</Link>
            </li>
            <li className="flex items-center gap-2">
              <img src="/images/seta.svg" alt="Seta" />
              <Link href="https://maps.app.goo.gl/VUQhKXqCBWc1gQ8FA" className="hover:underline">Google Maps</Link>
            </li>
          </ul>
        </nav>

        {/* Funcionamento */}
        <section className="mb-6 md:mb-0" aria-labelledby="hours-heading">
          <h2 id="hours-heading" className="font-bold mb-3">Funcionamento</h2>
          <div className="flex items-center gap-2 mb-4">
            <img src="/images/padaria.svg" alt="Ícone de padaria" />
            <h3 className="text-base font-extrabold">Padaria</h3>
          </div>
          <p className="text-sm mb-2">Segunda a sábado: 06h às 19h</p>
          <p className="text-sm">Domingo: 06h às 12h</p>
        </section>

        {/* Contato */}
        <address className="not-italic" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="font-bold mb-3">Contato</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <img src="/images/telefone.svg" alt="Telefone" />
              <a href="tel:+551636151947" className="hover:underline">(16) 3615-1947</a>
            </li>
            <li className="flex items-center gap-2">
              <img src="/images/gmail.svg" alt="Email" />
              <a href="mailto:padariaparaiba@gmail.com" className="hover:underline">
                padariaparaiba@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2 max-w-78">
              <img src="/images/setaNavegacao.svg" alt="Endereço" />
              <p>
                Av. Ernesto Guevara Lã Serna, 72 - Jardim Heitor Rigon, Ribeirão Preto - SP
              </p>
            </li>
          </ul>

          <a
            href="https://api.whatsapp.com/send?phone=551636151947&text=Oi%2C%20tudo%20bem%3F%20Quero%20fazer%20um%20pedido%20com%20voc%C3%AAs%20da%20Padaria%20Para%C3%ADba%21"
            target="_blank"
            aria-label="Contato via WhatsApp"
            className="pt-12 flex justify-end"
          >
            <img
              src="/images/botaoWhatsaap.svg"
              alt="Botão do WhatsApp"
              className="w-20"
            />
          </a>
        </address>
      </div>

      <h4 className="text-center text-base font-bold pt-6 pb-2 max-[600px]:text-[0.7rem]">
        ©2025. Todos os direitos reservados. Blue Bird.
      </h4>
    </footer>
  );
}

export default Footer;
