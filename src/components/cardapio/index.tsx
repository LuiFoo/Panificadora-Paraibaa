import BolosDocesEspeciaisPage from "../produtos/bolos-doces-especiais";
import DocesIndividuaisPage from "../produtos/doces-individuais";
import PaesDocesPage from "../produtos/paes-doces";
import PaesSalgadosEspeciaisPage from "../produtos/paes-salgados-especiais";
import RoscasPaesEspeciaisPage from "../produtos/roscas-paes-especiais";
import SalgadosAssadosLanchesPage from "../produtos/salgados-assados-lanches";
import SobremesasTortasPage from "../produtos/sobremesas-tortas";

function Cardapio() {
    return(
<main className="flex flex-col gap-14">

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <BolosDocesEspeciaisPage /> {/* Componente para bolos e doces especiais */}
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <DocesIndividuaisPage /> {/* Componente para bolos e doces especiais */}
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <PaesDocesPage /> {/* Componente para bolos e doces especiais */}
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <PaesSalgadosEspeciaisPage /> {/* Componente para bolos e doces especiais */}
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <RoscasPaesEspeciaisPage /> {/* Componente para bolos e doces especiais */}
    </section>

    
    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <SalgadosAssadosLanchesPage/> {/* Componente para bolos e doces especiais */}
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Bolos e Doces Especiais</h3>
            <p>- Delicie-se com nossos bolos e doces especiais, preparados com carinho e os melhores ingredientes!</p>
        </article>
        <SobremesasTortasPage/> {/* Componente para bolos e doces especiais */}
    </section>


</main>

    )
}

export default Cardapio;