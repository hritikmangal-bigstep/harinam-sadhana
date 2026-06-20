/**
 * @jest-environment node
 */
import { POST } from "../route";

// Mock S3 so no AWS credentials or network are needed in tests.
jest.mock("@/lib/s3", () => {
  const actual = jest.requireActual("@/lib/s3");
  return {
    ...actual,
    createPresignedUploadUrls: jest.fn(async () => ({
      audioUrl: "https://s3.example/audio?sig=1",
      metadataUrl: "https://s3.example/meta?sig=1",
      audioKey: "submissions/x/2026-06-16/1.webm",
    })),
    createKwsPresignedUploadUrl: jest.fn(async () => ({
      audioUrl: "https://s3.example/kws-audio?sig=2",
      audioKey: "kws-collection/clips/hare/contrib__clipid.webm",
      audioStorageUrl: "https://bucket.s3.region.amazonaws.com/kws-collection/clips/hare/contrib__clipid.webm",
    })),
  };
});

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/upload", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

// --- Legacy path ---

describe("POST /api/upload — legacy path", () => {
  it("returns presigned URLs for a valid webm request", async () => {
    const res = await post({ name: "Radha", contentType: "audio/webm" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.audioUrl).toContain("https://s3.example/audio");
    expect(json.metadataUrl).toContain("https://s3.example/meta");
  });

  it("rejects a disallowed audio MIME type with 415", async () => {
    const res = await post({ name: "Radha", contentType: "audio/wav" });
    expect(res.status).toBe(415);
  });

  it("rejects a missing name with 400", async () => {
    const res = await post({ contentType: "audio/webm" });
    expect(res.status).toBe(400);
  });

  it("rejects an empty name with 400", async () => {
    const res = await post({ name: "  ", contentType: "audio/webm" });
    expect(res.status).toBe(400);
  });
});

// --- KWS path ---

describe("POST /api/upload — KWS path", () => {
  it("returns KWS presign response for isolated_keyword with label", async () => {
    const res = await post({
      step: "isolated_keyword",
      contentType: "audio/webm",
      contributorId: "contrib-123",
      clipId: "clip-uuid-abc",
      label: "hare",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.audioUrl).toBeDefined();
    expect(json.audioKey).toBeDefined();
    expect(json.audioStorageUrl).toBeDefined();
    // Must not include legacy fields
    expect(json.metadataUrl).toBeUndefined();
    expect(json.offeredAt).toBeUndefined();
  });

  it("returns 200 for panch_tattva_recitation without label", async () => {
    const res = await post({
      step: "panch_tattva_recitation",
      contentType: "audio/webm",
      contributorId: "contrib-123",
      clipId: "clip-uuid-def",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.audioUrl).toBeDefined();
    expect(json.audioKey).toBeDefined();
    expect(json.audioStorageUrl).toBeDefined();
  });

  it("returns 400 for isolated_keyword missing label", async () => {
    const res = await post({
      step: "isolated_keyword",
      contentType: "audio/webm",
      contributorId: "contrib-123",
      clipId: "clip-uuid-ghi",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unknown step value", async () => {
    const res = await post({
      step: "unknown_step",
      contentType: "audio/webm",
      contributorId: "contrib-123",
      clipId: "clip-uuid-jkl",
    });
    expect(res.status).toBe(400);
  });

  it("returns 415 for a disallowed contentType", async () => {
    const res = await post({
      step: "mahamantra_round",
      contentType: "audio/wav",
      contributorId: "contrib-123",
      clipId: "clip-uuid-mno",
    });
    expect(res.status).toBe(415);
  });

  it("returns 400 when contributorId is missing", async () => {
    const res = await post({
      step: "mahamantra_round",
      contentType: "audio/webm",
      clipId: "clip-uuid-pqr",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when clipId is missing", async () => {
    const res = await post({
      step: "mahamantra_round",
      contentType: "audio/webm",
      contributorId: "contrib-123",
    });
    expect(res.status).toBe(400);
  });
});
