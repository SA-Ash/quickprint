import type { FastifyRequest } from 'fastify';
import type { UserRole } from './common.types.js';

export interface RequestUser {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  college: string | null;
}


export interface AuthenticatedRequest extends FastifyRequest {
  user: RequestUser;
}

export interface OptionalAuthRequest extends FastifyRequest {
  user?: RequestUser;
}


export interface RequestWithId extends AuthenticatedRequest {
  params: { id: string };
}

export interface RequestWithShopId extends AuthenticatedRequest {
  params: { shopId: string };
}

export interface RequestWithOrderId extends AuthenticatedRequest {
  params: { orderId: string };
}

export interface PaginatedRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
  };
}
