/**
 * "Find your speaker" (docs/SPEAKER_DATA.md): a forgiving search over brand, model and the other
 * names an entry is known by. Forgiving means: letter case, accents and punctuation do not matter;
 * words can come in any order; a word can be cut short while typing; one or two wrong letters are
 * fine in a longer word; "Mk II", "MkII", "Mark 2", "mk2" and plain "II" are the same; "LS50" and "LS 50" are
 * the same. Pure functions over plain names, so the tests run on the candidate list.
 */
export interface Searchable {
  brand: string;
  model: string;
  aka?: string[];
}

/** Roman numerals as model generations ("LSX II"), and the ways people write "Mark". */
const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6' };

/** Lower case, no accents, words split on anything that is not a letter or a digit. */
export function words(text: string): string[] {
  const plain = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // "B&W" is one word; "Rock & Roll" two
    .replace(/\b([a-z])&([a-z])\b/g, '$1$2')
    .replace(/&/g, ' and ')
    .replace(/\bmark\b/g, 'mk')
    // "mkii", "mk.2" → "mk 2"
    .replace(/\bmk\.?\s*(ii|iii|iv|v|vi|\d)\b/g, 'mk $1');
  return plain
    .split(/[^a-z0-9]+/)
    .filter((w) => w && w !== 'mk')
    .map((w) => ROMAN[w] ?? w);
}

/** Edit distance with swapped neighbours counted as one edit (optimal string alignment). */
export function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

/**
 * Wrong letters allowed in a typed word: none in short ones or in plain numbers, where a slip
 * makes another model (8020 is not 8030).
 */
const allowed = (w: string) => (/^\d+$/.test(w) ? 0 : w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0);

/** How well one typed word fits one word of the name: 3 exact, 2 the start of it, 1 a slip. */
function fit(typed: string, word: string): number {
  if (typed === word) return 3;
  if (word.startsWith(typed)) return 2;
  const slips = allowed(typed);
  if (slips === 0) return 0;
  if (distance(typed, word) <= slips) return 1;
  // Still typing, with a slip: compare with the start of the word.
  for (const n of [typed.length - 1, typed.length, typed.length + 1]) {
    if (n >= 3 && n < word.length && distance(typed, word.slice(0, n)) <= slips) return 1;
  }
  return 0;
}

/** How well a query fits one name; 0 = not at all. */
function score(typed: string[], name: string[]): number {
  let total = 0;
  for (const t of typed) {
    const best = Math.max(0, ...name.map((w) => fit(t, w)));
    if (best === 0) {
      // Written together or apart ("ls50meta", "ls 50"): compare without the gaps.
      return name.join('').includes(typed.join('')) ? typed.length * 1.5 : 0;
    }
    total += best;
  }
  return total;
}

export interface Match<T> {
  item: T;
  score: number;
}

/** The entries that fit a query, best first; the shorter name first when they fit equally well. */
export function findSpeakers<T extends Searchable>(list: readonly T[], query: string, limit = 20) {
  const typed = words(query);
  if (typed.length === 0) return [];
  const out: Match<T>[] = [];
  for (const item of list) {
    const names = [
      `${item.brand} ${item.model}`,
      ...(item.aka ?? []).map((a) => `${item.brand} ${a}`),
    ];
    const best = Math.max(...names.map((n) => score(typed, words(n))));
    if (best > 0) out.push({ item, score: best });
  }
  return out
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.model.length - b.item.model.length ||
        a.item.model.localeCompare(b.item.model),
    )
    .slice(0, limit)
    .map((m) => m.item);
}

/** The brands in the list, A to Z, with how many models each has (the browse list). */
export function brandsOf(list: readonly Searchable[]): { brand: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of list) counts.set(s.brand, (counts.get(s.brand) ?? 0) + 1);
  return [...counts]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => a.brand.localeCompare(b.brand));
}
