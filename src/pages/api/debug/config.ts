import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const config = {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || "não definido",
      googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    };

    console.log("Configuração do ambiente:");
    console.log("- Google Client ID:", config.hasGoogleClientId ? "✅ Configurado" : "❌ Não configurado");
    console.log("- Google Client Secret:", config.hasGoogleClientSecret ? "✅ Configurado" : "❌ Não configurado");
    console.log("- NextAuth URL:", config.nextAuthUrl);
    console.log("- NextAuth Secret:", config.hasNextAuthSecret ? "✅ Configurado" : "❌ Não configurado");

    return res.status(200).json({
      ok: true,
      config,
      message: "Verifique o console para mais detalhes"
    });
  } catch (err) {
    console.error("ERRO DEBUG CONFIG:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
