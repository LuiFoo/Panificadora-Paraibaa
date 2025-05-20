// import type { NextApiRequest, NextApiResponse } from "next";
// import client from "@/modules/mongodb";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     await client.connect();
//     const dbPadaria = client.db("paraiba");

//     const docesIndividuais = await dbPadaria
//       .collection("doces-individuais")
//       .find({})
//       .sort({
//         metacritic: -1,
//       })
//       .toArray();

//     return res.status(200).json({
//       docesIndividuais: docesIndividuais,
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

    const docesIndividuais = await dbPadaria
      .collection("doces-individuais")
      .find({})
      .toArray();

    return res.status(200).json({
      docesIndividuais,
    });
  } catch (error) {
    console.error("Erro ao buscar doces individuais:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
