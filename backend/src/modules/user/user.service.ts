import { prisma } from '../../infrastructure/database/prisma.client.js';
import type { UpdateProfileInput, UserProfile } from './user.schema.js';

export const userService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      college: user.college,
      createdAt: user.createdAt,
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.college !== undefined && { college: input.college }),
      },
    });

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      college: user.college,
      createdAt: user.createdAt,
    };
  },

  /**
   * Get user by ID (internal use)
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },
};
