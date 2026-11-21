import { pantryGroups } from "./pantry-items.js";

export { pantryGroups };

const STORAGE_KEY = "food-pantry-unavailable-v1";
const pantryItems = pantryGroups.flatMap(({ items }) => items);
const pantryIds = new Set(pantryItems.map(({ id }) => id));

function normalize(text) {
  return text.toLowerCase()
    .normalize("NFC")
    .replace(/\bchill(?:i|ies)\b/g, (word) => word === "chilli" ? "chili" : "chilies")
    .replace(/['’]/g, "")
    .replace(/\s*&\s*/g, " and ")
    .replace(/[-‐‑/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ingredientsByName = new Map();
for (const { id, label, aliases } of pantryItems) {
  for (const name of [label, ...aliases]) {
    ingredientsByName.set(normalize(name).replace(/,/g, ""), [id]);
  }
}

const equivalentItems = {
  "water": [],
  "oil": ["olive-oil", "vegetable-oil", "sunflower-oil", "avocado-oil", "coconut-oil"],
  "neutral oil": ["vegetable-oil", "sunflower-oil", "avocado-oil"],
  "cooking oil": ["olive-oil", "vegetable-oil", "sunflower-oil", "avocado-oil", "coconut-oil"],
  "broth": ["chicken-broth", "chicken-bouillon", "beef-bouillon"],
  "mustard": ["dijon", "english-mustard", "french-mustard"],
  "vinaigrette": ["cheese-vinaigrette", "italian-dressing"],
  "lemon juice": ["lemons", "bottled-lemon-juice"],
  "lime": ["lime-juice"],
  "yeast": ["instant-yeast", "active-yeast"],
  "chicken": ["chicken-breast", "chicken-thighs"],
  "noodles": ["pasta", "rice-ramen"],
  "thin noodles": ["pasta", "rice-ramen"],
};

for (const [name, ids] of Object.entries(equivalentItems)) {
  ingredientsByName.set(name, ids);
}

function recognizedUnavailable(ids) {
  return new Set(Array.from(ids).filter((id) => pantryIds.has(id)));
}

export function getUnavailableIds() {
  try {
    const value = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(value) ? recognizedUnavailable(value) : new Set();
  } catch {
    return new Set();
  }
}

export function saveUnavailableIds(unavailableIds) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify([...recognizedUnavailable(unavailableIds)]));
  } catch {
    // When storage is unavailable, the caller's in-memory selection still works.
  }
}

const AMOUNT = /^(?:about\s+)?[0-9⅛¼⅓⅜½⅝⅔¾⅞]+(?:[ ./⁄–—-]+[0-9⅛¼⅓⅜½⅝⅔¾⅞]+)*\s*/u;
const MEASUREMENT = /^(?:(?:heaped|level)\s+)?(?:cups?|tbsp\.?|tsp\.?|tablespoons?|teaspoons?|grams?|kg|g|oz|ounces?|lbs?|pounds?|ml|liters?|milliliters?|slices?|strips?|knobs?|pinches?|pinch|dash|drops?|cloves?|handfuls?)\b\.?\s*(?:of\s+)?/;
const PREP_PREFIX = /^(?:(?:thinly|finely|freshly)\s+)?(?:boneless|skinless|peeled|grated|thin|thick|drained|rinsed|sliced|shredded|diced|cubed|chopped|crumbled|softened|melted|large|small|medium|dry|cold|chilled|hot|warm|lukewarm|thawed|cooked|cans?)\b\s*/;
const OPTIONAL = /(?:\(\s*optional\s*\)|,\s*optional\b|\bif desired\b)/i;

function withoutMeasurement(text) {
  return text.replace(AMOUNT, "").replace(MEASUREMENT, "");
}

function ingredientName(text) {
  const withoutAmount = withoutMeasurement(text.toLowerCase().trim())
    .replace(/^plus\s+(.+)/, (_, extraAmount) => withoutMeasurement(extraAmount));
  return normalize(withoutAmount)
    .replace(/\((?:optional|divided|to taste|for serving)\)/g, "")
    .replace(/^(?:a|an) /, "")
    .replace(/,\s*(?:drained|rinsed|divided|chopped|sliced|broken|softened|melted|thawed|optional|to taste)\b.*$/, "")
    .replace(/\s+(?:plus more(?:\s+to\s+.*|\s+as needed)?|as needed|to taste|to serve|if desired)$/, "")
    .replace(/\s+and\s+[0-9⅛¼⅓⅜½⅝⅔¾⅞]+.*\s+for coating$/, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ingredientOptions(name) {
  let candidate = name;
  // Exact matches take precedence, e.g. sliced water chestnuts or cooked jacket potatoes.
  while (candidate) {
    if (ingredientsByName.has(candidate)) return ingredientsByName.get(candidate);
    const next = candidate.replace(PREP_PREFIX, "");
    if (next === candidate) break;
    candidate = next;
  }
  return null;
}

function isAvailable(text, unavailableIds) {
  const name = ingredientName(text);
  const ids = ingredientOptions(name);
  if (ids) return ids.length === 0 || ids.some((id) => !unavailableIds.has(id));

  const alternatives = name.split(/\s+or\s+/);
  if (alternatives.length > 1) {
    return alternatives.some((alternative) => isAvailable(alternative, unavailableIds));
  }

  const required = name.split(/\s+and\s+/);
  return required.length > 1 && required.every((part) => isAvailable(part, unavailableIds));
}

export function recipeIngredients(recipe, unavailableIds = new Set()) {
  return (recipe.ingredients ?? "").split("·").map((text) => text.trim()).filter(Boolean).map((text) => ({
    text,
    missing: !isAvailable(text, unavailableIds),
    optional: OPTIONAL.test(text),
  }));
}
