import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { API_PREFIX } from './config/constants.js';

import { authRoutes } from './modules/auth/index.js';
import { userRoutes } from './modules/user/index.js';
import { orderRoutes } from './modules/order/index.js';
import { shopRoutes } from './modules/shop/index.js';
import { paymentRoutes } from './modules/payment/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';
import { reviewRoutes } from './modules/review/index.js';
import { notificationRoutes } from './modules/notification/index.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { fileRoutes } from './modules/file/file.routes.js';
import { initializeStorage } from './infrastructure/storage/s3.client.js';

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
          'https://thequickprint.in',
          'http://13.234.238.248',
          'http://13.234.238.248:3000'
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

  // Register multipart at app level for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
    },
  });

  // Initialize S3/MinIO storage
  await initializeStorage();

  // File upload routes
  await fastify.register(uploadRoutes);
  
  // File management routes (download, status callbacks)
  await fastify.register(fileRoutes);

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

  // Pricing routes (public - needed for cart before checkout)
  await fastify.register(
    async (instance) => {
      const { pricingController } = await import('./modules/order/pricing.controller.js');
      instance.post('/calculate-price', pricingController.calculatePrice);
      instance.get('/shops/:shopId/surge', pricingController.getShopSurge);
    },
    { prefix: `${API_PREFIX}/pricing` }
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

  await fastify.register(reviewRoutes, { prefix: `${API_PREFIX}/reviews` });

  // Notification routes (protected)
  await fastify.register(notificationRoutes, { prefix: `${API_PREFIX}/notifications` });

  return fastify;
}

