/**
 * IndexedDB persistence layer for KWS clip autosave.
 * Degrades gracefully (no-op, no throw) when IndexedDB is unavailable.
 */

import type { RecordingStep } from "@/lib/steps";

const DB_NAME = "kws_autosave";
const STORE_NAME = "clips";
const DB_VERSION = 1;

export interface ClipRecord {
  /** Idempotency key — also the IDB store key. */
  clipId: string;
  sessionId: string;
  contributorId: string;
  step: RecordingStep;
  label?: string;
  blob: Blob;
  mimeType: string;
  durationMs?: number;
  status: "queued" | "uploading" | "persisted";
  createdAt: number;
}

// ── Internal DB handle (module singleton) ──────────────────────────────────

let _db: IDBDatabase | null = null;

/** Returns the open IDBDatabase, or null if IndexedDB is unavailable. */
async function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined" || !indexedDB) return null;
  if (_db) return _db;

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "clipId" });
      }
    };

    request.onsuccess = () => {
      _db = request.result;
      resolve(_db);
    };

    request.onerror = () => {
      // IndexedDB blocked/failed — degrade gracefully
      resolve(null);
    };
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Persist (or overwrite) a clip record in IndexedDB. */
export async function saveClip(record: ClipRecord): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a clip by its clipId, or undefined if not found. */
export async function getClip(clipId: string): Promise<ClipRecord | undefined> {
  const db = await openDB();
  if (!db) return undefined;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(clipId);
    req.onsuccess = () => resolve(req.result as ClipRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

/** Return all clips whose status is not 'persisted' (queued or uploading). */
export async function getAllPendingClips(): Promise<ClipRecord[]> {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const all = req.result as ClipRecord[];
      resolve(all.filter((c) => c.status !== "persisted"));
    };
    req.onerror = () => reject(req.error);
  });
}

/** Update the status field of an existing clip. No-op if clipId is unknown. */
export async function updateClipStatus(
  clipId: string,
  status: ClipRecord["status"],
): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(clipId);
    req.onsuccess = () => {
      const record = req.result as ClipRecord | undefined;
      if (!record) {
        resolve();
        return;
      }
      store.put({ ...record, status });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Delete a clip from IndexedDB (called after a clip is successfully persisted
 * to free storage quota).  No-op if clipId is unknown.
 */
export async function deleteClip(clipId: string): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(clipId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
