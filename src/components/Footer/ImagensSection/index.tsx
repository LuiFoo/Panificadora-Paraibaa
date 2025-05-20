import Image from "next/image";

function ImagensSection() {
    const images = [
        { src:"/images/conjunto/image1.png", alt:"Logo"},
        { src:"/images/conjunto/image2.png", alt:"Logo"},
        { src:"/images/conjunto/image1.png", alt:"Logo"},
        { src:"/images/conjunto/image2.png", alt:"Logo"},
        { src:"/images/conjunto/image2.png", alt:"Logo"},
        { src:"/images/conjunto/image1.png", alt:"Logo"},
        { src:"/images/conjunto/image2.png", alt:"Logo"},
        { src:"/images/conjunto/image1.png", alt:"Logo"},
        
    ]

    return(
        <div className="mt-12 flex-wrap w-full flex">
            {images.map((item, index) => (
            <Image
                key={index}
                src={item.src} // Supondo que cada item tenha um `src`
                alt={item.alt || "Imagem"}
                width={0}
                height={0}
                sizes="25vw"
                className="w-1/4 object-cover"
            />
            ))}


        </div>

    )
}

export default ImagensSection;