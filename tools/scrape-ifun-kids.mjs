// Scrapes every product from ifunstudio.ru, keeps the kids' kits, and writes
// src/jerseys/kids-kits.json for the /jerseys/ page.
//
//   node tools/scrape-ifun-kids.mjs [--raw <file>]
//
// --raw also saves the full, unfiltered catalogue (useful for checking the filter).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(root, "src/jerseys/kids-kits.json");
const site = "https://www.ifunstudio.ru";
const pageSize = 100;
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(page) {
  const url = `${site}/api/product/list?page=${page}&limit=${pageSize}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return (await res.json()).data;
    console.warn(`page ${page}: HTTP ${res.status}, retry ${attempt}`);
    await sleep(2000 * attempt);
  }
  throw new Error(`page ${page} failed after 5 attempts`);
}

async function fetchAll() {
  const products = [];
  for (let page = 1; ; page++) {
    const data = await fetchPage(page);
    products.push(...data.list);
    console.log(`page ${page}: ${data.list.length} products (${products.length} total)`);
    if (!data.has_more || data.list.length === 0) break;
    await sleep(1000);
  }
  return products;
}

const kidsWords = /\b(kids?|child(ren)?|youth|baby|infant|toddler|junior)\b|kids-size/i;

// "KidSuper" is a Manchester City collaboration and "baby blue" is a colour;
// neither means a kids' size.
export function isKids(product) {
  const text = `${product.title} ${product.handle}`
    .replace(/kidsuper/gi, "")
    .replace(/baby[\s-]+(blue|white|pink)/gi, "");
  return kidsWords.test(text);
}

const kitWords = [
  "home", "away", "third", "fourth", "goalkeeper", "gk", "special", "training",
  "pre-match", "prematch", "commemorative", "anniversary", "concept", "joint",
  "co-branded", "black", "white", "red", "blue", "green", "pink", "purple",
  "yellow", "grey", "gray", "gold", "orange", "navy", "shirt", "jersey", "kit",
  "kids", "kid", "children", "child", "suit", "set", "long", "short", "shorts",
  "jacket", "windbreaker", "hoodie", "sweater", "tracksuit", "edition", "vest",
  "player", "fan", "version", "limited", "classic", "euro", "world", "cup",
];

// "2025/2026 Manchester City Home Shirt Kids Size" -> "Manchester City"
export function teamName(title) {
  const rest = title
    .replace(/^\s*\d{4}(\s*[/-]\s*\d{2,4})?\s*/, "")
    .replace(/^(season\s+)?retro\s+/i, "")
    .replace(/^\d{4}(\s*[/-]\s*\d{2,4})?\s*/, "")
    .replace(/^(fifa\s+world\s+cup|long\s+sleeves?)\s+/i, "")
    .replace(/\bred\s+bulls\b/i, "Red_Bulls");
  const words = rest.split(/\s+/);
  const stop = words.findIndex((w) => kitWords.includes(w.toLowerCase().replace(/[^a-z-]/g, "")));
  let team = (stop > 0 ? words.slice(0, stop) : words).join(" ").replace("Red_Bulls", "Red Bulls");
  team = team.replace(teamQualifiers, "").replace(/\s+national(\s+team)?$/i, "").trim();
  return teamAliases[team.toLowerCase()] ?? team;
}

// Special-edition words that follow the team name in a title.
const teamQualifiers =
  /\s+(\d+(st|nd|rd|th)|half-pull|messi\s+farewell|collaboration|oktoberfest|vhils|blackout|night|y-3|kidsuper|stone\s+roses|personal)\b.*$/i;

// The shop spells some teams more than one way.
const teamAliases = {
  "internazionale milan": "Inter Milan",
  seville: "Sevilla",
  "tottenham hotspur": "Tottenham",
  "psg paris saint-germain": "Paris Saint-Germain",
  "al-hilal saudi": "Al-Hilal",
  ronaldo: "Cristiano Ronaldo",
  "feyenoord rotterdam": "Feyenoord",
  eindhoven: "PSV Eindhoven",
  "united states": "USA",
  "corinthians paulista": "Corinthians",
  athletic: "Athletic Bilbao",
  américa: "Club América",
};

const countries = new Set([
  "Algeria", "Argentina", "Belgium", "Brazil", "Canada", "Colombia", "Costa Rica",
  "Croatia", "England", "France", "Germany", "Ireland", "Italy", "Jamaica", "Japan",
  "Mexico", "Netherlands", "Peru", "Portugal", "Qatar", "Saudi Arabia", "Scotland",
  "Spain", "Sweden", "Switzerland", "Tunisia", "USA", "Venezuela", "Wales",
]);

function season(title) {
  const m = title.match(/^\s*(\d{4}(\s*[/-]\s*\d{2,4})?)/);
  return m ? m[1].replace(/\s+/g, "") : "";
}

function toKit(product) {
  const sizes = product.options.find((o) => /size/i.test(o.name))?.values ?? [];
  const image = product.image?.src ?? product.images?.[0]?.src ?? "";
  return {
    title: product.title.trim(),
    team: teamName(product.title),
    national: /national/i.test(product.title) || countries.has(teamName(product.title)),
    season: season(product.title),
    retro: /retro/i.test(product.title),
    url: `${site}/products/${product.handle}`,
    image: image.startsWith("//") ? `https:${image}` : image,
    price: Number(product.price_min ?? product.price),
    priceMax: Number(product.price_max ?? product.price),
    sizes,
    available: product.available,
    created: product.created_at,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = await fetchAll();
  const rawIndex = process.argv.indexOf("--raw");
  if (rawIndex > -1) await writeFile(process.argv[rawIndex + 1], JSON.stringify(all));

  const seen = new Set();
  const kits = all
    .filter(isKids)
    .filter((p) => !seen.has(p.handle) && seen.add(p.handle))
    .map(toKit)
    .sort((a, b) => a.team.localeCompare(b.team) || b.season.localeCompare(a.season));

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(
    outFile,
    JSON.stringify({ source: site, scrapedAt: new Date().toISOString(), total: all.length, kits }, null, 1),
  );
  const teams = new Set(kits.map((k) => k.team));
  console.log(`${kits.length} kids' kits across ${teams.size} teams -> ${path.relative(root, outFile)}`);
}
