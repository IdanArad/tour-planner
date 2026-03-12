/**
 * Cross-source venue deduplication utilities.
 * Uses normalized name + city matching to identify duplicates.
 */

/**
 * Normalize a venue name for comparison.
 * Strips common prefixes/suffixes, lowercases, removes special chars.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/i, "")
    .replace(/\s+(club|bar|venue|hall|theater|theatre|tavern|room|lounge)$/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a city name for comparison.
 */
export function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate a dedup key from name + city.
 */
export function dedupKey(name: string, city: string | null): string {
  const normalName = normalizeName(name);
  const normalCity = city ? normalizeCity(city) : "unknown";
  return `${normalName}|${normalCity}`;
}

/**
 * Check similarity between two strings (Jaccard on character bigrams).
 * Returns a value between 0 and 1.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();

  const normA = a.toLowerCase();
  const normB = b.toLowerCase();

  for (let i = 0; i < normA.length - 1; i++) {
    bigramsA.add(normA.substring(i, i + 2));
  }
  for (let i = 0; i < normB.length - 1; i++) {
    bigramsB.add(normB.substring(i, i + 2));
  }

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
