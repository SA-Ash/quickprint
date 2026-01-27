import type { FastifyInstance } from 'fastify';
import { userController } from './user.controller.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/me', userController.getMe);
  fastify.put('/me', userController.updateMe);

  fastify.get('/:id', userController.getUserById);
}
