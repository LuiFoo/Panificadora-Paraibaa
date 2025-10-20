import { MongoClient } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/paraiba";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("paraiba");
    const produtos = db.collection("produtos");

    console.log("Criando índices em 'produtos'...");

    await produtos.createIndex({ slug: 1 }, { unique: true, name: "uniq_slug" });
    await produtos.createIndex({ "categoria.slug": 1 }, { name: "idx_categoria_slug" });
    await produtos.createIndex({ status: 1 }, { name: "idx_status" });
    await produtos.createIndex({ destaque: -1, criadoEm: -1 }, { name: "idx_destaque_criadoEm" });
    await produtos.createIndex({ criadoEm: -1 }, { name: "idx_criadoEm" });

    console.log("Índices criados com sucesso.");
  } catch (err) {
    console.error("Erro criando índices:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();


