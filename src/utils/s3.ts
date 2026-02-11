import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
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

  const fileUrl = getPublicUrl(key);

  return { uploadUrl, fileUrl };
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
  return getPublicUrl(key);
}

export function getPublicUrl(key: string): string {
  const env = getEnv();

  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL}/${env.S3_BUCKET}/${key}`;
  }

  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}
