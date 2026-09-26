import { NextApiHandler } from "next";

/**
 * Resolves a classic Hitster card (edition SKU + card number) to a Spotify track id.
 * The official Hitster card database has no CORS headers, so it is proxied through here
 * and kept in memory for a while.
 */

const DATABASE_URL =
  "https://hitster.jumboplay.com/hitster-assets/gameset_database.json";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Old cards encode only the language (e.g. hitstergame.com/de/00300) and belong to the
// first "Hitster Original" edition of that language.
const LEGACY_LANGUAGE_SKUS: Record<string, string> = {
  nl: "aaaa0001",
  de: "aaaa0002",
  es: "aaaa0003",
  fr: "aaaa0004",
};

type GamesetDatabase = {
  gamesets: {
    sku: string;
    gameset_data: {
      cards: { CardNumber: string; Spotify: string }[];
    };
  }[];
};

let cache: { loadedAt: number; cards: Map<string, Map<string, string>> } | null =
  null;
let pending: Promise<Map<string, Map<string, string>>> | null = null;

const loadDatabase = async () => {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.cards;
  if (!pending) {
    pending = (async () => {
      const response = await fetch(DATABASE_URL);
      if (!response.ok) {
        throw new Error(`Hitster database request failed: ${response.status}`);
      }
      const database: GamesetDatabase = await response.json();
      const cards = new Map<string, Map<string, string>>();
      for (const gameset of database.gamesets) {
        const bySku = new Map<string, string>();
        for (const card of gameset.gameset_data.cards) {
          if (card.Spotify) bySku.set(card.CardNumber, card.Spotify);
        }
        cards.set(gameset.sku.trim().toLowerCase(), bySku);
      }
      cache = { loadedAt: Date.now(), cards };
      return cards;
    })().finally(() => {
      pending = null;
    });
  }
  try {
    return await pending;
  } catch (error) {
    // Serve a stale database rather than failing if the refresh does not work
    if (cache) return cache.cards;
    throw error;
  }
};

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const lang = String(req.query.lang ?? "").toLowerCase();
  const card = String(req.query.card ?? "");
  const sku = String(req.query.sku ?? "").toLowerCase() || LEGACY_LANGUAGE_SKUS[lang];

  if (!sku || !/^\d{1,5}$/.test(card)) {
    res.status(400).json({ error: "Unsupported Hitster card" });
    return;
  }

  try {
    const database = await loadDatabase();
    const trackId = database.get(sku)?.get(card.padStart(5, "0"));
    if (!trackId) {
      res.status(404).json({ error: "Unknown Hitster card" });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).json({ trackId });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Hitster database unavailable" });
  }
};

export default handler;
