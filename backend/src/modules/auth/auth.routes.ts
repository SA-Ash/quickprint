import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  
  fastify.post('/phone/initiate', authController.initiatePhoneOTP);
  fastify.post('/phone/verify', authController.verifyPhoneOTP);
  
  fastify.post('/phone/signup', authController.signupPhoneOTP);

  fastify.post('/partner/register', authController.partnerRegister);
  fastify.post('/partner/login', authController.partnerLogin);

  fastify.post('/google', authController.googleAuth);

  fastify.post('/refresh', authController.refreshToken);
  fastify.post('/logout', authController.logout);
}

