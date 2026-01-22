import { z } from 'zod';

export const createOrderSchema = z.object({
  shopId: z.string().min(1),
  file: z.object({
    url: z.string().url(),
    name: z.string().min(1),
    pages: z.number().int().positive(),
  }),
  printConfig: z.object({
    pages: z.string().default('all'),
    color: z.boolean().default(false),
    copies: z.number().int().positive().default(1),
    binding: z.boolean().default(false),
    sides: z.enum(['single', 'double']).default('single'),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED']),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderIdParamSchema = z.object({
  id: z.string().min(1),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

export const listOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  file: { url: string; name: string; pages: number };
  printConfig: { pages: string; color: boolean; copies: number; binding: boolean; sides: string };
  totalCost: string;
  shop: { id: string; businessName: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedOrdersResponse {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
