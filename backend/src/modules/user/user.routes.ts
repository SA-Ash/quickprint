import type { FastifyInstance } from 'fastify';
import { userController } from './user.controller.js';

export async function userRoutes(fastify: FastifyInstance) {
  // Protected routes - require authentication
  fastify.get('/me', userController.getMe);
  fastify.put('/me', userController.updateMe);

  // Internal route
  fastify.get('/:id', userController.getUserById);
}
