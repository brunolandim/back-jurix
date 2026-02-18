import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '../config/env';

let s3: S3Client | null = null;
let presignClient: S3Client | null = null;

function getS3(): S3Client {
  if (s3) return s3;
  const env = getEnv();

  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: env.AWS_REGION,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  };

  if (env.S3_ENDPOINT) {
    config.endpoint = env.S3_ENDPOINT;
    config.forcePathStyle = true;
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
    };
  }

  s3 = new S3Client(config);
  return s3;
}

// Client for presigned URLs — uses the public-facing URL so the
// signature matches the Host header the browser will send.
function getPresignClient(): S3Client {
  if (presignClient) return presignClient;
  const env = getEnv();

  const endpoint = env.S3_PUBLIC_URL || env.S3_ENDPOINT;

  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: env.AWS_REGION,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  };

  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true;
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
    };
  }

  presignClient = new S3Client(config);
  return presignClient;
}

/**
 * Extracts the S3 object key from a full presigned URL.
 * If the value is already a plain key (no protocol), returns it as-is.
 */
export function extractS3Key(fileUrl: string): string {
  if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
    return fileUrl; // already a key
  }

  const env = getEnv();
  const url = new URL(fileUrl);

  // Path-style: /<bucket>/<key> (MinIO / localstack / force-path-style)
  const bucketPrefix = `/${env.S3_BUCKET}/`;
  if (url.pathname.startsWith(bucketPrefix)) {
    return decodeURIComponent(url.pathname.slice(bucketPrefix.length));
  }

  // Virtual-hosted style: <bucket>.s3.<region>.amazonaws.com/<key>
  return decodeURIComponent(url.pathname.slice(1)); // strip leading "/"
}

/**
 * Takes a stored S3 key (or legacy presigned URL) and returns a fresh presigned URL.
 * Returns null when the input is null.
 */
export async function resolveFileUrl(fileUrl: string | null): Promise<string | null> {
  if (!fileUrl) return null;
  const key = extractS3Key(fileUrl);
  return getFileUrl(key);
}

/**
 * Resolves fileUrl on every DocumentRequest-like object inside an array.
 */
export async function resolveFileUrls<T extends { fileUrl: string | null }>(
  items: T[]
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      fileUrl: await resolveFileUrl(item.fileUrl),
    }))
  );
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string; fileKey: string }> {
  const env = getEnv();
  const client = getPresignClient();

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: 300,
    signableHeaders: new Set(['content-type']),
  });

  const fileUrl = await getFileUrl(key);

  return { uploadUrl, fileUrl, fileKey: key };
}

export async function uploadToS3(
  key: string,
  contentType: string,
  body: Buffer
): Promise<string> {
  const env = getEnv();
  const client = getS3();

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Body: body,
  });

  await client.send(command);
  return key;
}

/**
 * Returns a permanent public URL for objects in the photos/ folder.
 * Requires the bucket policy to allow s3:GetObject on the {orgId}/photos/{file} prefix.
 */
export function getPublicUrl(key: string): string {
  const env = getEnv();

  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL}/${env.S3_BUCKET}/${key}`;
  }

  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${encodedKey}`;
}

export async function getFileUrl(key: string): Promise<string> {
  const env = getEnv();

  // Local development (MinIO) — use direct public URL
  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL}/${env.S3_BUCKET}/${key}`;
  }

  // AWS — generate presigned GET URL (public access is blocked)
  const client = getPresignClient();
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 604800 }); // 7 days
}
