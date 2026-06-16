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

describe("POST /api/upload", () => {
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
