/**
 * AWS S3 Client for QuickPrint
 * File storage for uploaded documents (PDFs, images)
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.js';

let s3Client: S3Client | null = null;

/**
 * Initialize S3 client
 */
export function initializeS3(): void {
  if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  AWS credentials not configured, S3 storage disabled');
    return;
  }

  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  console.log('✅ S3 client initialized');
}

/**
 * Get the S3 client instance
 */
export function getS3Client(): S3Client | null {
  return s3Client;
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return s3Client !== null && !!env.S3_BUCKET;
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string | null> {
  if (!s3Client || !env.S3_BUCKET) {
    console.warn('S3 not configured, file upload skipped');
    return null;
  }

  try {
    const params: PutObjectCommandInput = {
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    };

    await s3Client.send(new PutObjectCommand(params));

    // Return the S3 URL
    return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`Error uploading file ${key}:`, error);
    return null;
  }
}

/**
 * Generate a pre-signed URL for file download
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!s3Client || !env.S3_BUCKET) {
    console.warn('S3 not configured, cannot generate signed URL');
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });

    return await awsGetSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  } catch (error) {
    console.error(`Error generating signed URL for ${key}:`, error);
    return null;
  }
}

/**
 * Generate a pre-signed URL for file upload
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!s3Client || !env.S3_BUCKET) {
    console.warn('S3 not configured, cannot generate signed URL');
    return null;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    return await awsGetSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  } catch (error) {
    console.error(`Error generating upload URL for ${key}:`, error);
    return null;
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<boolean> {
  if (!s3Client || !env.S3_BUCKET) {
    console.warn('S3 not configured, file deletion skipped');
    return false;
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error(`Error deleting file ${key}:`, error);
    return false;
  }
}

/**
 * Generate a unique file key for uploads
 */
export function generateFileKey(
  folder: string,
  fileName: string,
  userId?: string
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (userId) {
    return `${folder}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
  }
  return `${folder}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
}

// Common folder paths
export const S3_FOLDERS = {
  ORDERS: 'orders',
  AVATARS: 'avatars',
  SHOP_IMAGES: 'shops',
  TEMP: 'temp',
} as const;
