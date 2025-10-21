/**
 * Script para verificar e atualizar permissões no MongoDB
 * Execute com: node src/scripts/migrar-permissao.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function migrarPermissoes() {
  const client = new MongoClient(uri);

  try {
    console.log("🔄 Conectando ao MongoDB...\n");
    await client.connect();
    console.log("✅ Conectado com sucesso!\n");

    const db = client.db("paraiba");
    const users = db.collection("users");

    // 1. Total de usuários
    const totalUsers = await users.countDocuments();
    console.log(`📊 Total de usuários: ${totalUsers}\n`);

    // 2. Listar todos os administradores
    const admins = await users.find({ permissao: "administrador" }).toArray();
    console.log(`👑 Administradores encontrados: ${admins.length}\n`);

    if (admins.length > 0) {
      console.log("📋 Lista de administradores:\n");
      admins.forEach((admin, index) => {
        const temPermissaoSuprema = admin.permissaoSuprema === true || admin.permissaoSuprema === "true";
        const temExIlimitada = admin.ExIlimitada === true || admin.ExIlimitada === "true";
        const isSuperAdmin = temPermissaoSuprema || temExIlimitada;
        
        console.log(`   ${index + 1}. ${admin.name} (${admin.email}) ${isSuperAdmin ? '⭐ SUPER ADMIN' : ''}`);
        console.log(`      - permissaoSuprema: ${admin.permissaoSuprema} (type: ${typeof admin.permissaoSuprema})`);
        console.log(`      - ExIlimitada: ${admin.ExIlimitada} (type: ${typeof admin.ExIlimitada})`);
        console.log(`      - Status: ${isSuperAdmin ? '✅ SUPER ADMIN' : '❌ Admin Normal'}`);
        console.log("");
      });
    }

    // 3. Converter strings para boolean
    console.log("🔄 Convertendo valores string para boolean...\n");
    
    const convertTrueResult = await users.updateMany(
      { permissaoSuprema: "true" },
      { $set: { permissaoSuprema: true } }
    );
    console.log(`   - permissaoSuprema "true" → true: ${convertTrueResult.modifiedCount} usuários`);
    
    const convertFalseResult = await users.updateMany(
      { permissaoSuprema: "false" },
      { $set: { permissaoSuprema: false } }
    );
    console.log(`   - permissaoSuprema "false" → false: ${convertFalseResult.modifiedCount} usuários`);

    const convertExTrueResult = await users.updateMany(
      { ExIlimitada: "true" },
      { $set: { ExIlimitada: true } }
    );
    console.log(`   - ExIlimitada "true" → true: ${convertExTrueResult.modifiedCount} usuários`);
    
    const convertExFalseResult = await users.updateMany(
      { ExIlimitada: "false" },
      { $set: { ExIlimitada: false } }
    );
    console.log(`   - ExIlimitada "false" → false: ${convertExFalseResult.modifiedCount} usuários\n`);

    // 4. Adicionar campos faltantes
    console.log("🔄 Adicionando campos faltantes...\n");
    
    const addPermissaoResult = await users.updateMany(
      { permissaoSuprema: { $exists: false } },
      { $set: { permissaoSuprema: false } }
    );
    console.log(`   - permissaoSuprema adicionado: ${addPermissaoResult.modifiedCount} usuários`);
    
    const addExIlimitadaResult = await users.updateMany(
      { ExIlimitada: { $exists: false } },
      { $set: { ExIlimitada: false } }
    );
    console.log(`   - ExIlimitada adicionado: ${addExIlimitadaResult.modifiedCount} usuários\n`);

    // 5. Mostrar resumo final
    const superAdminsCount = await users.countDocuments({
      $or: [
        { permissaoSuprema: true },
        { ExIlimitada: true }
      ]
    });
    
    console.log("📊 RESUMO FINAL:");
    console.log(`   - Total de usuários: ${totalUsers}`);
    console.log(`   - Administradores: ${admins.length}`);
    console.log(`   - Super Admins: ${superAdminsCount}`);
    console.log(`   - Usuários normais: ${totalUsers - admins.length}\n`);

    console.log("✅ Migração concluída com sucesso!\n");
    
    if (superAdminsCount === 0) {
      console.log("⚠️ ATENÇÃO: Nenhum Super Admin encontrado!");
      console.log("Para definir um Super Admin, execute no MongoDB:");
      console.log("db.users.updateOne({ email: 'seuemail@gmail.com' }, { $set: { permissaoSuprema: true, ExIlimitada: true } })\n");
    }

  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔌 Conexão fechada.");
  }
}

// Executar
migrarPermissoes()
  .then(() => {
    console.log("\n🎉 Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script falhou:", error);
    process.exit(1);
  });

