import { z } from 'zod';

export const createReviewSchema = z.object({
  shopId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});

export const getReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type GetReviewsInput = z.infer<typeof getReviewsSchema>;

export interface ReviewResponse {
  id: string;
  userId: string;
  userName: string | null;
  shopId: string;
  rating: number;
  comment: string | null;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewsWithStats {
  items: ReviewResponse[];
  total: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
}
