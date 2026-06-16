import type {
  AudioMimeType,
  DevoteeSubmission,
  PresignResponse,
  StoredOffering,
} from "@/types";

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
    xhr.onerror = () => reject(new Error("Network error during offering."));
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
 * Full offering flow: request presigned URLs server-side, then upload the
 * audio + a JSON metadata sidecar directly to S3. Audio progress drives the ring.
 */
export async function offerSession({
  submission,
  audio,
  mimeType,
  onProgress,
}: OfferInput): Promise<void> {
  const presignRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: submission.name,
      contentType: mimeType,
    }),
  });

  if (!presignRes.ok) {
    const data = (await presignRes.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "Could not prepare your offering.");
  }

  const { audioUrl, metadataUrl, offeredAt } =
    (await presignRes.json()) as PresignResponse;

  await putWithProgress(audioUrl, audio, mimeType, onProgress);

  // Store the offering with its server-generated date-time stamp.
  const record: StoredOffering = { ...submission, offeredAt };
  const metadataBlob = new Blob([JSON.stringify(record, null, 2)], {
    type: "application/json",
  });
  await putWithProgress(metadataUrl, metadataBlob, "application/json", () => {});
}
