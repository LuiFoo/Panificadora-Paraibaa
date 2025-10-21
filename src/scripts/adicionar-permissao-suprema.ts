/**
 * Script para adicionar/atualizar campo permissaoSuprema aos usuários existentes
 * Também converte ExIlimitada de string para boolean se necessário
 * 
 * Como executar:
 * npx ts-node src/scripts/adicionar-permissao-suprema.ts
 */

import clientPromise from "../modules/mongodb";

async function adicionarPermissaoSuprema() {
  try {
    console.log("🔄 Iniciando migração de permissaoSuprema e ExIlimitada...\n");

    const client = await clientPromise;
    const db = client.db("paraiba");
    const users = db.collection("users");

    // 1. Verificar quantos usuários existem
    const totalUsers = await users.countDocuments();
    console.log(`📊 Total de usuários no banco: ${totalUsers}`);

    // 2. Converter ExIlimitada string para boolean
    console.log("\n🔄 Convertendo ExIlimitada de string para boolean...");
    const convertResult = await users.updateMany(
      { ExIlimitada: "true" },
      { $set: { ExIlimitada: true } }
    );
    console.log(`   - Convertidos: ${convertResult.modifiedCount}`);
    
    const convertFalseResult = await users.updateMany(
      { ExIlimitada: "false" },
      { $set: { ExIlimitada: false } }
    );
    console.log(`   - Convertidos (false): ${convertFalseResult.modifiedCount}`);

    // 3. Adicionar permissaoSuprema: false para todos que não têm o campo
    console.log("\n🔄 Adicionando campo permissaoSuprema...");
    const updateResult = await users.updateMany(
      { permissaoSuprema: { $exists: false } },
      { 
        $set: { 
          permissaoSuprema: false,
          dataAtualizacaoPermissao: new Date()
        } 
      }
    );

    console.log(`   - Usuários modificados: ${updateResult.modifiedCount}`);
    console.log(`   - Usuários encontrados: ${updateResult.matchedCount}`);

    // 4. Exibir lista de todos os admins atuais
    const admins = await users.find({ permissao: "administrador" }).toArray();
    console.log(`\n👑 Administradores encontrados: ${admins.length}`);
    
    if (admins.length > 0) {
      console.log("\n📋 Lista de administradores:");
      admins.forEach((admin, index) => {
        const temPermissaoSuprema = admin.permissaoSuprema === true || admin.permissaoSuprema === "true";
        const temExIlimitada = admin.ExIlimitada === true || admin.ExIlimitada === "true";
        const isSuperAdmin = temPermissaoSuprema || temExIlimitada;
        
        console.log(`   ${index + 1}. ${admin.name} (${admin.email}) ${isSuperAdmin ? '⭐ SUPER ADMIN' : ''}`);
        console.log(`      - Login: ${admin.login}`);
        console.log(`      - permissaoSuprema: ${admin.permissaoSuprema} (type: ${typeof admin.permissaoSuprema})`);
        console.log(`      - ExIlimitada: ${admin.ExIlimitada} (type: ${typeof admin.ExIlimitada})`);
        console.log(`      - É Super Admin? ${isSuperAdmin ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`      - Provider: ${admin.authProvider || 'tradicional'}`);
      });

      console.log("\n⭐ IMPORTANTE:");
      console.log("Para dar Permissão Suprema a um usuário, execute no MongoDB:");
      console.log("db.users.updateOne({ email: 'email@exemplo.com' }, { $set: { permissaoSuprema: true, ExIlimitada: true } })");
      console.log("\nOu use o MongoDB Compass/Atlas para editar manualmente.");
      console.log("ATENÇÃO: Use boolean true, não string \"true\"\n");
    }

    console.log("✅ Migração concluída com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  }
}

// Executar
adicionarPermissaoSuprema()
  .then(() => {
    console.log("🎉 Script finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script falhou:", error);
    process.exit(1);
  });

