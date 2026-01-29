/**
 * File Service for QuickPrint
 * Handles file metadata, integrity verification, and status tracking
 */
import { prisma } from '../../infrastructure/database/prisma.client.js';
import {
  uploadFile,
  getSignedDownloadUrl,
  calculateChecksum,
  generateFileKey,
  getFileMetadata,
  STORAGE_FOLDERS,
} from '../../infrastructure/storage/s3.client.js';
import type { FileStatus } from '@prisma/client';

export interface UploadResult {
  fileId: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  checksum: string;
}

export interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  status: FileStatus;
  uploadedAt: Date;
  downloadedAt: Date | null;
  printedAt: Date | null;
}

class FileService {
  /**
   * Upload a file and create database record
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    userId?: string
  ): Promise<UploadResult> {
    // Generate unique key
    const key = generateFileKey(STORAGE_FOLDERS.ORDERS, fileName, userId);
    
    // Calculate checksum
    const checksum = calculateChecksum(buffer);
    
    // Upload to S3/MinIO
    const result = await uploadFile(key, buffer, mimeType, {
      originalName: fileName,
      uploadedBy: userId || 'anonymous',
    });
    
    if (!result) {
      throw new Error('Failed to upload file to storage');
    }
    
    // Create database record
    const file = await prisma.file.create({
      data: {
        originalName: fileName,
        storedKey: key,
        mimeType,
        size: buffer.length,
        checksum,
        status: 'UPLOADED',
      },
    });
    
    return {
      fileId: file.id,
      url: key, // The S3 key (use getSignedDownloadUrl for actual URL)
      name: fileName,
      size: buffer.length,
      mimeType,
      checksum,
    };
  }
  
  /**
   * Get file info by ID
   */
  async getFileById(fileId: string): Promise<FileInfo | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });
    
    if (!file) return null;
    
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      checksum: file.checksum,
      status: file.status,
      uploadedAt: file.uploadedAt,
      downloadedAt: file.downloadedAt,
      printedAt: file.printedAt,
    };
  }
  
  /**
   * Get signed download URL for a file
   */
  async getDownloadUrl(fileId: string, expiresInSeconds = 3600): Promise<string | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });
    
    if (!file) return null;
    
    // Update downloaded timestamp
    await prisma.file.update({
      where: { id: fileId },
      data: { downloadedAt: new Date() },
    });
    
    return getSignedDownloadUrl(file.storedKey, expiresInSeconds);
  }
  
  /**
   * Mark file as sent to partner
   */
  async markAsSentToPartner(fileId: string): Promise<void> {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        status: 'SENT_TO_PARTNER',
        downloadedAt: new Date(),
      },
    });
  }
  
  /**
   * Mark file as printing
   */
  async markAsPrinting(fileId: string): Promise<void> {
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'PRINTING' },
    });
  }
  
  /**
   * Mark file as printed (partner callback)
   */
  async markAsPrinted(fileId: string): Promise<void> {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        status: 'PRINTED',
        printedAt: new Date(),
      },
    });
  }
  
  /**
   * Mark file as failed
   */
  async markAsFailed(fileId: string): Promise<void> {
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'FAILED' },
    });
  }
  
  /**
   * Link file to order
   */
  async linkToOrder(fileId: string, orderId: string): Promise<void> {
    await prisma.file.update({
      where: { id: fileId },
      data: { orderId },
    });
  }
  
  /**
   * Verify file checksum matches stored checksum
   */
  async verifyChecksum(fileId: string, providedChecksum: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });
    
    if (!file) return false;
    
    return file.checksum === providedChecksum;
  }
  
  /**
   * Get file by order ID
   */
  async getFileByOrderId(orderId: string): Promise<FileInfo | null> {
    const file = await prisma.file.findUnique({
      where: { orderId },
    });
    
    if (!file) return null;
    
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      checksum: file.checksum,
      status: file.status,
      uploadedAt: file.uploadedAt,
      downloadedAt: file.downloadedAt,
      printedAt: file.printedAt,
    };
  }
}

export const fileService = new FileService();
