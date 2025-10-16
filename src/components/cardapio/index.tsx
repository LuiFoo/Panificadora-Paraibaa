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
        <BolosDocesEspeciaisPage />
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Doces Individuais</h3>
            <p>- Doces deliciosos para saborear a qualquer momento do dia!</p>
        </article>
        <DocesIndividuaisPage />
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Pães Doces</h3>
            <p>- Pães doces fresquinhos, perfeitos para o café da manhã!</p>
        </article>
        <PaesDocesPage />
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Pães Salgados Especiais</h3>
            <p>- Pães salgados especiais, ideais para acompanhar suas refeições!</p>
        </article>
        <PaesSalgadosEspeciaisPage />
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Roscas e Pães Especiais</h3>
            <p>- Roscas e pães especiais, preparados com ingredientes selecionados!</p>
        </article>
        <RoscasPaesEspeciaisPage />
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Salgados Assados e Lanches</h3>
            <p>- Salgados assados e lanches, perfeitos para qualquer hora!</p>
        </article>
        <SalgadosAssadosLanchesPage/>
    </section>

    <section className="flex flex-col gap-5">
        <article className="flex flex-col gap-3">
            <h3>Sobremesas e Tortas</h3>
            <p>- Sobremesas e tortas deliciosas para adoçar seu dia!</p>
        </article>
        <SobremesasTortasPage/>
    </section>

</main>

    )
}

export default Cardapio;