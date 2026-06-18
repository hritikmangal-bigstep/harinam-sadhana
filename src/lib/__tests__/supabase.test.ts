import { buildEnv } from "@/lib/build-env";

// Mock @supabase/supabase-js before importing the module under test.
const mockCreateClient = jest.fn().mockReturnValue({ from: jest.fn() });
jest.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

// Re-import after mocking — isolate module state between tests.
function freshGetSupabaseClient() {
  jest.resetModules();
  // Re-apply the mock in the fresh module registry.
  jest.mock("@supabase/supabase-js", () => ({
    createClient: (...args: unknown[]) => mockCreateClient(...args),
  }));
  return require("@/lib/supabase").getSupabaseClient as () => unknown; // eslint-disable-line
}

describe("getSupabaseClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockCreateClient.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws a clear error when NEXT_PUBLIC_SUPABASE_URL is absent", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const getClient = freshGetSupabaseClient();
    expect(() => getClient()).toThrow(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local.",
    );
  });

  it("throws a clear error when SUPABASE_SERVICE_ROLE_KEY is absent", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const getClient = freshGetSupabaseClient();
    expect(() => getClient()).toThrow(
      "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  });

  it("prefers process.env values over buildEnv placeholders", () => {
    const envUrl = "https://env-project.supabase.co";
    const envKey = "env-service-role-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = envUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = envKey;

    // Confirm buildEnv placeholders differ (they are empty strings by design).
    expect(buildEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("");
    expect(buildEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("");

    const getClient = freshGetSupabaseClient();
    getClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      envUrl,
      envKey,
      expect.any(Object),
    );
  });
});
