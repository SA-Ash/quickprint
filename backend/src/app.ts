import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { API_PREFIX } from './config/constants.js';

import { authRoutes } from './modules/auth/index.js';
import { userRoutes } from './modules/user/index.js';
import { orderRoutes } from './modules/order/index.js';
import { shopRoutes } from './modules/shop/index.js';
import { paymentRoutes } from './modules/payment/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';

import { authMiddleware } from './common/middleware/index.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  await fastify.register(cors, {
    origin: env.NODE_ENV === 'development' 
      ? true 
      : [
          'https://quickprint.com',
          'https://www.quickprint.com',
          'https://thequickprint.in'
        ],
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Auth routes (public)
  await fastify.register(authRoutes, { prefix: `${API_PREFIX}/auth` });

  // Shop routes (mixed public/protected - handles auth internally)
  await fastify.register(shopRoutes, { prefix: `${API_PREFIX}/shops` });

  // User routes (protected)
  await fastify.register(
    async (instance) => {
      instance.addHook('preHandler', authMiddleware);
      await instance.register(userRoutes, { prefix: '' });
    },
    { prefix: `${API_PREFIX}/users` }
  );

  // Order routes (protected)
  await fastify.register(
    async (instance) => {
      instance.addHook('preHandler', authMiddleware);
      await instance.register(orderRoutes, { prefix: '' });
    },
    { prefix: `${API_PREFIX}/orders` }
  );

  // Payment routes (protected except webhook)
  await fastify.register(
    async (instance) => {
      instance.addHook('preHandler', authMiddleware);
      await instance.register(paymentRoutes, { prefix: '' });
    },
    { prefix: `${API_PREFIX}/payments` }
  );

  // Analytics routes (protected - shop owners only)
  await fastify.register(
    async (instance) => {
      instance.addHook('preHandler', authMiddleware);
      await instance.register(analyticsRoutes, { prefix: '' });
    },
    { prefix: `${API_PREFIX}/analytics` }
  );

  return fastify;
}

