import type { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from './user.service.js';
import { updateProfileSchema } from './user.schema.js';



export const userController = {
  /**
   * GET /api/users/me
   * Get current user profile
   */
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const profile = await userService.getProfile(request.user.id);
      if (!profile) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.code(200).send(profile);
    } catch {
      return reply.code(500).send({ error: 'Failed to get profile' });
    }
  },

  /**
   * PUT /api/users/me
   * Update current user profile
   */
  async updateMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const input = updateProfileSchema.parse(request.body);
      const profile = await userService.updateProfile(request.user.id, input);

      return reply.code(200).send(profile);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to update profile' });
    }
  },

  /**
   * GET /api/users/:id
   * Get user by ID (internal/admin use)
   */
  async getUserById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const user = await userService.getUserById(id);

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.code(200).send({
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
      });
    } catch {
      return reply.code(500).send({ error: 'Failed to get user' });
    }
  },
};
