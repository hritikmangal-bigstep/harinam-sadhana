/**
 * @jest-environment node
 */
import { POST } from "../route";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// runConfirmForClip calls from("recordings") twice:
//   1. .select("s3_key").eq("clip_id", clipId).single()  → look up the S3 key
//   2. .update({...}).eq("clip_id", clipId)              → write ASR result

const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn();
const mockSelectSingle = jest.fn();
const mockSelectEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockGetSupabaseClient = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => mockGetSupabaseClient(),
}));

const mockCreatePresignedGetUrl = jest.fn().mockResolvedValue("https://s3.example/audio.webm?sig=test");

jest.mock("@/lib/s3", () => ({
  createPresignedGetUrl: (...args: unknown[]) => mockCreatePresignedGetUrl(...args),
}));

// Keywords catalog — use real implementation so matching logic is tested end-to-end.
jest.mock("@/lib/keywords", () => jest.requireActual("@/lib/keywords"));

// ── Helpers ───────────────────────────────────────────────────────────────────

const FAKE_AUDIO_BYTES = new Uint8Array([0, 1, 2, 3]);
const FAKE_AUDIO_B64 = Buffer.from(FAKE_AUDIO_BYTES).toString("base64");

function makeS3Fetch(ok = true) {
  return async (url: string) => {
    if (url.startsWith("https://s3.example/")) {
      if (!ok) return new Response(null, { status: 403 });
      return new Response(FAKE_AUDIO_BYTES.buffer, { status: 200 });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
}

function makeAsrFetch(transcript: string, confidence: number) {
  return async (url: string, init?: RequestInit) => {
    if (url.endsWith("/transcribe")) {
      const body = JSON.parse(init?.body as string) as { audio_b64: string };
      expect(body.audio_b64).toBe(FAKE_AUDIO_B64);
      return new Response(JSON.stringify({ transcript, confidence }), { status: 200 });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
}

function makeErroringAsrFetch() {
  return async (url: string) => {
    if (url.endsWith("/transcribe")) throw new Error("Connection refused");
    throw new Error(`Unexpected fetch: ${url}`);
  };
}

function combinedFetch(s3Ok: boolean, asrFetch: (url: string, init?: RequestInit) => Promise<Response>) {
  return async (url: string, init?: RequestInit) => {
    if (url.startsWith("https://s3.example/")) {
      if (!s3Ok) return new Response(null, { status: 403 });
      return new Response(FAKE_AUDIO_BYTES.buffer, { status: 200 });
    }
    return asrFetch(url, init);
  };
}

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const VALID_BODY = { clipId: "clip-001", label: "hare", s3Key: "kws-collection/clips/hare/x.webm" };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/confirm", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Update chain: supabase.from("recordings").update({...}).eq("clip_id", clipId)
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    // Select chain: supabase.from("recordings").select("s3_key").eq("clip_id", clipId).single()
    mockSelectSingle.mockResolvedValue({ data: { s3_key: "kws-collection/clips/hare/x.webm" }, error: null });
    mockSelectEq.mockReturnValue({ single: mockSelectSingle });
    mockSelect.mockReturnValue({ eq: mockSelectEq });

    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
    mockGetSupabaseClient.mockReturnValue({ from: mockFrom });

    process.env = {
      ...originalEnv,
      TRANSCRIPTION_SERVICE_URL: "http://localhost:8081",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // 1. Matching transcript, confidence ≥ 0.5 → confirmed
  it("sets asr_status=confirmed and asr_confidence when transcript matches and confidence ≥ 0.5", async () => {
    global.fetch = combinedFetch(true, makeAsrFetch("हरे", 0.94)) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);

    expect(mockFrom).toHaveBeenCalledWith("recordings");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asr_status: "confirmed", asr_confidence: 0.94 }),
    );
    // Transcript must NOT appear in the update payload
    const updateArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg).not.toHaveProperty("transcript");
    expect(mockUpdate().eq).toHaveBeenCalledWith("clip_id", "clip-001");
  });

  // Transliteration match also works
  it("sets asr_status=confirmed when transliteration matches label", async () => {
    global.fetch = combinedFetch(true, makeAsrFetch("hare", 0.85)) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asr_status: "confirmed" }),
    );
  });

  // 2. Mismatched transcript → uncertain
  it("sets asr_status=uncertain when transcript does not match label", async () => {
    global.fetch = combinedFetch(true, makeAsrFetch("कृष्ण", 0.91)) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asr_status: "uncertain", asr_confidence: 0.91 }),
    );
    const updateArg = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg).not.toHaveProperty("transcript");
  });

  // 3. Low confidence (< 0.5) → uncertain, regardless of transcript content
  it("sets asr_status=uncertain when confidence is below threshold even if transcript matches", async () => {
    global.fetch = combinedFetch(true, makeAsrFetch("हरे", 0.3)) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asr_status: "uncertain", asr_confidence: 0.3 }),
    );
  });

  // 4. Transcription service unreachable → no UPDATE, returns 200
  it("does not call UPDATE and returns 200 when ASR service is unreachable", async () => {
    global.fetch = combinedFetch(true, makeErroringAsrFetch()) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // 5. TRANSCRIPTION_SERVICE_URL not set → no UPDATE, returns 200
  it("does not call UPDATE and returns 200 when TRANSCRIPTION_SERVICE_URL is not set", async () => {
    delete process.env.TRANSCRIPTION_SERVICE_URL;
    global.fetch = makeS3Fetch(true) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // 6. S3 fetch fails → no UPDATE, returns 200
  it("does not call UPDATE and returns 200 when S3 audio fetch fails", async () => {
    global.fetch = combinedFetch(false, makeAsrFetch("हरे", 0.9)) as typeof fetch;

    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // Body validation — invalid body returns 200 silently
  it("returns 200 when body is missing required fields", async () => {
    const res = await post({ clipId: "clip-001" });
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 when body is not JSON parseable", async () => {
    const res = await POST(
      new Request("http://localhost/api/confirm", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // Multi-word label matching (e.g. hare_krishna)
  it("matches devanagari for multi-word labels like hare_krishna", async () => {
    global.fetch = combinedFetch(true, makeAsrFetch("हरे कृष्ण", 0.88)) as typeof fetch;

    const res = await post({ clipId: "clip-002", label: "hare_krishna", s3Key: "kws-collection/clips/hare_krishna/x.webm" });
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asr_status: "confirmed", asr_confidence: 0.88 }),
    );
  });

  it("matches transliteration for multi-word labels like hare_krishna", async () => {
    global.fetch = combinedFetch(true, makeAsrFetch("hare krishna", 0.75)) as typeof fetch;

    const res = await post({ clipId: "clip-003", label: "hare_krishna", s3Key: "kws-collection/clips/hare_krishna/x.webm" });
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ asr_status: "confirmed" }),
    );
  });
});
