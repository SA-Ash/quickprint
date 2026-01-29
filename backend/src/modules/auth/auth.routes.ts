import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../common/middleware/index.js';

export async function authRoutes(fastify: FastifyInstance) {
  // OTP-based auth
  fastify.post('/phone/initiate', authController.initiatePhoneOTP);
  fastify.post('/phone/verify', authController.verifyPhoneOTP);
  fastify.post('/phone/signup', authController.signupPhoneOTP);


  fastify.post('/email/initiate', authController.initiateEmailOTP);
  fastify.post('/email/verify', authController.verifyEmailOTP);

  // Password-based auth
  fastify.post('/phone/password/signup', authController.phonePasswordSignup);
  fastify.post('/phone/password/login', authController.phonePasswordLogin);
  fastify.post('/email/password/signup', authController.emailPasswordSignup);
  fastify.post('/email/password/login', authController.emailPasswordLogin);

  // Partner auth (legacy - direct registration without 2FA)
  fastify.post('/partner/register', authController.partnerRegister);
  fastify.post('/partner/login', authController.partnerLogin);

  // Partner 2FA Registration Flow
  fastify.post('/partner/register/initiate', authController.initiatePartnerRegister);
  fastify.post('/partner/register/verify-otp', authController.verifyPartnerOTP);
  fastify.post('/partner/register/verify-email', authController.completePartnerRegister);
  fastify.post('/partner/register/resend-otp', authController.resendPartnerOTP);

  // Google OAuth
  fastify.post('/google', authController.googleAuth);

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
