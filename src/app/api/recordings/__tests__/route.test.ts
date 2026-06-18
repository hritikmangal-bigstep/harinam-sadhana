/**
 * @jest-environment node
 */
import { POST } from "../route";

const mockUpsert = jest.fn();
const mockSingle = jest.fn();

// Suppress the fire-and-forget fetch to /api/confirm — no server runs in tests.
global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);

jest.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({
    from: (table: string) => ({
      upsert: (data: unknown, opts?: unknown) => {
        const override = mockUpsert(table, data, opts);
        if (table === "recordings") {
          return {
            select: () => ({
              single: () => mockSingle(),
            }),
          };
        }
        return override ?? { data: null, error: null };
      },
    }),
  }),
}));

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request("http://localhost/api/recordings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const basePayload = {
  clipId: "clip-uuid-001",
  sessionId: "session-uuid-001",
  contributorId: "contributor-uuid-001",
  step: "isolated_keyword",
  label: "Hare",
  s3Key: "kws/contributor-uuid-001/clip-uuid-001.webm",
  mimeType: "audio/webm",
  durationMs: 1500,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSingle.mockResolvedValue({ data: { id: 42 }, error: null });
  mockUpsert.mockImplementation((table: string) => {
    if (table === "recordings") {
      return {
        select: () => ({
          single: () => mockSingle(),
        }),
      };
    }
    return { data: null, error: null };
  });
});

describe("POST /api/recordings", () => {
  test("1. Valid isolated_keyword payload → 201 with id and clipId", async () => {
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ id: 42, clipId: "clip-uuid-001" });
    expect(mockUpsert).toHaveBeenCalledWith(
      "collection_sessions",
      expect.objectContaining({ id: "session-uuid-001" }),
      expect.any(Object)
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      "recordings",
      expect.objectContaining({
        clip_id: "clip-uuid-001",
        step: "isolated_keyword",
        label: "Hare",
      }),
      expect.any(Object)
    );
  });

  test("2. Valid recitation payload (no label) → 201", async () => {
    const { label: _removed, ...rest } = basePayload;
    const payload = { ...rest, step: "panch_tattva_recitation" };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.clipId).toBe("clip-uuid-001");
    expect(mockUpsert).toHaveBeenCalledWith(
      "recordings",
      expect.objectContaining({ step: "panch_tattva_recitation", label: null }),
      expect.any(Object)
    );
  });

  test("3. Re-POST same clipId (idempotent) → still 201", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.clipId).toBe("clip-uuid-001");
  });

  test("4. Missing clipId → 400", async () => {
    const { clipId: _removed, ...payload } = basePayload;
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/clipId/);
  });

  test("5. isolated_keyword missing label → 400", async () => {
    const { label: _removed, ...payload } = basePayload;
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/label/);
  });

  test("6. Unknown step value → 400", async () => {
    const payload = { ...basePayload, step: "unknown_step" };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/step/);
  });

  test("7. Invalid mimeType (audio/ogg) → 400", async () => {
    const payload = { ...basePayload, mimeType: "audio/ogg" };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/mimeType/);
  });

  test("8. Supabase error on session upsert → 500 with safe message", async () => {
    mockUpsert.mockImplementationOnce(() => ({
      data: null,
      error: { message: "DB error" },
    }));
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to persist session");
  });

  test("9. recorded_at in recordings upsert is server-derived ISO string", async () => {
    await POST(makeRequest(basePayload));
    const recordingsCall = (mockUpsert as jest.Mock).mock.calls.find(
      (call: unknown[]) => call[0] === "recordings"
    );
    expect(recordingsCall).toBeDefined();
    const data = recordingsCall![1] as Record<string, unknown>;
    expect(typeof data["recorded_at"]).toBe("string");
    const parsed = new Date(data["recorded_at"] as string);
    expect(parsed.toISOString()).toBe(data["recorded_at"]);
  });
});
