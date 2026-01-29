/**
 * S3/MinIO Storage Client for QuickPrint
 * Supports both AWS S3 and MinIO for local development
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import { env } from '../../config/env.js';

let s3Client: S3Client | null = null;
let bucketName: string = '';

/**
 * Initialize S3/MinIO client
 */
export async function initializeStorage(): Promise<void> {
  const endpoint = env.S3_ENDPOINT || process.env.S3_ENDPOINT;
  const accessKey = env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretKey = env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const region = env.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  bucketName = env.S3_BUCKET || process.env.S3_BUCKET || 'quickprint-files';

  if (!accessKey || !secretKey) {
    console.error('❌ S3/MinIO credentials not configured. File uploads will fail.');
    return;
  }

  // Configure client - supports both AWS S3 and MinIO
  const clientConfig: any = {
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  };

  // If endpoint is specified, use it (MinIO or custom S3-compatible)
  if (endpoint) {
    clientConfig.endpoint = endpoint;
    clientConfig.forcePathStyle = true; // Required for MinIO
  }

  s3Client = new S3Client(clientConfig);

  // Ensure bucket exists
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Storage initialized - Bucket: ${bucketName}`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`⚠️ Bucket ${bucketName} not found. For AWS S3, please create the bucket manually.`);
    } else {
      // Log more details for debugging
      console.warn('⚠️ Could not verify bucket:', error.name || 'UnknownError');
      console.warn('   Details:', error.message || 'No message');
      // Don't fail - bucket might still work for uploads
      console.log(`✅ Storage client configured for bucket: ${bucketName} (verification skipped)`);
    }
  }
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return s3Client !== null;
}

/**
 * Calculate SHA-256 checksum of file data
 */
export function calculateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload a file to S3/MinIO with checksum
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ url: string; checksum: string } | null> {
  if (!s3Client) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }

  const checksum = calculateChecksum(buffer);

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        ...metadata,
        checksum,
      },
    }));

    // Return the object key (not full URL - use signed URL for access)
    return {
      url: key,
      checksum,
    };
  } catch (error) {
    console.error(`Failed to upload file ${key}:`, error);
    throw error;
  }
}

/**
 * Generate a signed URL for secure file download
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600 // 1 hour default
): Promise<string> {
  if (!s3Client) {
    throw new Error('Storage not initialized');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a signed URL for file upload (presigned PUT)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  if (!s3Client) {
    throw new Error('Storage not initialized');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  checksum?: string;
} | null> {
  if (!s3Client) {
    throw new Error('Storage not initialized');
  }

  try {
    const response = await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      checksum: response.Metadata?.checksum,
    };
  } catch (error) {
    console.error(`Failed to get metadata for ${key}:`, error);
    return null;
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<boolean> {
  if (!s3Client) {
    throw new Error('Storage not initialized');
  }

  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${key}:`, error);
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

// Export folder constants
export const STORAGE_FOLDERS = {
  ORDERS: 'orders',
  AVATARS: 'avatars',
  SHOP_IMAGES: 'shops',
  TEMP: 'temp',
} as const;
