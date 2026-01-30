/**
 * Email OTP Routes
 * Routes for email-based authentication
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { emailOtpService } from './email-otp.service.js';

export async function emailOtpRoutes(fastify: FastifyInstance) {
  /**
   * POST /email/otp/send
   * Send OTP to email address
   */
  fastify.post('/otp/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.body as { email: string };
      
      if (!email || !email.includes('@')) {
        return reply.code(400).send({ error: 'Valid email address is required' });
      }

      const result = await emailOtpService.sendOTP(email);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('[Email OTP] Send error:', error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to send verification code' 
      });
    }
  });

  /**
   * POST /email/otp/verify
   * Verify OTP and get auth tokens
   */
  fastify.post('/otp/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, code } = request.body as { email: string; code: string };
      
      if (!email || !code) {
        return reply.code(400).send({ error: 'Email and code are required' });
      }

      const result = await emailOtpService.verifyOTP(email, code);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('[Email OTP] Verify error:', error);
      return reply.code(401).send({ 
        error: error instanceof Error ? error.message : 'Verification failed' 
      });
    }
  });

  /**
   * POST /email/magic-link/send
   * Send magic link for passwordless login
   */
  fastify.post('/magic-link/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.body as { email: string };
      
      if (!email || !email.includes('@')) {
        return reply.code(400).send({ error: 'Valid email address is required' });
      }

      const result = await emailOtpService.sendMagicLink(email);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('[Magic Link] Send error:', error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to send sign-in link' 
      });
    }
  });

  /**
   * POST /email/magic-link/verify
   * Verify magic link token and get auth tokens
   */
  fastify.post('/magic-link/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.body as { token: string };
      
      if (!token) {
        return reply.code(400).send({ error: 'Token is required' });
      }

      const result = await emailOtpService.verifyMagicLink(token);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('[Magic Link] Verify error:', error);
      return reply.code(401).send({ 
        error: error instanceof Error ? error.message : 'Invalid or expired link' 
      });
    }
  });
}
