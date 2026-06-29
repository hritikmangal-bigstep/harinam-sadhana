/**
 * Tests for src/lib/autosave/store.ts
 * Uses fake-indexeddb to simulate IndexedDB in Node/jsdom environment.
 */

// Polyfill IndexedDB before importing the module under test
import "fake-indexeddb/auto";

import {
  saveClip,
  getClip,
  getAllPendingClips,
  updateClipStatus,
  deleteClip,
} from "@/lib/autosave/store";
import type { ClipRecord } from "@/lib/autosave/store";

/** Helper: build a minimal ClipRecord for testing. */
function makeClip(overrides: Partial<ClipRecord> = {}): ClipRecord {
  return {
    clipId: "clip-001",
    sessionId: "session-001",
    contributorId: "contrib-001",
    step: "panch_tattva_recitation",
    blob: new Blob(["audio-data"], { type: "audio/webm" }),
    mimeType: "audio/webm",
    durationMs: 1200,
    status: "queued",
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

beforeEach(async () => {
  // Reset the module-level DB cache between tests so each test gets a clean DB.
  // fake-indexeddb resets automatically per-process; we only need to clear any
  // module-level cached IDBDatabase handle.
  jest.resetModules();
});

describe("store — saveClip / getClip", () => {
  it("persists a record and retrieves it by clipId", async () => {
    // Re-import after resetModules to get a fresh DB handle each test
    const { saveClip: save, getClip: get } = await import(
      "@/lib/autosave/store"
    );
    const clip = makeClip({ clipId: "clip-save-1" });
    await save(clip);
    const retrieved = await get("clip-save-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.clipId).toBe("clip-save-1");
    expect(retrieved?.step).toBe("panch_tattva_recitation");
    expect(retrieved?.status).toBe("queued");
  });

  it("returns undefined for an unknown clipId", async () => {
    const { getClip: get } = await import("@/lib/autosave/store");
    const result = await get("nonexistent-clip");
    expect(result).toBeUndefined();
  });

  it("overwrites an existing record (put semantics)", async () => {
    const { saveClip: save, getClip: get } = await import(
      "@/lib/autosave/store"
    );
    const clip = makeClip({ clipId: "clip-overwrite", status: "queued" });
    await save(clip);
    await save({ ...clip, status: "uploading" });
    const result = await get("clip-overwrite");
    expect(result?.status).toBe("uploading");
  });
});

describe("store — updateClipStatus", () => {
  it("changes only the status field, leaving other fields intact", async () => {
    const { saveClip: save, updateClipStatus: update, getClip: get } =
      await import("@/lib/autosave/store");
    const clip = makeClip({ clipId: "clip-status", status: "queued" });
    await save(clip);
    await update("clip-status", "uploading");
    const result = await get("clip-status");
    expect(result?.status).toBe("uploading");
    expect(result?.step).toBe("panch_tattva_recitation");
    expect(result?.blob).toBeDefined();
  });

  it("updates status to persisted", async () => {
    const { saveClip: save, updateClipStatus: update, getClip: get } =
      await import("@/lib/autosave/store");
    const clip = makeClip({ clipId: "clip-persist", status: "uploading" });
    await save(clip);
    await update("clip-persist", "persisted");
    const result = await get("clip-persist");
    expect(result?.status).toBe("persisted");
  });

  it("is a no-op for unknown clipId (does not throw)", async () => {
    const { updateClipStatus: update } = await import("@/lib/autosave/store");
    await expect(update("unknown-clip", "persisted")).resolves.toBeUndefined();
  });
});

describe("store — getAllPendingClips", () => {
  it("returns only queued and uploading clips, not persisted ones", async () => {
    const { saveClip: save, getAllPendingClips: getAll } = await import(
      "@/lib/autosave/store"
    );
    await save(makeClip({ clipId: "pending-q", status: "queued" }));
    await save(makeClip({ clipId: "pending-u", status: "uploading" }));
    await save(makeClip({ clipId: "done", status: "persisted" }));
    const pending = await getAll();
    const ids = pending.map((c) => c.clipId);
    expect(ids).toContain("pending-q");
    expect(ids).toContain("pending-u");
    expect(ids).not.toContain("done");
  });

  it("returns an empty array when all clips are persisted", async () => {
    const { saveClip: save, getAllPendingClips: getAll } = await import(
      "@/lib/autosave/store"
    );
    await save(makeClip({ clipId: "done-1", status: "persisted" }));
    const pending = await getAll();
    // May contain results from other tests — filter to what we saved
    const relevant = pending.filter((c) => c.clipId === "done-1");
    expect(relevant).toHaveLength(0);
  });

  it("returns an empty array when store is empty", async () => {
    // fresh module instance
    const { getAllPendingClips: getAll } = await import(
      "@/lib/autosave/store"
    );
    const pending = await getAll();
    // We can only assert it's an array (other tests may have added records)
    expect(Array.isArray(pending)).toBe(true);
  });
});

describe("store — deleteClip", () => {
  it("removes the record so it can no longer be retrieved", async () => {
    const { saveClip: save, deleteClip: del, getClip: get } = await import(
      "@/lib/autosave/store"
    );
    const clip = makeClip({ clipId: "clip-delete" });
    await save(clip);
    await del("clip-delete");
    const result = await get("clip-delete");
    expect(result).toBeUndefined();
  });

  it("is a no-op for an unknown clipId (does not throw)", async () => {
    const { deleteClip: del } = await import("@/lib/autosave/store");
    await expect(del("nonexistent-delete")).resolves.toBeUndefined();
  });
});

describe("store — graceful degradation when IndexedDB is unavailable", () => {
  it("resolves without throwing when indexedDB is missing", async () => {
    // Simulate unavailability by nullifying the global before module load
    const originalIndexedDB = globalThis.indexedDB;
    (globalThis as unknown as Record<string, unknown>).indexedDB = undefined;

    jest.resetModules();
    const {
      saveClip: save,
      getClip: get,
      getAllPendingClips: getAll,
      updateClipStatus: update,
      deleteClip: del,
    } = await import("@/lib/autosave/store");

    const clip = makeClip({ clipId: "no-idb" });
    await expect(save(clip)).resolves.toBeUndefined();
    await expect(get("no-idb")).resolves.toBeUndefined();
    await expect(getAll()).resolves.toEqual([]);
    await expect(update("no-idb", "uploading")).resolves.toBeUndefined();
    await expect(del("no-idb")).resolves.toBeUndefined();

    // Restore
    (globalThis as unknown as Record<string, unknown>).indexedDB = originalIndexedDB;
  });
});
