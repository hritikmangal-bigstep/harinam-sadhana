import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AudioMimeType } from "@/types";
import { buildEnv } from "./build-env";
import { RECITATION_STEP_PREFIXES, type RecordingStep } from "./steps";

/** Presigned upload URLs expire after 8 minutes. */
const PRESIGN_EXPIRY_SECONDS = 8 * 60;

const ACCEPTED_AUDIO_TYPES: readonly AudioMimeType[] = [
  "audio/webm",
  "audio/mp4",
];

export function isAcceptedAudioType(value: string): value is AudioMimeType {
  return (ACCEPTED_AUDIO_TYPES as readonly string[]).includes(value);
}

/**
 * process.env takes precedence (local dev via .env.local).
 * buildEnv is the compile-time fallback baked in during Amplify preBuild.
 */
function getS3Config() {
  const region = process.env.S3_REGION || buildEnv.S3_REGION;
  const bucket = process.env.S3_BUCKET || buildEnv.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || buildEnv.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || buildEnv.S3_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 is not configured. Set S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env.local.",
    );
  }

  return { region, bucket, accessKeyId, secretAccessKey };
}

let cachedClient: S3Client | null = null;

function getClient(region: string, accessKeyId: string, secretAccessKey: string) {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      // Only compute checksums when S3 requires them — prevents a CRC32
      // placeholder being embedded in presigned URLs that mismatches the
      // actual payload uploaded by the browser.
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }
  return cachedClient;
}

/** URL-safe slug for a devotee name used in the S3 key path. */
export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "anonymous"
  );
}

/** Audio extension for an accepted MIME type. */
function extensionFor(contentType: AudioMimeType): string {
  return contentType === "audio/mp4" ? "m4a" : "webm";
}

/**
 * Builds the S3 key pair (audio + metadata sidecar) for a submission.
 * Structure: submissions/{devotee-name}/{YYYY-MM-DD}/{timestamp}.{ext}
 */
export function buildKeys(
  name: string,
  date: string,
  contentType: AudioMimeType,
  stamp: number = Date.now(),
) {
  const base = `submissions/${slugify(name)}/${date}/${stamp}`;
  return {
    audioKey: `${base}.${extensionFor(contentType)}`,
    metadataKey: `${base}.json`,
  };
}

/** Generate a presigned GET URL so a private S3 object can be streamed. */
export async function createPresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  const { region, bucket, accessKeyId, secretAccessKey } = getS3Config();
  const client = getClient(region, accessKeyId, secretAccessKey);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/** Generate a single presigned PUT URL for an object. */
async function presignPut(key: string, contentType: string): Promise<string> {
  const { region, bucket, accessKeyId, secretAccessKey } = getS3Config();
  const client = getClient(region, accessKeyId, secretAccessKey);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  // Disable SDK auto-checksum so the presigned URL doesn't embed a CRC32
  // placeholder that mismatches the real payload the browser uploads.
  return getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
}

/**
 * Presigns both the audio object and its JSON metadata sidecar for one offering.
 */
export async function createPresignedUploadUrls(
  name: string,
  date: string,
  contentType: AudioMimeType,
  stamp: number = Date.now(),
): Promise<{ audioUrl: string; metadataUrl: string; audioKey: string; audioStorageUrl: string }> {
  const { audioKey, metadataKey } = buildKeys(name, date, contentType, stamp);
  const { region, bucket } = getS3Config();
  const [audioUrl, metadataUrl] = await Promise.all([
    presignPut(audioKey, contentType),
    presignPut(metadataKey, "application/json"),
  ]);
  const audioStorageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${audioKey}`;
  return { audioUrl, metadataUrl, audioKey, audioStorageUrl };
}

/**
 * Build the S3 key for a KWS clip.
 * - isolated_keyword  → kws-collection/clips/{label}/{contributorId}__{clipId}.{ext}
 * - recitation steps  → kws-collection/recitations/{prefix}/{contributorId}/{clipId}.{ext}
 */
export function buildKwsKey(
  step: RecordingStep,
  contributorId: string,
  clipId: string,
  contentType: AudioMimeType,
  label?: string,
): string {
  const ext = extensionFor(contentType);
  if (step === "isolated_keyword") {
    if (!label) throw new Error("label is required for isolated_keyword step");
    return `kws-collection/clips/${label}/${contributorId}__${clipId}.${ext}`;
  }
  const prefix = RECITATION_STEP_PREFIXES[step];
  return `kws-collection/recitations/${prefix}/${contributorId}/${clipId}.${ext}`;
}

/**
 * Presign a PUT URL for a KWS clip (no sidecar — Supabase is the metadata store).
 */
export async function createKwsPresignedUploadUrl(
  step: RecordingStep,
  contributorId: string,
  clipId: string,
  contentType: AudioMimeType,
  label?: string,
): Promise<{ audioUrl: string; audioKey: string; audioStorageUrl: string }> {
  const { region, bucket } = getS3Config();
  const audioKey = buildKwsKey(step, contributorId, clipId, contentType, label);
  const audioUrl = await presignPut(audioKey, contentType);
  const audioStorageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${audioKey}`;
  return { audioUrl, audioKey, audioStorageUrl };
}
