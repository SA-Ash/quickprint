import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import {
  phoneInitiateSchema,
  phoneVerifySchema,
  googleAuthSchema,
  refreshTokenSchema,
  partnerRegisterSchema,
  partnerLoginSchema,
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
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message.includes('already registered')) {
          return reply.code(409).send({ error: error.message });
        }
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
};
