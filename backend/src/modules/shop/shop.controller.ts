import type { FastifyRequest, FastifyReply } from 'fastify';
import { shopService } from './shop.service.js';
import {
  nearbyShopsSchema,
  updateShopSchema,
  updatePricingSchema,
  shopDetailsQuerySchema,
  uploadPhotoSchema,
} from './shop.schema.js';

export const shopController = {
  async getNearbyShops(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = nearbyShopsSchema.parse(request.query);
      const shops = await shopService.getNearbyShops(input);
      return reply.code(200).send({ shops });
    } catch (error) {
      console.error('[Shop Controller] getNearbyShops error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(200).send({ shops: [] }); // Return empty array instead of 500
    }
  },

  async getAllShops(request: FastifyRequest, reply: FastifyReply) {
    try {
      const shops = await shopService.getAllShops();
      return reply.code(200).send({ shops });
    } catch {
      return reply.code(500).send({ error: 'Failed to get shops' });
    }
  },

  async getShopById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const shop = await shopService.getShopById(id);

      if (!shop) {
        return reply.code(404).send({ error: 'Shop not found' });
      }

      return reply.code(200).send(shop);
    } catch {
      return reply.code(500).send({ error: 'Failed to get shop' });
    }
  },

  async getMyShop(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const shop = await shopService.getShopByOwnerId(request.user.id);

      if (!shop) {
        return reply.code(404).send({ error: 'Shop not found' });
      }

      return reply.code(200).send(shop);
    } catch {
      return reply.code(500).send({ error: 'Failed to get shop' });
    }
  },

  async updateShop(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const input = updateShopSchema.parse(request.body);
      const shop = await shopService.updateShop(id, request.user.id, input);

      return reply.code(200).send(shop);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update shop' });
    }
  },

  async updatePricing(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const input = updatePricingSchema.parse(request.body);
      const shop = await shopService.updatePricing(id, request.user.id, input);

      return reply.code(200).send(shop);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update pricing' });
    }
  },

  async toggleActive(
    request: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const { isActive } = request.body as { isActive: boolean };
      const shop = await shopService.toggleShopActive(id, request.user.id, isActive);

      return reply.code(200).send(shop);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to toggle shop status' });
    }
  },

  async getShopDetails(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const query = shopDetailsQuerySchema.parse(request.query);
      const userId = request.user?.id;
      const details = await shopService.getShopDetails(id, query.lat, query.lng, userId);

      if (!details) {
        return reply.code(404).send({ error: 'Shop not found' });
      }

      return reply.code(200).send(details);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to get shop details' });
    }
  },

  async getSuggestions(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const query = shopDetailsQuerySchema.parse(request.query);
      
      if (query.lat === undefined || query.lng === undefined) {
        return reply.code(400).send({ error: 'lat and lng are required' });
      }

      const suggestions = await shopService.getSuggestions(id, query.lat, query.lng);
      return reply.code(200).send({ suggestions });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error });
      }
      return reply.code(500).send({ error: 'Failed to get suggestions' });
    }
  },

  async uploadPhoto(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const input = uploadPhotoSchema.parse(request.body);
      const photo = await shopService.uploadPhoto(request.user.id, id, input.url, input.caption);
      return reply.code(201).send(photo);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return reply.code(400).send({ error: 'Validation failed', details: error });
        }
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to upload photo' });
    }
  },

  async getShopPhotos(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const photos = await shopService.getShopPhotos(id);
      return reply.code(200).send({ photos });
    } catch {
      return reply.code(500).send({ error: 'Failed to get photos' });
    }
  },

  async updateServiceAreas(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const { serviceAreas } = request.body as { serviceAreas: Array<{
        id?: string;
        name: string;
        address?: string;
        placeId?: string;
        active?: boolean;
      }> };

      const shop = await shopService.updateServiceAreas(id, request.user.id, serviceAreas);
      return reply.code(200).send(shop);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Shop not found') {
          return reply.code(404).send({ error: error.message });
        }
        if (error.message.includes('Not authorized')) {
          return reply.code(403).send({ error: error.message });
        }
      }
      return reply.code(500).send({ error: 'Failed to update service areas' });
    }
  },
};
