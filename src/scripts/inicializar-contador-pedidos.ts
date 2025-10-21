/**
 * Script para inicializar ou resetar o contador de pedidos
 * Execute com: npx tsx src/scripts/inicializar-contador-pedidos.ts
 * 
 * Este script:
 * 1. Verifica se já existe um contador de pedidos
 * 2. Se não existir, cria começando do 00001
 * 3. Permite resetar o contador (use com CUIDADO!)
 */

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function inicializarContador() {
  const client = new MongoClient(uri);

  try {
    console.log("🔄 Conectando ao MongoDB...\n");
    await client.connect();
    console.log("✅ Conectado com sucesso!\n");

    const db = client.db("paraiba");
    
    // Definir interface para o contador
    interface Contador {
      _id: string;
      ultimoNumero: number;
    }
    const contadoresCollection = db.collection<Contador>("contadores");

    // Verificar se o contador já existe
    const contadorExistente = await contadoresCollection.findOne({ _id: "pedidos" });

    if (contadorExistente) {
      console.log("📊 Contador de pedidos já existe:");
      console.log(`   Último número: ${String(contadorExistente.ultimoNumero).padStart(5, '0')}`);
      console.log(`   Próximo pedido será: ${String(contadorExistente.ultimoNumero + 1).padStart(5, '0')}\n`);
      
      // Contar pedidos existentes
      const totalPedidos = await db.collection("pedidos").countDocuments({});
      console.log(`📦 Total de pedidos no banco: ${totalPedidos}\n`);

      console.log("ℹ️  O contador está funcionando corretamente.");
      console.log("⚠️  Para RESETAR o contador (CUIDADO!), edite este script e descomente a seção de reset.\n");
      
      // ⚠️ DESCOMENTE ABAIXO PARA RESETAR (USE COM EXTREMO CUIDADO!)
      // const RESETAR = false; // Mude para true para resetar
      // if (RESETAR) {
      //   await contadoresCollection.updateOne(
      //     { _id: "pedidos" },
      //     { $set: { ultimoNumero: 0 } }
      //   );
      //   console.log("🔄 Contador resetado para 00000!");
      // }

    } else {
      console.log("📝 Contador de pedidos não encontrado. Criando...\n");
      
      // Criar contador começando do 0 (próximo será 00001)
      await contadoresCollection.insertOne({
        _id: "pedidos",
        ultimoNumero: 0
      });

      console.log("✅ Contador criado com sucesso!");
      console.log("   Primeiro pedido será: 00001\n");
    }

    console.log("✅ Processo concluído!");

  } catch (error) {
    console.error("❌ Erro ao inicializar contador:", error);
    if (error instanceof Error) {
      console.error("   Detalhes:", error.message);
    }
  } finally {
    await client.close();
    console.log("\n🔌 Conexão encerrada.");
  }
}

// Executar
inicializarContador();

