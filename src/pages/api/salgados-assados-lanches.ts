// import type { NextApiRequest, NextApiResponse } from "next";
// import client from "@/modules/mongodb";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     await client.connect();
//     const dbPadaria = client.db("paraiba");

//     const salgadosAssadosLanches = await dbPadaria
//       .collection("salgados-assados-lanches")
//       .find({})
//       .sort({
//         metacritic: -1,
//       })
//       .toArray();

//     return res.status(200).json({
//       salgadosAssadosLanches: salgadosAssadosLanches,
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

    const salgadosAssadosLanches = await dbPadaria
      .collection("salgados-assados-lanches")
      .find({})
      .toArray();

    return res.status(200).json({
      salgadosAssadosLanches,
    });
  } catch (error) {
    console.error("Erro ao buscar salgados assados e lanches:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
