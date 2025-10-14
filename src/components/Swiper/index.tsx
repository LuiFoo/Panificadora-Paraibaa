'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const cakeItems = [
  { name: 'Bolo Cenoura ', image: '/images/cenoura.png' },
  { name: 'Baguete pequeno', image: '/images/baguetePequeno.png' },
  { name: 'Baguete Grande', image: '/images/bagueteGrande.png' },
  { name: 'Forrozinho', image: '/images/forrozinho.png' },
  { name: 'Rosca de Chocolate', image: '/images/roscaChocolate.png' },
  { name: 'Filão', image: '/images/filao.png' },
  { name: 'Bolo Kinder Bueno', image: '/images/boloKinderBueno.png' },
  { name: 'Pao de Queijo', image: '/images/paoQueijo.png' }
];

export default function CategoriasSwiper() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <h2
        className="text-center text-[var(--color-fonte-100)] pb-8 text-2xl"
        style={{ fontFamily: "var(--fonte-secundaria)" }}
      >
        ALGUNS DOS NOSSOS PRODUTOS
      </h2>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={3} // valor padrão
        loop
        autoplay={{ delay: 3000 }}
        pagination={{ clickable: true }}
        breakpoints={{
          100: {
            slidesPerView: 1, // 1 slide por vez no mobile
          },
          768: {
            slidesPerView: 2, // 2 slides por vez em tablets
          },
          1024: {
            slidesPerView: 3, // 3 slides por vez em telas maiores (desktop)
          },
        }}
        className="rounded-2xl !pb-7"
      >
        {cakeItems.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="rounded-2xl overflow-hidden shadow bg-white mb-5">
              <div className="relative w-full h-64">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 text-center font-semibold text-lg">
                {item.name}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
