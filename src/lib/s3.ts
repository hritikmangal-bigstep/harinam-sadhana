import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AudioMimeType } from "@/types";

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
 * Reads S3 config from environment only — never hardcode bucket/region/keys.
 * Throws if misconfigured so the API route can fail fast with a clear message.
 */
function getS3Config() {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

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

/** Generate a single presigned PUT URL for an object. */
async function presignPut(key: string, contentType: string): Promise<string> {
  const { region, bucket, accessKeyId, secretAccessKey } = getS3Config();
  const client = getClient(region, accessKeyId, secretAccessKey);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
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
): Promise<{ audioUrl: string; metadataUrl: string; audioKey: string }> {
  const { audioKey, metadataKey } = buildKeys(name, date, contentType, stamp);
  const [audioUrl, metadataUrl] = await Promise.all([
    presignPut(audioKey, contentType),
    presignPut(metadataKey, "application/json"),
  ]);
  return { audioUrl, metadataUrl, audioKey };
}
