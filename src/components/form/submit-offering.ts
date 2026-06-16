import type {
  AudioMimeType,
  DevoteeSubmission,
  PresignResponse,
  StoredOffering,
} from "@/types";

/** When deployed, point this at the separate backend. Empty = use local Next.js API routes. */
const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

/** PUT a blob to a presigned URL, reporting 0–100 progress via callback. */
function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(body);
  });
}

interface OfferInput {
  submission: DevoteeSubmission;
  audio: Blob;
  mimeType: AudioMimeType;
  onProgress: (pct: number) => void;
}

/**
 * Full submission flow:
 * 1. Get presigned S3 URLs from backend (/api/upload)
 * 2. Upload audio + metadata sidecar directly to S3
 * 3. Record submission details in Google Sheets via backend (/api/record)
 */
export async function offerSession({
  submission,
  audio,
  mimeType,
  onProgress,
}: OfferInput): Promise<void> {
  // Step 1 — presign
  const presignRes = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: submission.name || "anonymous",
      contentType: mimeType,
    }),
  });

  if (!presignRes.ok) {
    const data = (await presignRes.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Could not prepare your submission.");
  }

  const { audioUrl, metadataUrl, audioKey, offeredAt } =
    (await presignRes.json()) as PresignResponse;

  // Step 2 — upload audio then metadata sidecar to S3
  await putWithProgress(audioUrl, audio, mimeType, onProgress);

  const record: StoredOffering = { ...submission, offeredAt };
  const metadataBlob = new Blob([JSON.stringify(record, null, 2)], {
    type: "application/json",
  });
  await putWithProgress(metadataUrl, metadataBlob, "application/json", () => {});

  // Step 3 — record in Google Sheets (fire-and-forget; audio already safe in S3)
  void fetch(`${API_BASE}/api/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp: offeredAt,
      name: submission.name || "Anonymous",
      email: submission.email || "",
      notes: submission.notes || "",
      durationSeconds: submission.durationSeconds ?? 0,
      audioS3Path: audioKey,
    }),
  }).catch(() => {});
}
