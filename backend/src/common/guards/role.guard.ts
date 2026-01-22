/**
 * Role Guard
 * Middleware to check if user has required role(s)
 */

import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { UserRole } from '../types/common.types.js';

/**
 * Creates a guard that checks if the user has one of the required roles
 * 
 * @example
 * // Single role
 * { preHandler: [authMiddleware, roleGuard('ADMIN')] }
 * 
 * @example
 * // Multiple roles
 * { preHandler: [authMiddleware, roleGuard('SHOP', 'ADMIN')] }
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return function (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) {
    const user = request.user;

    if (!user) {
      reply.code(401).send({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      reply.code(403).send({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    done();
  };
}

/**
 * Guard that only allows STUDENT role
 */
export const studentOnly = roleGuard('STUDENT');

/**
 * Guard that only allows SHOP role
 */
export const shopOnly = roleGuard('SHOP');

/**
 * Guard that only allows ADMIN role
 */
export const adminOnly = roleGuard('ADMIN');

/**
 * Guard that allows both SHOP and ADMIN roles
 */
export const shopOrAdmin = roleGuard('SHOP', 'ADMIN');
