export interface Keyword {
  label: string;
  devanagari: string;
  transliteration: string;
  keywordSet: "maha_mantra" | "panch_tattva";
  targetTakes: number;
  /** Minimum acceptable recording duration in milliseconds. */
  minDurationMs: number;
  /** Fixed auto-recording window in milliseconds (matches Python collect_labels.py). */
  recordWindowMs: number;
}

export const KEYWORDS: Keyword[] = [
  // maha_mantra set — single words
  {
    label: "hare",
    devanagari: "हरे",
    transliteration: "hare",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "krishna",
    devanagari: "कृष्ण",
    transliteration: "krishna",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "rama",
    devanagari: "राम",
    transliteration: "rama",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  // maha_mantra set — phrases
  {
    label: "hare_krishna",
    devanagari: "हरे कृष्ण",
    transliteration: "hare krishna",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 1500,
    recordWindowMs: 3000,
  },
  {
    label: "hare_rama",
    devanagari: "हरे राम",
    transliteration: "hare rama",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 1500,
    recordWindowMs: 3000,
  },
  {
    label: "krishna_krishna",
    devanagari: "कृष्ण कृष्ण",
    transliteration: "krishna krishna",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 1500,
    recordWindowMs: 2500,
  },
  {
    label: "rama_rama",
    devanagari: "राम राम",
    transliteration: "rama rama",
    keywordSet: "maha_mantra",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 2500,
  },
  // panch_tattva set — all single words
  {
    label: "advaita",
    devanagari: "अद्वैत",
    transliteration: "advaita",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "chaitanya",
    devanagari: "चैतन्य",
    transliteration: "chaitanya",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "gadadhara",
    devanagari: "गदाधर",
    transliteration: "gadadhara",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "jaya",
    devanagari: "जय",
    transliteration: "jaya",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "nityananda",
    devanagari: "नित्यानन्द",
    transliteration: "nityananda",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "sri",
    devanagari: "श्री",
    transliteration: "sri",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
  {
    label: "srivasa",
    devanagari: "श्रीवास",
    transliteration: "srivasa",
    keywordSet: "panch_tattva",
    targetTakes: 2,
    minDurationMs: 800,
    recordWindowMs: 1800,
  },
];

/** All unique keyword labels. */
export const KEYWORD_LABELS: string[] = KEYWORDS.map((k) => k.label);

/**
 * Returns the keyword with the fewest takes recorded so far.
 * Ties are broken by label alphabetically for deterministic results.
 * Missing keys in `takeCounts` are treated as 0.
 */
export function pickFewestTaken(takeCounts: Record<string, number>): Keyword {
  const sorted = [...KEYWORDS].sort((a, b) => {
    const countA = takeCounts[a.label] ?? 0;
    const countB = takeCounts[b.label] ?? 0;
    if (countA !== countB) return countA - countB;
    return a.label.localeCompare(b.label);
  });
  return sorted[0];
}
