// import type { NextApiRequest, NextApiResponse } from "next";
// import client from "@/modules/mongodb";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     await client.connect();
//     const dbPadaria = client.db("paraiba");

//     const roscasPaesEspeciais = await dbPadaria
//       .collection("roscas-paes-especiais")
//       .find({})
//       .sort({
//         metacritic: -1,
//       })
//       .toArray();

//     return res.status(200).json({
//       roscasPaesEspeciais: roscasPaesEspeciais,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ name: "Internal server error" });
//   }
// }

import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await client.connect();
    const dbPadaria = client.db("paraiba");

    const roscasPaesEspeciais = await dbPadaria
      .collection("roscas-paes-especiais")
      .find({})
      .toArray();

    return res.status(200).json({
      roscasPaesEspeciais,
    });
  } catch (error) {
    console.error("Erro ao buscar roscas de pães especiais:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
