import { z } from 'zod';

// Update Profile
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  college: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// User Response
export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  role: string;
  college: string | null;
  createdAt: Date;
}
