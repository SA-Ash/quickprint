/**
 * Decorators for Fastify
 * Request/Reply decorators and route metadata helpers
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { RequestUser } from '../types/request.types.js';

/**
 * Decorates Fastify instance with user property on request
 * Call this during app initialization
 * 
 * @example
 * // In app.ts
 * import { decorateRequest } from './common/decorators/index.js';
 * decorateRequest(app);
 */
export function decorateRequest(app: FastifyInstance): void {
  // Decorate request with user property (initially undefined)
  app.decorateRequest('user', null);
}

/**
 * Helper to get authenticated user from request
 * Throws if user is not authenticated
 */
export function getUser(request: FastifyRequest): RequestUser {
  if (!request.user) {
    throw new Error('User not authenticated');
  }
  return request.user as RequestUser;
}

/**
 * Helper to get authenticated user ID from request
 * Throws if user is not authenticated
 */
export function getUserId(request: FastifyRequest): string {
  return getUser(request).id;
}

/**
 * Helper to check if user is authenticated
 */
export function isAuthenticated(request: FastifyRequest): boolean {
  return request.user !== undefined && request.user !== null;
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(request: FastifyRequest, role: string): boolean {
  return isAuthenticated(request) && request.user?.role === role;
}

/**
 * Helper to check if user is admin
 */
export function isAdmin(request: FastifyRequest): boolean {
  return hasRole(request, 'ADMIN');
}

/**
 * Helper to check if user is shop owner
 */
export function isShopOwner(request: FastifyRequest): boolean {
  return hasRole(request, 'SHOP');
}

/**
 * Helper to check if user is student
 */
export function isStudent(request: FastifyRequest): boolean {
  return hasRole(request, 'STUDENT');
}

/**
 * Send success response
 */
export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200): void {
  reply.code(statusCode).send({
    success: true,
    data,
  });
}

/**
 * Send error response
 */
export function sendError(reply: FastifyReply, error: string, statusCode = 400): void {
  reply.code(statusCode).send({
    success: false,
    error,
  });
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  reply: FastifyReply,
  items: T[],
  pagination: { page: number; limit: number; total: number }
): void {
  reply.code(200).send({
    success: true,
    data: {
      items,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    },
  });
}
