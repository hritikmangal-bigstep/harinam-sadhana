import { slugify, buildKeys, buildKwsKey, isAcceptedAudioType } from "@/lib/s3";

describe("s3 helpers", () => {
  describe("slugify", () => {
    it("lowercases and hyphenates names", () => {
      expect(slugify("Radha Devi Dasi")).toBe("radha-devi-dasi");
    });
    it("strips punctuation and trims", () => {
      expect(slugify("  Krishna_das!!  ")).toBe("krishna-das");
    });
    it("falls back to anonymous when empty", () => {
      expect(slugify("!!!")).toBe("anonymous");
    });
  });

  describe("isAcceptedAudioType", () => {
    it("accepts webm and mp4", () => {
      expect(isAcceptedAudioType("audio/webm")).toBe(true);
      expect(isAcceptedAudioType("audio/mp4")).toBe(true);
    });
    it("rejects everything else", () => {
      expect(isAcceptedAudioType("audio/wav")).toBe(false);
      expect(isAcceptedAudioType("video/mp4")).toBe(false);
      expect(isAcceptedAudioType("")).toBe(false);
    });
  });

  describe("buildKeys", () => {
    it("builds the documented key structure with matching extension", () => {
      const { audioKey, metadataKey } = buildKeys(
        "Radha Devi",
        "2026-06-16",
        "audio/webm",
      );
      expect(audioKey).toMatch(
        /^submissions\/radha-devi\/2026-06-16\/\d+\.webm$/,
      );
      expect(metadataKey).toMatch(
        /^submissions\/radha-devi\/2026-06-16\/\d+\.json$/,
      );
    });
    it("uses m4a for mp4 recordings", () => {
      const { audioKey } = buildKeys("A", "2026-06-16", "audio/mp4");
      expect(audioKey).toMatch(/\.m4a$/);
    });
    it("always produces a submissions/... prefix (legacy path regression)", () => {
      const { audioKey } = buildKeys("Dev", "2026-06-18", "audio/webm");
      expect(audioKey.startsWith("submissions/")).toBe(true);
    });
  });

  describe("buildKwsKey", () => {
    it("panch_tattva_recitation produces panch-tattva recitations path", () => {
      const key = buildKwsKey(
        "panch_tattva_recitation",
        "contrib",
        "clipid",
        "audio/webm",
      );
      expect(key).toBe(
        "kws-collection/recitations/panch-tattva/contrib/clipid.webm",
      );
    });

    it("mahamantra_round produces mahamantra recitations path", () => {
      const key = buildKwsKey(
        "mahamantra_round",
        "contrib",
        "clipid",
        "audio/webm",
      );
      expect(key).toBe(
        "kws-collection/recitations/mahamantra/contrib/clipid.webm",
      );
    });

    it("uses m4a extension for mp4 content type", () => {
      const key = buildKwsKey(
        "panch_tattva_recitation",
        "contrib",
        "clipid",
        "audio/mp4",
      );
      expect(key).toMatch(/\.m4a$/);
    });
  });
});
