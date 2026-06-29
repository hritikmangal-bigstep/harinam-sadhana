/**
 * Background upload queue for KWS clip autosave.
 *
 * Lifecycle per clip:
 *   queued → uploading → (S3 PUT ok) → (POST /api/recordings ok) → persisted → evicted
 *
 * Supports:
 * - Up to 2 concurrent uploads
 * - Exponential backoff retry on failure (1s, 2s, 4s … 30s max)
 * - Resume on 'online' event
 * - drainStep(n): awaits all clips for a given step number
 */

import type { RecordingStep } from "@/lib/steps";
import {
  saveClip,
  updateClipStatus,
  deleteClip,
  getAllPendingClips,
} from "@/lib/autosave/store";
import type { ClipRecord } from "@/lib/autosave/store";
import { RECORDING_STEP_TO_NUMBER, STEP_TO_RECORDING_STEP } from "@/lib/steps";

export type { ClipRecord };

// ── Config ─────────────────────────────────────────────────────────────────

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const MAX_CONCURRENCY = 2;
const MAX_UPLOAD_ATTEMPTS = 10;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

// ── State ──────────────────────────────────────────────────────────────────

/** Queue of clips waiting to be uploaded. */
const queue: ClipRecord[] = [];

/** clipIds currently being uploaded. */
const inFlight = new Set<string>();

/** Track which step each in-flight clipId belongs to (declared before notifyDrainIfDone). */
const inFlightStepMap = new Map<string, RecordingStep>();

/** clipIds already persisted this session (dedup guard). */
const persisted = new Set<string>();

/** Drain waiters per step number (1–4). */
const drainWaiters = new Map<
  number,
  Array<() => void>
>();

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS);
}

/** Notify any drainStep waiters once a clip's step has no remaining work. */
function notifyDrainIfDone(stepNumber: number): void {
  const stepEnum = STEP_TO_RECORDING_STEP[stepNumber as 1 | 2];
  if (!stepEnum) return;
  const hasPending = queue.some((c) => c.step === stepEnum);
  const inFlightForStep = [...inFlight].filter((id) => inFlightStepMap.get(id) === stepEnum);

  if (!hasPending && inFlightForStep.length === 0) {
    const waiters = drainWaiters.get(stepNumber) ?? [];
    drainWaiters.set(stepNumber, []);
    waiters.forEach((resolve) => resolve());
  }
}

// ── Core upload logic ──────────────────────────────────────────────────────

async function uploadClip(clip: ClipRecord): Promise<void> {
  if (persisted.has(clip.clipId)) {
    await deleteClip(clip.clipId);
    return;
  }

  await updateClipStatus(clip.clipId, "uploading");

  // Step 1 — presign
  const presignRes = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step: clip.step,
      contentType: clip.mimeType,
      contributorId: clip.contributorId,
      clipId: clip.clipId,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!presignRes.ok) {
    throw new Error(`Presign failed (${presignRes.status})`);
  }

  const { audioUrl, audioKey } = (await presignRes.json()) as { audioUrl: string; audioKey: string };

  // Step 2 — PUT blob to S3
  const putRes = await fetch(audioUrl, {
    method: "PUT",
    headers: { "Content-Type": clip.mimeType },
    body: clip.blob,
    signal: AbortSignal.timeout(120_000),
  });

  if (!putRes.ok) {
    throw new Error(`S3 PUT failed (${putRes.status})`);
  }

  // Step 3 — POST metadata to /api/recordings (persists S3 key to collection_sessions)
  const recordingsRes = await fetch(`${API_BASE}/api/recordings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clipId: clip.clipId,
      sessionId: clip.sessionId,
      contributorId: clip.contributorId,
      step: clip.step,
      s3Key: audioKey,
      durationMs: clip.durationMs,
      session: (clip.name || clip.email)
        ? { name: clip.name, email: clip.email }
        : undefined,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!recordingsRes.ok) {
    throw new Error(`/api/recordings failed (${recordingsRes.status})`);
  }

  // Mark persisted, evict blob
  persisted.add(clip.clipId);
  await updateClipStatus(clip.clipId, "persisted");
  await deleteClip(clip.clipId);
}

/** Process one clip with exponential backoff retry, capped at MAX_UPLOAD_ATTEMPTS. */
async function processWithRetry(clip: ClipRecord): Promise<void> {
  let attempt = 0;
  while (!persisted.has(clip.clipId)) {
    try {
      await uploadClip(clip);
      return;
    } catch {
      attempt++;
      // Check the limit before sleeping so we don't waste backoff time on eviction.
      if (attempt >= MAX_UPLOAD_ATTEMPTS) {
        await deleteClip(clip.clipId);
        return;
      }
      await sleep(backoffMs(attempt - 1));
    }
  }
}

// ── Queue pump ─────────────────────────────────────────────────────────────

let pumpScheduled = false;

function pumpQueue(): void {
  if (pumpScheduled) return;
  pumpScheduled = true;
  // Use a microtask so callers can enqueue multiple clips before the pump runs
  void Promise.resolve().then(async () => {
    pumpScheduled = false;
    while (queue.length > 0 && inFlight.size < MAX_CONCURRENCY) {
      const clip = queue.shift();
      if (!clip) break;
      if (persisted.has(clip.clipId) || inFlight.has(clip.clipId)) {
        // Already being processed or done — notify drain anyway
        const stepNum = RECORDING_STEP_TO_NUMBER[clip.step];
        notifyDrainIfDone(stepNum);
        continue;
      }

      inFlight.add(clip.clipId);
      inFlightStepMap.set(clip.clipId, clip.step);

      void processWithRetry(clip).finally(() => {
        inFlight.delete(clip.clipId);
        inFlightStepMap.delete(clip.clipId);
        const stepNum = RECORDING_STEP_TO_NUMBER[clip.step];
        notifyDrainIfDone(stepNum);
        // Try to pick up the next item
        pumpQueue();
      });
    }
  });
}

// ── Online event listener ──────────────────────────────────────────────────

if (typeof window !== "undefined") {
  const w = window as typeof window & { __kwsPumpOnline?: () => void };
  if (w.__kwsPumpOnline) window.removeEventListener("online", w.__kwsPumpOnline);
  w.__kwsPumpOnline = pumpQueue;
  window.addEventListener("online", pumpQueue);
}

// ── Rehydration on startup ──────────────────────────────────────────────────

void getAllPendingClips().then((clips) => {
  for (const clip of clips) {
    if (!persisted.has(clip.clipId) && !inFlight.has(clip.clipId)) {
      // Guard against double-enqueue if saveAndEnqueue raced with rehydration.
      const alreadyQueued = queue.some((c) => c.clipId === clip.clipId);
      if (!alreadyQueued) {
        queue.push({ ...clip, status: "queued" });
      }
    }
  }
  pumpQueue();
});

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Save a clip to IndexedDB and immediately enqueue it for background upload.
 * Returns as soon as the clip is saved to IndexedDB — upload happens in the background.
 * If the IDB write fails, the clip is still pushed to the in-memory queue so it
 * uploads during this session (though it won't survive a page reload).
 */
export async function saveAndEnqueue(clip: ClipRecord): Promise<void> {
  try {
    await saveClip(clip);
  } catch {
    // IDB failure — push to in-memory queue anyway so upload runs this session.
  }
  if (!persisted.has(clip.clipId) && !inFlight.has(clip.clipId)) {
    const alreadyQueued = queue.some((c) => c.clipId === clip.clipId);
    if (!alreadyQueued) {
      queue.push(clip);
    }
  }
  pumpQueue();
}

/**
 * Cancel any pending drainStep waiters for a step.
 * Call after a drain timeout so abandoned resolve callbacks don't accumulate.
 */
export function cancelDrain(stepNumber: 1 | 2): void {
  drainWaiters.delete(stepNumber);
}

/**
 * Await all in-flight and queued uploads for clips belonging to the given step number.
 * Called by "Save & Continue" before advancing to the next step.
 */
export function drainStep(stepNumber: 1 | 2): Promise<void> {
  const stepEnum = STEP_TO_RECORDING_STEP[stepNumber];
  const hasWork =
    queue.some((c) => c.step === stepEnum) ||
    [...inFlight].some((id) => inFlightStepMap.get(id) === stepEnum);

  if (!hasWork) return Promise.resolve();

  return new Promise((resolve) => {
    const existing = drainWaiters.get(stepNumber) ?? [];
    drainWaiters.set(stepNumber, [...existing, resolve]);
    // Ensure the pump is running
    pumpQueue();
  });
}
