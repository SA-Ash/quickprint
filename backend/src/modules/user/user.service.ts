import { prisma } from '../../infrastructure/database/prisma.client.js';
import type { UpdateProfileInput, UserProfile } from './user.schema.js';

export const userService = {
  
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
      otpEnabled: user.otpEnabled,
      otpMethod: user.otpMethod,
      hasPassword: !!user.passwordHash,
      hasGoogleLinked: !!user.googleId,
      createdAt: user.createdAt,
    };
  },

  
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
        ...(input.phone !== undefined && { phone: input.phone }),
      },
    });

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      college: user.college,
      otpEnabled: user.otpEnabled,
      otpMethod: user.otpMethod,
      hasPassword: !!user.passwordHash,
      hasGoogleLinked: !!user.googleId,
      createdAt: user.createdAt,
    };
  },

 
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },
};
