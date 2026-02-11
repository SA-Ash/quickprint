/**
 * Passkey (WebAuthn) Controller
 * Handles HTTP routes for passkey registration and authentication
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { passkeyService } from './passkey.service.js';
import type { AuthenticatedRequest } from '../../common/types/request.types.js';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types';

export const passkeyController = {
  /**
   * POST /passkey/register/options
   * Get registration options (requires auth)
   */
  async getRegistrationOptions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const userId = authRequest.user.id;

      const options = await passkeyService.generateRegistrationOptions(userId);
      return reply.code(200).send(options);
    } catch (error) {
      console.error('[Passkey] Registration options error:', error);
      return reply.code(500).send({ 
        error: error instanceof Error ? error.message : 'Failed to generate registration options' 
      });
    }
  },

  /**
   * POST /passkey/register/verify
   * Verify registration and store credential (requires auth)
   */
  async verifyRegistration(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const userId = authRequest.user.id;
      const response = request.body as RegistrationResponseJSON;

      const result = await passkeyService.verifyRegistration(userId, response);
      return reply.code(201).send(result);
    } catch (error) {
      console.error('[Passkey] Registration verify error:', error);
      return reply.code(400).send({ 
        error: error instanceof Error ? error.message : 'Passkey registration failed' 
      });
    }
  },

  /**
   * POST /passkey/login/options
   * Get authentication options (public)
   */
  async getAuthenticationOptions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { phone } = request.body as { phone?: string };

      const options = await passkeyService.generateAuthenticationOptions(phone);
      return reply.code(200).send(options);
    } catch (error) {
      console.error('[Passkey] Auth options error:', error);
      return reply.code(400).send({ 
        error: error instanceof Error ? error.message : 'Failed to generate authentication options' 
      });
    }
  },

  /**
   * POST /passkey/login/verify
   * Verify authentication and issue tokens (public)
   */
  async verifyAuthentication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { response, userId } = request.body as { 
        response: AuthenticationResponseJSON; 
        userId?: string;
      };

      const result = await passkeyService.verifyAuthentication(response, userId);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('[Passkey] Auth verify error:', error);
      return reply.code(401).send({ 
        error: error instanceof Error ? error.message : 'Passkey authentication failed' 
      });
    }
  },

  /**
   * GET /passkey/list
   * List all passkeys for current user (requires auth)
   */
  async listPasskeys(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const userId = authRequest.user.id;

      const passkeys = await passkeyService.listPasskeys(userId);
      return reply.code(200).send({ passkeys });
    } catch (error) {
      console.error('[Passkey] List error:', error);
      return reply.code(500).send({ error: 'Failed to list passkeys' });
    }
  },

  /**
   * DELETE /passkey/:id
   * Delete a passkey (requires auth)
   */
  async deletePasskey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authRequest = request as AuthenticatedRequest;
      const userId = authRequest.user.id;
      const { id } = request.params as { id: string };

      const result = await passkeyService.deletePasskey(userId, id);
      return reply.code(200).send(result);
    } catch (error) {
      console.error('[Passkey] Delete error:', error);
      return reply.code(400).send({ 
        error: error instanceof Error ? error.message : 'Failed to delete passkey' 
      });
    }
  },
};
