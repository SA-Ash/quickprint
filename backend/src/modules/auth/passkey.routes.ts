/**
 * Passkey (WebAuthn) Routes
 * Routes for passkey registration and authentication
 */

import type { FastifyInstance } from 'fastify';
import { passkeyController } from './passkey.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

export async function passkeyRoutes(fastify: FastifyInstance) {
  // Public routes (no auth required)
  fastify.post('/login/options', passkeyController.getAuthenticationOptions);
  fastify.post('/login/verify', passkeyController.verifyAuthentication);

  // Protected routes (auth required)
  fastify.register(async (protectedInstance) => {
    protectedInstance.addHook('preHandler', authMiddleware);

    // Registration (only for logged-in users)
    protectedInstance.post('/register/options', passkeyController.getRegistrationOptions);
    protectedInstance.post('/register/verify', passkeyController.verifyRegistration);

    // Management
    protectedInstance.get('/list', passkeyController.listPasskeys);
    protectedInstance.delete('/:id', passkeyController.deletePasskey);
  });
}
