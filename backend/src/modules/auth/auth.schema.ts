import { z } from 'zod';

export const phoneInitiateSchema = z.object({
  phone: z
    .string()
    .regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
});

export type PhoneInitiateInput = z.infer<typeof phoneInitiateSchema>;

export const phoneVerifySchema = z.object({
  phone: z
    .string()
    .regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
  code: z.string().length(4, 'OTP must be 4 digits'),
  college: z.string().optional(),
});

export type PhoneVerifyInput = z.infer<typeof phoneVerifySchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const collegeAuthInitiateSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type CollegeAuthInitiateInput = z.infer<typeof collegeAuthInitiateSchema>;

export const collegeAuthVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(4, 'OTP must be 4 digits'),
});

export type CollegeAuthVerifyInput = z.infer<typeof collegeAuthVerifySchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const partnerRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
  shopName: z.string().min(1, 'Shop name is required'),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(6).max(6),
  }),
});

export type PartnerRegisterInput = z.infer<typeof partnerRegisterSchema>;

export const partnerLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type PartnerLoginInput = z.infer<typeof partnerLoginSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    phone: string;
    email: string | null;
    name: string | null;
    role: string;
    college: string | null;
    shopName?: string;
  };
}

