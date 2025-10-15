import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  birthDate: string;
  gender: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    promotions: boolean;
  };
}

interface UpdateData {
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  birthDate: string | null;
  gender: string | null;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    promotions: boolean;
  };
  ultimaAtualizacao: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      zipCode, 
      birthDate, 
      gender, 
      preferences 
    }: ProfileData = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Nome e email são obrigatórios" 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Buscar usuário pelo email
    const existingUser = await users.findOne({ email });
    
    if (!existingUser) {
      return res.status(404).json({ 
        ok: false, 
        msg: "Usuário não encontrado" 
      });
    }

    // Preparar dados para atualização
    const updateData: UpdateData = {
      name,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      birthDate: birthDate || null,
      gender: gender || null,
      preferences: {
        notifications: preferences?.notifications ?? true,
        newsletter: preferences?.newsletter ?? false,
        promotions: preferences?.promotions ?? false,
      },
      ultimaAtualizacao: new Date(),
    };

    // Atualizar usuário
    const result = await users.updateOne(
      { email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Nenhuma alteração foi feita" 
      });
    }

    // Buscar usuário atualizado
    const updatedUser = await users.findOne({ email });

    console.log("Perfil atualizado com sucesso:", updatedUser?.email);

    return res.status(200).json({
      ok: true,
      msg: "Perfil atualizado com sucesso",
      user: {
        _id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        address: updatedUser?.address,
        city: updatedUser?.city,
        state: updatedUser?.state,
        zipCode: updatedUser?.zipCode,
        birthDate: updatedUser?.birthDate,
        gender: updatedUser?.gender,
        preferences: updatedUser?.preferences,
        permissao: updatedUser?.permissao,
        googleId: updatedUser?.googleId,
        picture: updatedUser?.picture,
      },
    });

  } catch (err) {
    console.error("ERRO UPDATE PROFILE:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
