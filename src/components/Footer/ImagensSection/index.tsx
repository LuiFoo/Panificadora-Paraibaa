import Image from "next/image";

function ImagensSection() {

    return(
          <section className=" mt-15 relative w-full h-120 max-[400px]:h-36 max-[500px]:h-45 max-[700px]:h-55 max-[1000px]:h-70 max-[1500px]:h-90"> 
            <Image 
              src="/images/back-inicial2.png" 
              alt="Produtos da Panificadora Paraíba" 
              fill
              className="object-cover"
              quality={100}
              sizes="100vw"
            />
          </section>

    )
}

export default ImagensSection;