import { HitsterCard } from "./parseHitsterUrl";
import snapshot from "../../data/hitster-cards.json";

// Official Hitster database, mapping card numbers of every edition (SKU) to Spotify tracks.
// A snapshot is bundled in data/hitster-cards.json (regenerate with scripts/build-hitster-cards.mjs);
// the live database is only fetched for cards of editions released after the snapshot.
export const HITSTER_DATABASE_URL =
  process.env.HITSTER_DATABASE_URL ||
  "https://hitster.jumboplay.com/hitster-assets/gameset_database.json";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// sku -> card number -> spotify track id
type HitsterCards = Record<string, Record<string, string>>;

type GamesetDatabase = {
  gamesets: {
    sku: string;
    gameset_data: { cards: { CardNumber: string; Spotify: string }[] };
  }[];
};

// Cards of the first editions have no SKU in their URL (e.g. hitstergame.com/de/00300)
const baseEditionByLang: Record<string, string> = {
  nl: "aaaa0001",
  de: "aaaa0002",
  es: "aaaa0003",
  fr: "aaaa0004",
};

const snapshotCards: HitsterCards = snapshot.cards;

let live: { cards: HitsterCards; loadedAt: number } | null = null;
let loading: Promise<HitsterCards> | null = null;

function toCards(database: GamesetDatabase): HitsterCards {
  const cards: HitsterCards = {};
  for (const { sku, gameset_data } of database.gamesets) {
    cards[sku.toLowerCase()] = Object.fromEntries(
      gameset_data.cards.map((card) => [card.CardNumber, card.Spotify])
    );
  }
  return cards;
}

async function loadLiveCards(): Promise<HitsterCards> {
  if (live && Date.now() - live.loadedAt < CACHE_TTL_MS) return live.cards;
  if (!loading) {
    loading = fetch(HITSTER_DATABASE_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Hitster database returned ${res.status}`);
        return res.json();
      })
      .then((database: GamesetDatabase) => {
        const cards = toCards(database);
        live = { cards, loadedAt: Date.now() };
        return cards;
      })
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

export async function resolveHitsterCard(
  card: HitsterCard
): Promise<string | null> {
  const sku = card.sku ?? baseEditionByLang[card.lang];
  if (!sku) return null;

  const trackId = snapshotCards[sku]?.[card.cardNumber];
  if (trackId) return trackId;

  // Unknown to the snapshot, the card may belong to a newer edition
  const liveCards = await loadLiveCards().catch((error) => {
    console.error("Failed to load Hitster database:", error);
    if (live) return live.cards;
    // The edition is known, so the card simply doesn't exist
    if (snapshotCards[sku]) return {};
    throw error;
  });
  return liveCards[sku]?.[card.cardNumber] ?? null;
}
