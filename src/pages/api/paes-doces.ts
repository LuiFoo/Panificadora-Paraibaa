// import type { NextApiRequest, NextApiResponse } from "next";
// import client from "@/modules/mongodb";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     await client.connect();
//     const dbPadaria = client.db("paraiba");

//     const paesDoces = await dbPadaria
//       .collection("paes-doces")
//       .find({})
//       .sort({
//         metacritic: -1,
//       })
//       .toArray();

//     return res.status(200).json({
//       paesDoces: paesDoces,
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

    const paesDoces = await dbPadaria
      .collection("paes-doces")
      .find({})
      .toArray();

    return res.status(200).json({
      paesDoces,
    });
  } catch (error) {
    console.error("Erro ao buscar pães doces:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
