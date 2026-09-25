import { HitsterCard, normalizeCardNumber } from "./parseHitsterUrl";

// Official Hitster database, mapping card numbers of every edition (SKU) to Spotify tracks.
export const HITSTER_DATABASE_URL =
  process.env.HITSTER_DATABASE_URL ||
  "https://hitster.jumboplay.com/hitster-assets/gameset_database.json";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Known cards, used when the database can't be fetched or lacks a card.
const staticMapping: Record<string, string> = {
  "de/00300": "5IMtdHjJ1OtkxbGe4zfUxQ",
};

type HitsterIndex = {
  // "<sku>/<card>" -> spotify track id
  bySku: Map<string, string>;
  // "<lang>/<card>" -> spotify track id (cards whose URL has no SKU)
  byLang: Map<string, string>;
};

let cached: { index: HitsterIndex; loadedAt: number } | null = null;
let loading: Promise<HitsterIndex> | null = null;

const spotifyIdRegex =
  /(?:spotify:track:|open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/)?([A-Za-z0-9]{22})(?![A-Za-z0-9])/;

// The database schema isn't documented, so field lookups are done by key name patterns.
const findField = (obj: Record<string, unknown>, pattern: RegExp) => {
  const key = Object.keys(obj).find((k) => pattern.test(k));
  return key === undefined ? undefined : obj[key];
};

const asString = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;

function extractSpotifyId(card: Record<string, unknown>): string | undefined {
  const spotifyField = asString(findField(card, /spotify/i));
  const candidates = spotifyField
    ? [spotifyField]
    : Object.values(card)
        .map(asString)
        .filter((v): v is string => !!v && /spotify/i.test(v));
  for (const candidate of candidates) {
    const id = spotifyIdRegex.exec(candidate)?.[1];
    if (id) return id;
  }
  return undefined;
}

function extractCardNumber(card: Record<string, unknown>): string | undefined {
  const value = asString(
    findField(card, /^(card[-_ ]?(number|num|no|nr|id)|number|nr|id)$/i)
  );
  return value && /^\d+$/.test(value) ? normalizeCardNumber(value) : undefined;
}

function buildIndex(database: unknown): HitsterIndex {
  const index: HitsterIndex = { bySku: new Map(), byLang: new Map() };

  const walk = (node: unknown, sku?: string, lang?: string) => {
    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, sku, lang));
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;

    const ownSku = asString(findField(obj, /sku/i))?.toLowerCase();
    const ownLang = asString(
      findField(obj, /^(lang|language|locale|country|region)$/i)
    )?.toLowerCase();
    sku = ownSku || sku;
    lang = ownLang || lang;

    const cardNumber = extractCardNumber(obj);
    const trackId = cardNumber ? extractSpotifyId(obj) : undefined;
    if (cardNumber && trackId) {
      if (sku && !index.bySku.has(`${sku}/${cardNumber}`))
        index.bySku.set(`${sku}/${cardNumber}`, trackId);
      if (lang && !index.byLang.has(`${lang}/${cardNumber}`))
        index.byLang.set(`${lang}/${cardNumber}`, trackId);
      return;
    }

    Object.values(obj).forEach((child) => walk(child, sku, lang));
  };

  walk(database);
  return index;
}

async function loadIndex(): Promise<HitsterIndex> {
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached.index;
  if (!loading) {
    loading = fetch(HITSTER_DATABASE_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Hitster database returned ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const index = buildIndex(json);
        console.info(
          `Loaded Hitster database: ${index.bySku.size} cards by SKU, ${index.byLang.size} by language`
        );
        cached = { index, loadedAt: Date.now() };
        return index;
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
  const staticHit =
    staticMapping[`${card.sku ?? card.lang}/${card.cardNumber}`];
  if (staticHit) return staticHit;

  let index: HitsterIndex;
  try {
    index = await loadIndex();
  } catch (error) {
    // Fall back to a stale index rather than failing completely
    if (!cached) throw error;
    console.error("Failed to refresh Hitster database:", error);
    index = cached.index;
  }

  if (card.sku) return index.bySku.get(`${card.sku}/${card.cardNumber}`) ?? null;
  return (
    index.byLang.get(`${card.lang}/${card.cardNumber}`) ??
    // Base game cards may be stored under a SKU that equals the language code
    index.bySku.get(`${card.lang}/${card.cardNumber}`) ??
    null
  );
}
