/**
 * File Routes for QuickPrint
 * Handles file downloads and partner callbacks
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware.js';
import { fileService } from './file.service.js';

interface FileParams {
  id: string;
}

interface PrintedBody {
  printedAt?: string;
  notes?: string;
}

export async function fileRoutes(fastify: FastifyInstance) {
  /**
   * Get file info
   * GET /api/files/:id
   */
  fastify.get<{ Params: FileParams }>('/api/files/:id', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const file = await fileService.getFileById(id);
    if (!file) {
      return reply.code(404).send({ error: 'File not found' });
    }
    
    return reply.send(file);
  });

  /**
   * Get signed download URL for a file
   * GET /api/files/:id/download
   */
  fastify.get<{ Params: FileParams }>('/api/files/:id/download', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const url = await fileService.getDownloadUrl(id);
    if (!url) {
      return reply.code(404).send({ error: 'File not found' });
    }
    
    // Mark as sent to partner if user is a shop owner
    if ((request as any).user?.role === 'SHOP') {
      await fileService.markAsSentToPartner(id);
    }
    
    return reply.send({ 
      downloadUrl: url,
      expiresIn: 3600, // 1 hour
    });
  });

  /**
   * Partner callback - mark file as printed
   * POST /api/files/:id/printed
   */
  fastify.post<{ Params: FileParams; Body: PrintedBody }>('/api/files/:id/printed', {
    preHandler: [authMiddleware, requireRole('SHOP')],
  }, async (request: FastifyRequest<{ Params: FileParams; Body: PrintedBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const file = await fileService.getFileById(id);
    if (!file) {
      return reply.code(404).send({ error: 'File not found' });
    }
    
    await fileService.markAsPrinted(id);
    
    return reply.send({ 
      success: true,
      message: 'File marked as printed',
      fileId: id,
      printedAt: new Date().toISOString(),
    });
  });

  /**
   * Mark file as printing (partner started printing)
   * POST /api/files/:id/printing
   */
  fastify.post<{ Params: FileParams }>('/api/files/:id/printing', {
    preHandler: [authMiddleware, requireRole('SHOP')],
  }, async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const file = await fileService.getFileById(id);
    if (!file) {
      return reply.code(404).send({ error: 'File not found' });
    }
    
    await fileService.markAsPrinting(id);
    
    return reply.send({ 
      success: true,
      message: 'File marked as printing',
      fileId: id,
    });
  });

  /**
   * Verify file checksum
   * POST /api/files/:id/verify
   */
  fastify.post<{ Params: FileParams; Body: { checksum: string } }>('/api/files/:id/verify', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest<{ Params: FileParams; Body: { checksum: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { checksum } = request.body;
    
    if (!checksum) {
      return reply.code(400).send({ error: 'Checksum required' });
    }
    
    const isValid = await fileService.verifyChecksum(id, checksum);
    
    return reply.send({ 
      valid: isValid,
      message: isValid ? 'Checksum verified' : 'Checksum mismatch - file may be corrupted',
    });
  });
}
