import { getContributorId } from "../contributor-id";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("getContributorId", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        get length() {
          return store.size;
        },
        key: (index: number) => Array.from(store.keys())[index] ?? null,
      },
      writable: true,
    });
  });

  it("mints and stores a UUID when localStorage is empty", () => {
    const id = getContributorId();

    expect(id).toBeTruthy();
    expect(id).toMatch(UUID_REGEX);
    expect(store.get("kws_contributor_id")).toBe(id);
  });

  it("returns the same ID on subsequent calls without creating a new one", () => {
    const first = getContributorId();
    const second = getContributorId();

    expect(second).toBe(first);
    expect(store.size).toBe(1);
  });

  it("produces a valid UUID v4 format", () => {
    const id = getContributorId();

    expect(id).toMatch(UUID_REGEX);
  });
});
