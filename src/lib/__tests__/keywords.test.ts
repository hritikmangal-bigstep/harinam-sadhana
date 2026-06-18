import { KEYWORDS, KEYWORD_LABELS, pickFewestTaken } from "../keywords";

describe("KEYWORDS catalog", () => {
  it("contains exactly 14 keywords", () => {
    expect(KEYWORDS).toHaveLength(14);
  });

  it("every keyword has devanagari and transliteration populated", () => {
    for (const kw of KEYWORDS) {
      expect(kw.devanagari.trim()).not.toBe("");
      expect(kw.transliteration.trim()).not.toBe("");
    }
  });

  it("every label appears in KEYWORD_LABELS", () => {
    for (const kw of KEYWORDS) {
      expect(KEYWORD_LABELS).toContain(kw.label);
    }
  });
});

describe("pickFewestTaken", () => {
  it("returns a keyword when takeCounts is empty (all tied at 0)", () => {
    const result = pickFewestTaken({});
    expect(result).toBeDefined();
    expect(result.label).toBeTruthy();
    expect(KEYWORD_LABELS).toContain(result.label);
  });

  it("is deterministic — always returns alphabetically first when all counts are equal", () => {
    const first = pickFewestTaken({});
    const second = pickFewestTaken({});
    expect(first.label).toBe(second.label);

    // The alphabetically first label across all 14 keywords is "advaita"
    expect(first.label).toBe("advaita");
  });

  it("does not pick 'hare' when hare has 5 takes and all others have 0", () => {
    const result = pickFewestTaken({ hare: 5 });
    expect(result.label).not.toBe("hare");
    expect(KEYWORD_LABELS).toContain(result.label);
  });

  it("returns alphabetically first when all keywords have the same non-zero count", () => {
    const counts: Record<string, number> = {};
    for (const kw of KEYWORDS) counts[kw.label] = 10;
    const result = pickFewestTaken(counts);
    expect(result.label).toBe("advaita");
  });

  it("result label always exists in KEYWORDS", () => {
    const counts: Record<string, number> = { hare: 5, krishna: 3, rama: 7 };
    const result = pickFewestTaken(counts);
    expect(KEYWORD_LABELS).toContain(result.label);
  });

  it("picks the keyword with the strictly fewest takes", () => {
    const counts: Record<string, number> = {};
    for (const kw of KEYWORDS) counts[kw.label] = 10;
    counts["srivasa"] = 2; // fewest
    const result = pickFewestTaken(counts);
    expect(result.label).toBe("srivasa");
  });
});
