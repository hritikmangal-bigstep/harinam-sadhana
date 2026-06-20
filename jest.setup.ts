import "@testing-library/jest-dom";

// Polyfill structuredClone for jsdom environments that don't include it.
// fake-indexeddb requires structuredClone to store values.
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T;
}

// Polyfill Response for test files that need to mock fetch responses.
// Next.js provides this in source transforms but not in the test file environment.
if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class MockResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    private _body: string | null;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? "";
      this.ok = this.status >= 200 && this.status < 300;
      this._body = body != null ? String(body) : null;
    }

    async json(): Promise<unknown> {
      if (this._body === null) throw new Error("No body");
      return JSON.parse(this._body) as unknown;
    }

    async text(): Promise<string> {
      return this._body ?? "";
    }
  } as unknown as typeof Response;
}
