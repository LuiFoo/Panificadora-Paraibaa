import clientPromise from "@/modules/mongodb";

async function debugUsuarios() {
  try {
    console.log("🔍 === DEBUG USUÁRIOS ===");
    
    const client = await clientPromise;
    const db = client.db("paraiba");
    const usuariosCollection = db.collection("users");
    
    // 1. Contar total de usuários
    const totalUsuarios = await usuariosCollection.countDocuments();
    console.log("📊 Total de usuários no banco:", totalUsuarios);
    
    // 2. Listar todos os usuários (limit 10)
    const todosUsuarios = await usuariosCollection
      .find({})
      .project({ _id: 1, login: 1, name: 1, permissao: 1 })
      .limit(10)
      .toArray();
    
    console.log("👥 Todos os usuários (primeiros 10):");
    todosUsuarios.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (@${user.login}) - ${user.permissao}`);
    });
    
    // 3. Contar usuários não-admin
    const naoAdminCount = await usuariosCollection.countDocuments({
      permissao: { $ne: "administrador" }
    });
    console.log("👤 Usuários não-admin:", naoAdminCount);
    
    // 4. Testar busca com "rafa"
    const buscaRafa = await usuariosCollection
      .find({
        $or: [
          { login: { $regex: "rafa", $options: "i" } },
          { name: { $regex: "rafa", $options: "i" } }
        ],
        permissao: { $ne: "administrador" }
      })
      .project({ _id: 1, login: 1, name: 1 })
      .toArray();
    
    console.log("🔍 Busca por 'rafa':", buscaRafa.length, "resultados");
    buscaRafa.forEach(user => {
      console.log(`  - ${user.name} (@${user.login})`);
    });
    
    // 5. Testar busca com "a" (mais ampla)
    const buscaA = await usuariosCollection
      .find({
        $or: [
          { login: { $regex: "a", $options: "i" } },
          { name: { $regex: "a", $options: "i" } }
        ],
        permissao: { $ne: "administrador" }
      })
      .project({ _id: 1, login: 1, name: 1 })
      .limit(5)
      .toArray();
    
    console.log("🔍 Busca por 'a':", buscaA.length, "resultados");
    buscaA.forEach(user => {
      console.log(`  - ${user.name} (@${user.login})`);
    });
    
    console.log("✅ Debug concluído");
    
  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

debugUsuarios();
