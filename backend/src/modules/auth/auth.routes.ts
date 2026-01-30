import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

// Stricter rate limit config for sensitive auth routes
const strictRateLimit = {
  config: {
    rateLimit: {
      max: 10, // 10 attempts per minute
      timeWindow: '1 minute',
    },
  },
};

const otpRateLimit = {
  config: {
    rateLimit: {
      max: 5, // 5 OTP requests per minute (prevent spam)
      timeWindow: '1 minute',
    },
  },
};

export async function authRoutes(fastify: FastifyInstance) {
  // OTP-based auth (stricter limits to prevent SMS/email spam)
  fastify.post('/phone/initiate', otpRateLimit, authController.initiatePhoneOTP);
  fastify.post('/phone/verify', strictRateLimit, authController.verifyPhoneOTP);
  fastify.post('/phone/signup', strictRateLimit, authController.signupPhoneOTP);

  fastify.post('/email/initiate', otpRateLimit, authController.initiateEmailOTP);
  fastify.post('/email/verify', strictRateLimit, authController.verifyEmailOTP);

  // Password-based auth (stricter limits to prevent brute force)
  fastify.post('/phone/password/signup', strictRateLimit, authController.phonePasswordSignup);
  fastify.post('/phone/password/login', strictRateLimit, authController.phonePasswordLogin);
  fastify.post('/email/password/signup', strictRateLimit, authController.emailPasswordSignup);
  fastify.post('/email/password/login', strictRateLimit, authController.emailPasswordLogin);

  // Partner auth (stricter limits)
  fastify.post('/partner/register', strictRateLimit, authController.partnerRegister);
  fastify.post('/partner/login', strictRateLimit, authController.partnerLogin);

  // Partner 2FA Registration Flow
  fastify.post('/partner/register/initiate', otpRateLimit, authController.initiatePartnerRegister);
  fastify.post('/partner/register/verify-otp', strictRateLimit, authController.verifyPartnerOTP);
  fastify.post('/partner/register/verify-email', strictRateLimit, authController.completePartnerRegister);
  fastify.post('/partner/register/resend-otp', otpRateLimit, authController.resendPartnerOTP);

  // Google OAuth
  fastify.post('/google', strictRateLimit, authController.googleAuth);

  // Token management
  fastify.post('/refresh', authController.refreshToken);
  fastify.post('/logout', authController.logout);

  fastify.register(async (protectedInstance) => {
    protectedInstance.addHook('preHandler', authMiddleware);

    protectedInstance.put('/me/otp', authController.updateOtpSettings);

    protectedInstance.post('/set-password', authController.setPassword);

    protectedInstance.post('/backup-codes', authController.generateBackupCodes);
    protectedInstance.get('/backup-codes', authController.getBackupCodes);
    protectedInstance.post('/google/link', authController.linkGoogle);
  });
}
