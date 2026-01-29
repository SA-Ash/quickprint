/**
 * File Upload Routes for QuickPrint
 * Handles document uploads using S3/MinIO storage
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { fileService } from '../file/file.service.js';
import { isStorageConfigured } from '../../infrastructure/storage/s3.client.js';

interface UploadResponse {
  fileId: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  checksum: string;
}

export async function uploadRoutes(fastify: FastifyInstance) {

  /**
   * Upload a file
   * POST /api/upload
   */
  fastify.post('/api/upload', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('=== UPLOAD DEBUG ===');
    console.log('Content-Type:', request.headers['content-type']);
    console.log('isMultipart:', request.isMultipart());
    
    // Check if storage is configured
    if (!isStorageConfigured()) {
      console.log('Storage NOT configured');
      return reply.code(503).send({ 
        error: 'Storage service unavailable. Please configure S3/MinIO.',
      });
    }
    console.log('Storage configured: OK');

    try {
      console.log('Calling request.file()...');
      const data = await request.file();
      console.log('request.file() returned:', data ? 'FILE OBJECT' : 'undefined');
      
      if (!data) {
        console.log('ERROR: No file in request');
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const buffer = await data.toBuffer();
      const fileName = data.filename;
      const mimeType = data.mimetype;

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(mimeType)) {
        return reply.code(400).send({ 
          error: 'Invalid file type. Allowed: PDF, images, Word documents',
        });
      }

      // Upload file using file service
      const userId = (request as any).user?.id;
      const result = await fileService.uploadFile(buffer, fileName, mimeType, userId);

      const response: UploadResponse = {
        fileId: result.fileId,
        url: result.url,
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
        checksum: result.checksum,
      };

      return reply.send(response);
    } catch (error) {
      console.error('File upload error:', error);
      return reply.code(500).send({ error: 'Failed to upload file' });
    }
  });

  /**
   * Get upload configuration info
   * GET /api/upload/info
   */
  fastify.get('/api/upload/info', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      maxFileSize: '50MB',
      allowedTypes: ['PDF', 'JPEG', 'PNG', 'GIF', 'DOC', 'DOCX'],
      storageConfigured: isStorageConfigured(),
      integrityVerification: 'SHA-256',
    });
  });
}
