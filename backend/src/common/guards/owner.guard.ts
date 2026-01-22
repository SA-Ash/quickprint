/**
 * Owner Guard
 * Middleware to check resource ownership
 */

import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { prisma } from '../../infrastructure/database/prisma.client.js';

/**
 * Guard that checks if the current user owns the shop specified in the route params
 * 
 * @example
 * // Route: PUT /shops/:shopId
 * { preHandler: [authMiddleware, shopOwnerGuard] }
 */
export function shopOwnerGuard(
  request: FastifyRequest<{ Params: { shopId: string } }>,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const user = request.user;
  const { shopId } = request.params;

  if (!user) {
    reply.code(401).send({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Admin can access any shop
  if (user.role === 'ADMIN') {
    done();
    return;
  }

  prisma.shop
    .findUnique({ where: { id: shopId } })
    .then((shop) => {
      if (!shop) {
        reply.code(404).send({
          success: false,
          error: 'Shop not found',
        });
        return;
      }

      if (shop.ownerId !== user.id) {
        reply.code(403).send({
          success: false,
          error: 'You do not have permission to access this shop',
        });
        return;
      }

      done();
    })
    .catch((error) => {
      console.error('[ShopOwnerGuard] Error:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    });
}

/**
 * Guard that checks if the current user owns the order or is the shop owner
 * 
 * @example
 * // Route: GET /orders/:orderId
 * { preHandler: [authMiddleware, orderAccessGuard] }
 */
export function orderAccessGuard(
  request: FastifyRequest<{ Params: { orderId: string } }>,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const user = request.user;
  const { orderId } = request.params;

  if (!user) {
    reply.code(401).send({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Admin can access any order
  if (user.role === 'ADMIN') {
    done();
    return;
  }

  prisma.order
    .findUnique({
      where: { id: orderId },
      include: { shop: { select: { ownerId: true } } },
    })
    .then((order) => {
      if (!order) {
        reply.code(404).send({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      // Allow if user is order owner or shop owner
      if (order.userId !== user.id && order.shop.ownerId !== user.id) {
        reply.code(403).send({
          success: false,
          error: 'You do not have permission to access this order',
        });
        return;
      }

      done();
    })
    .catch((error) => {
      console.error('[OrderAccessGuard] Error:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    });
}

/**
 * Guard that checks if current user is the shop owner based on their user ID
 * (for routes that don't have shopId in params)
 * 
 * @example
 * // Route: GET /partner/orders
 * { preHandler: [authMiddleware, isShopOwnerGuard] }
 */
export function isShopOwnerGuard(
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

  if (user.role !== 'SHOP' && user.role !== 'ADMIN') {
    reply.code(403).send({
      success: false,
      error: 'Only shop owners can access this resource',
    });
    return;
  }

  // For non-admin, verify they actually have a shop
  if (user.role === 'SHOP') {
    prisma.shop
      .findUnique({ where: { ownerId: user.id } })
      .then((shop) => {
        if (!shop) {
          reply.code(403).send({
            success: false,
            error: 'No shop found for this account',
          });
          return;
        }
        done();
      })
      .catch((error) => {
        console.error('[IsShopOwnerGuard] Error:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error',
        });
      });
  } else {
    done();
  }
}
