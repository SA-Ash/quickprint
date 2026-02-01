import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { verifyFirebaseToken, isFirebaseConfigured } from '../../infrastructure/auth/firebase-admin.js';
import {
  phoneInitiateSchema,
  phoneVerifySchema,
  googleAuthSchema,
  refreshTokenSchema,
  partnerRegisterSchema,
  partnerLoginSchema,
  updateOtpSettingsSchema,
  emailOtpInitiateSchema,
  emailOtpVerifySchema,
  setPasswordSchema,
  googleLinkSchema,
  phonePasswordSignupSchema,
  phonePasswordLoginSchema,
  emailPasswordSignupSchema,
  emailPasswordLoginSchema,
  partnerInitiateRegisterSchema,
  partnerVerifyOtpSchema,
  partnerVerifyEmailSchema,
  resendPartnerOtpSchema,
  firebasePhoneVerifySchema,
} from './auth.schema.js';

export const authController = {
  async initiatePhoneOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = phoneInitiateSchema.parse(request.body);
      const result = await authService.initiatePhoneOTP(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to send OTP' });
    }
  },

  async signupPhoneOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = phoneInitiateSchema.parse(request.body);
      const result = await authService.initiatePhoneOTP(input, true);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('already registered')) {
          return reply.code(409).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to send OTP' });
    }
  },

  async verifyPhoneOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = phoneVerifySchema.parse(request.body);
      const result = await authService.verifyPhoneOTP(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Invalid or expired OTP') {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Verification failed' });
    }
  },

  async googleAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = googleAuthSchema.parse(request.body);
      const result = await authService.googleAuth(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Google authentication failed' });
    }
  },

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = refreshTokenSchema.parse(request.body);
      const result = await authService.refreshAccessToken(input.refreshToken);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (
          error.message.includes('Invalid') ||
          error.message.includes('expired')
        ) {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { refreshToken?: string };
      if (body.refreshToken) {
        await authService.logout(body.refreshToken);
      }
      return reply.code(200).send({ message: 'Logged out successfully' });
    } catch {
      return reply.code(500).send({ error: 'Logout failed' });
    }
  },

  async partnerRegister(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = partnerRegisterSchema.parse(request.body);
      const result = await authService.partnerRegister(input);
      return reply.code(201).send(result);
    } catch (error) {
      console.error('[Partner Register] Error:', error);
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('already registered')) {
          return reply.code(409).send({ error: error.message });
        }
        // Return actual error message for debugging
        return reply.code(500).send({ error: error.message || 'Registration failed' });
      }
      return reply.code(500).send({ error: 'Registration failed' });
    }
  },

  async partnerLogin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = partnerLoginSchema.parse(request.body);
      const result = await authService.partnerLogin(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (
          error.message.includes('Invalid') ||
          error.message.includes('partners only')
        ) {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Login failed' });
    }
  },

  async updateOtpSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const input = updateOtpSettingsSchema.parse(request.body);
      const result = await authService.updateOtpSettings(request.user.id, input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('Cannot disable') || error.message.includes('required')) {
          return reply.code(400).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update OTP settings' });
    }
  },

  async initiateEmailOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = emailOtpInitiateSchema.parse(request.body);
      const result = await authService.initiateEmailOTP(input.email);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to send email OTP' });
    }
  },

  async verifyEmailOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = emailOtpVerifySchema.parse(request.body);
      const result = await authService.verifyEmailOTP(input.email, input.code);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Invalid or expired OTP') {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Email verification failed' });
    }
  },

  async setPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const input = setPasswordSchema.parse(request.body);
      const result = await authService.setPassword(request.user.id, input.password);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to set password' });
    }
  },

  async generateBackupCodes(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const result = await authService.generateBackupCodes(request.user.id);
      return reply.code(200).send(result);
    } catch {
      return reply.code(500).send({ error: 'Failed to generate backup codes' });
    }
  },

  async getBackupCodes(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const result = await authService.getBackupCodes(request.user.id);
      return reply.code(200).send(result);
    } catch {
      return reply.code(500).send({ error: 'Failed to get backup codes' });
    }
  },

  async linkGoogle(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const input = googleLinkSchema.parse(request.body);
      const result = await authService.linkGoogleAccount(request.user.id, input.idToken);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to link Google account' });
    }
  },

  // Password-based authentication handlers

  async phonePasswordSignup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = phonePasswordSignupSchema.parse(request.body);
      const result = await authService.phonePasswordSignup(input);
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('already registered')) {
          return reply.code(409).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to create account' });
    }
  },

  async phonePasswordLogin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = phonePasswordLoginSchema.parse(request.body);
      const result = await authService.phonePasswordLogin(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('Invalid password') || error.message.includes('not registered')) {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to login' });
    }
  },

  async emailPasswordSignup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = emailPasswordSignupSchema.parse(request.body);
      const result = await authService.emailPasswordSignup(input);
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('already registered')) {
          return reply.code(409).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to create account' });
    }
  },

  async emailPasswordLogin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = emailPasswordLoginSchema.parse(request.body);
      const result = await authService.emailPasswordLogin(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('Invalid password') || error.message.includes('not registered')) {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to login' });
    }
  },

  // ============================================
  // PARTNER 2FA REGISTRATION ENDPOINTS
  // ============================================

  async initiatePartnerRegister(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = partnerInitiateRegisterSchema.parse(request.body);
      const result = await authService.initiatePartnerRegistration(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('already registered')) {
          return reply.code(409).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to initiate registration' });
    }
  },

  async verifyPartnerOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = partnerVerifyOtpSchema.parse(request.body);
      const result = await authService.verifyPartnerOTP(input);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to verify OTP' });
    }
  },

  async completePartnerRegister(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = partnerVerifyEmailSchema.parse(request.body);
      const result = await authService.completePartnerRegistration(input.token);
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          return reply.code(401).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to complete registration' });
    }
  },

  async resendPartnerOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = resendPartnerOtpSchema.parse(request.body);
      const result = await authService.resendPartnerOTP(input.phone);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('No pending') || error.message.includes('already verified')) {
          return reply.code(400).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to resend OTP' });
    }
  },

  // ============================================
  // FIREBASE PHONE AUTH ENDPOINTS
  // ============================================

  /**
   * Verify Firebase phone ID token and login/create user
   * Used for phone-based login after Firebase OTP verification
   */
  async verifyFirebasePhone(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if Firebase is configured
      if (!isFirebaseConfigured()) {
        return reply.code(503).send({ 
          error: 'Firebase Phone Auth is not configured on this server' 
        });
      }

      const input = firebasePhoneVerifySchema.parse(request.body);

      // Verify the Firebase ID token
      const decodedToken = await verifyFirebaseToken(input.idToken);

      if (!decodedToken) {
        return reply.code(401).send({ error: 'Invalid Firebase token' });
      }

      // Ensure phone number matches
      if (decodedToken.phone_number !== input.phoneNumber) {
        return reply.code(401).send({ error: 'Phone number mismatch' });
      }

      // Login or create user with phone
      const result = await authService.loginOrCreateWithPhone({
        phone: input.phoneNumber,
        firebaseUid: decodedToken.uid,
        college: input.college,
        isPartner: input.isPartner,
      });

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          return reply.code(401).send({ error: error.message });
        }
      }
      console.error('[Auth] Firebase phone verify error:', error);
      return reply.code(500).send({ error: 'Phone verification failed' });
    }
  },
};
