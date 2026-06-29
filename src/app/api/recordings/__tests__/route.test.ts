/**
 * @jest-environment node
 */
import { POST } from "../route";

const mockUpsert = jest.fn();
const mockEq = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      upsert: mockUpsert,
      update: (data: unknown) => ({ eq: (col: string, val: string) => mockEq(data, col, val) }),
    }),
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/recordings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const basePayload = {
  clipId: "clip-uuid-001",
  sessionId: "session-uuid-001",
  contributorId: "contributor-uuid-001",
  step: "panch_tattva_recitation",
  s3Key: "kws/contributor-uuid-001/clip-uuid-001.webm",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockReturnValue({ data: null, error: null });
  mockEq.mockReturnValue({ data: null, error: null });
});

describe("POST /api/recordings", () => {
  test("1. Valid panch_tattva_recitation → 201, upserts session, updates part1_s3_key", async () => {
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.clipId).toBe("clip-uuid-001");
    expect(mockUpsert).toHaveBeenCalledWith(
      { id: "session-uuid-001", contributor_id: "contributor-uuid-001" },
      { onConflict: "id", ignoreDuplicates: true },
    );
    expect(mockEq).toHaveBeenCalledWith(
      expect.objectContaining({ part1_s3_key: "kws/contributor-uuid-001/clip-uuid-001.webm" }),
      "id",
      "session-uuid-001",
    );
  });

  test("2. Valid mahamantra_round → 201, updates part2_s3_key", async () => {
    const res = await POST(makeRequest({ ...basePayload, step: "mahamantra_round" }));
    expect(res.status).toBe(201);
    expect(mockEq).toHaveBeenCalledWith(
      expect.objectContaining({ part2_s3_key: "kws/contributor-uuid-001/clip-uuid-001.webm" }),
      "id",
      "session-uuid-001",
    );
  });

  test("3. Re-POST same clipId (idempotent) → still 201", async () => {
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(201);
    expect((await res.json()).clipId).toBe("clip-uuid-001");
  });

  test("4. Missing clipId → 400", async () => {
    const { clipId: _removed, ...payload } = basePayload;
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/clipId/);
  });

  test("5. Unknown step value → 400", async () => {
    const res = await POST(makeRequest({ ...basePayload, step: "unknown_step" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/step/);
  });

  test("6. Missing s3Key → 400", async () => {
    const { s3Key: _removed, ...payload } = basePayload;
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/s3Key/);
  });

  test("7. Supabase session upsert error → 500", async () => {
    mockUpsert.mockReturnValueOnce({ data: null, error: { message: "DB error" } });
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to persist session");
  });

  test("8. Supabase update error → 500", async () => {
    mockEq.mockReturnValueOnce({ data: null, error: { message: "Update error" } });
    const res = await POST(makeRequest(basePayload));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to persist recording");
  });

  test("9. Session name/email included in update data", async () => {
    const payload = { ...basePayload, session: { name: "Devotee", email: "dev@example.com" } };
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(201);
    expect(mockEq).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Devotee", email: "dev@example.com" }),
      "id",
      "session-uuid-001",
    );
  });
});
