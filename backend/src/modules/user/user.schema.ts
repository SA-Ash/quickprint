import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  college: z.string().optional(),
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  role: string;
  college: string | null;
  otpEnabled: boolean;
  otpMethod: string;
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  createdAt: Date;
}
