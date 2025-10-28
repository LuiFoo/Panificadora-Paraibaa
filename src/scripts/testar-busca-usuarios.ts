import clientPromise from "@/modules/mongodb";

async function testarBuscaUsuarios() {
  try {
    console.log("🔍 === TESTE DE BUSCA DE USUÁRIOS ===");
    
    const client = await clientPromise;
    const db = client.db("paraiba");
    const usuariosCollection = db.collection("users");

    // Verificar quantos usuários existem no total
    const totalUsuarios = await usuariosCollection.countDocuments();
    console.log("📊 Total de usuários no banco:", totalUsuarios);

    // Verificar quantos usuários não são admin
    const usuariosNaoAdmin = await usuariosCollection.countDocuments({
      permissao: { $ne: "administrador" }
    });
    console.log("👥 Usuários não-admin:", usuariosNaoAdmin);

    // Listar alguns usuários para teste
    const usuariosExemplo = await usuariosCollection
      .find({ permissao: { $ne: "administrador" } })
      .limit(5)
      .project({ _id: 1, login: 1, name: 1, permissao: 1 })
      .toArray();

    console.log("📋 Exemplos de usuários não-admin:");
    usuariosExemplo.forEach((usuario, index) => {
      console.log(`  ${index + 1}. Nome: ${usuario.name}, Login: ${usuario.login}, Permissão: ${usuario.permissao}`);
    });

    // Testar busca com diferentes termos
    const termosTeste = ["a", "admin", "teste", "user"];
    
    for (const termo of termosTeste) {
      console.log(`\n🔍 Testando busca com termo: "${termo}"`);
      
      const escapedQuery = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const resultados = await usuariosCollection
        .find({
          $or: [
            { login: { $regex: escapedQuery, $options: "i" } },
            { name: { $regex: escapedQuery, $options: "i" } }
          ],
          permissao: { $ne: "administrador" }
        })
        .limit(10)
        .project({ _id: 1, login: 1, name: 1 })
        .toArray();

      console.log(`  📊 Resultados encontrados: ${resultados.length}`);
      resultados.forEach((usuario, index) => {
        console.log(`    ${index + 1}. ${usuario.name} (@${usuario.login})`);
      });
    }

    console.log("\n✅ Teste concluído!");
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  } finally {
    process.exit(0);
  }
}

testarBuscaUsuarios();
