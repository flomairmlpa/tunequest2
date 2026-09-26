// Builds data/hitster-cards.json, a compact { sku: { cardNumber: spotifyId } } snapshot of the
// official Hitster database. Usage: node scripts/build-hitster-cards.mjs [path-or-url-to-gameset_database.json]
import { mkdir, readFile, writeFile } from "node:fs/promises";

const source =
  process.argv[2] ||
  "https://hitster.jumboplay.com/hitster-assets/gameset_database.json";

const database = source.startsWith("http")
  ? await (await fetch(source)).json()
  : JSON.parse(await readFile(source, "utf8"));

const cards = {};
for (const { sku, gameset_data } of database.gamesets) {
  cards[sku.toLowerCase()] = Object.fromEntries(
    gameset_data.cards.map((card) => [card.CardNumber, card.Spotify])
  );
}

const dataDir = new URL("../data/", import.meta.url);
await mkdir(dataDir, { recursive: true });
await writeFile(
  new URL("hitster-cards.json", dataDir),
  JSON.stringify({ updated_on: database.updated_on, cards })
);
console.log(`Wrote ${Object.keys(cards).length} gamesets`);
