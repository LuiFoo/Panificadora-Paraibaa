import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  // Apenas para debug - NÃO usar em produção
  const envCheck = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    MONGODB_URI: !!process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV,
  };

  console.log("🔍 Debug Environment Variables:", envCheck);

  res.status(200).json({
    success: true,
    env: envCheck,
    timestamp: new Date().toISOString()
  });
}
