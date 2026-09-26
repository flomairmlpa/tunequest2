import { NextApiHandler } from "next";
import { parseHitsterUrl } from "@/hitster/parseHitsterUrl";
import { resolveHitsterCard } from "@/hitster/hitsterDatabase";

// Resolves an original Hitster card QR code URL to a Spotify track id.
// GET /api/hitster?url=http://www.hitstergame.com/de/00300
const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const url = typeof req.query.url === "string" ? req.query.url : "";
  const card = parseHitsterUrl(url);
  if (!card) {
    res.status(400).json({ error: "Not a Hitster card URL" });
    return;
  }

  try {
    const trackId = await resolveHitsterCard(card);
    if (!trackId) {
      res.status(404).json({ error: "Card not found in Hitster database", card });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).json({ trackId, card });
  } catch (error) {
    console.error("Failed to resolve Hitster card:", error);
    res.status(502).json({ error: "Hitster database unavailable", card });
  }
};

export default handler;
