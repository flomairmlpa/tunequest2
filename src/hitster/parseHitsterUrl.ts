export type HitsterCard = {
  lang: string;
  sku: string | null;
  cardNumber: string;
};

// Matches original Hitster card QR codes, e.g.
//   http://www.hitstergame.com/de/00268
//   https://hitstergame.com/de/aaaa0012/00001
//   www.hitstergame.com/nordics/aaaa0015/00042
const hitsterRegex =
  /hitstergame\.com\/([a-z]{2}(?:[-_][a-z0-9]+)?|[a-z]+)\/(?:([a-z0-9]+)\/)?(\d+)\/?(?:[?#].*)?$/i;

export function parseHitsterUrl(text: string): HitsterCard | null {
  const match = hitsterRegex.exec(text.trim());
  if (!match) return null;
  let [, lang, sku, cardNumber] = match;
  // Some editions encode the SKU into the language segment ("de-aaaa0012")
  if (!sku && /[-_]/.test(lang)) [lang, sku] = lang.split(/[-_]/);
  return {
    lang: lang.toLowerCase(),
    sku: sku ? sku.toLowerCase() : null,
    cardNumber: normalizeCardNumber(cardNumber),
  };
}

export function normalizeCardNumber(value: string | number): string {
  return String(value).replace(/^0+(?=\d)/, "").padStart(5, "0");
}
