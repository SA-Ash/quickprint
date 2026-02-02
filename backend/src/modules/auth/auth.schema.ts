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
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export type PartnerRegisterInput = z.infer<typeof partnerRegisterSchema>;

export const partnerLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type PartnerLoginInput = z.infer<typeof partnerLoginSchema>;

export const updateOtpSettingsSchema = z.object({
  enabled: z.boolean(),
  method: z.enum(['sms', 'email']).optional(),
  email: z.string().email().optional(),
});

export type UpdateOtpSettingsInput = z.infer<typeof updateOtpSettingsSchema>;

export const emailOtpInitiateSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type EmailOtpInitiateInput = z.infer<typeof emailOtpInitiateSchema>;

export const emailOtpVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(4, 'OTP must be 4 digits'),
  isPartner: z.boolean().optional().default(false), // For role validation
});

export type EmailOtpVerifyInput = z.infer<typeof emailOtpVerifySchema>;

export const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const googleLinkSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export type GoogleLinkInput = z.infer<typeof googleLinkSchema>;

// Password-based authentication schemas
export const phonePasswordSignupSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  college: z.string().optional(),
});

export type PhonePasswordSignupInput = z.infer<typeof phonePasswordSignupSchema>;

export const phonePasswordLoginSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
  password: z.string().min(1, 'Password is required'),
});

export type PhonePasswordLoginInput = z.infer<typeof phonePasswordLoginSchema>;

export const emailPasswordSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  college: z.string().optional(),
  phone: z.string().optional(), // For duplicate checking
});

export type EmailPasswordSignupInput = z.infer<typeof emailPasswordSignupSchema>;

export const emailPasswordLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type EmailPasswordLoginInput = z.infer<typeof emailPasswordLoginSchema>;

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
    authMethod?: string;
    otpEnabled?: boolean;
    otpMethod?: string;
    hasPassword?: boolean;
    hasGoogleLinked?: boolean;
    shopName?: string;
  };
}

// Partner 2FA Registration Schemas
export const partnerInitiateRegisterSchema = z.object({
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
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export type PartnerInitiateRegisterInput = z.infer<typeof partnerInitiateRegisterSchema>;

export const partnerVerifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
  code: z.string().length(4, 'OTP must be 4 digits'),
});

export type PartnerVerifyOtpInput = z.infer<typeof partnerVerifyOtpSchema>;

export const partnerVerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type PartnerVerifyEmailInput = z.infer<typeof partnerVerifyEmailSchema>;

export const resendPartnerOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in format +91XXXXXXXXXX'),
});

export type ResendPartnerOtpInput = z.infer<typeof resendPartnerOtpSchema>;

// Firebase Phone Auth - verify Firebase ID token
export const firebasePhoneVerifySchema = z.object({
  idToken: z.string().min(100, 'Firebase ID token is required'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  college: z.string().optional(),
  isPartner: z.boolean().optional(),
});

export type FirebasePhoneVerifyInput = z.infer<typeof firebasePhoneVerifySchema>;

// Signup with phone verification (Step 1 of 2FA)
export const signupPhoneVerifySchema = z.object({
  idToken: z.string().min(100, 'Firebase ID token is required'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  college: z.string().optional(),
  isPartner: z.boolean().optional(),
  // Partner fields
  shopName: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(6).max(6),
  }).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export type SignupPhoneVerifyInput = z.infer<typeof signupPhoneVerifySchema>;
