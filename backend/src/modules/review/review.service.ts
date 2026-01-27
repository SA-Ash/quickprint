import { prisma } from '../../infrastructure/database/prisma.client.js';
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewResponse,
  ReviewsWithStats,
} from './review.schema.js';

function formatReviewResponse(review: any): ReviewResponse {
  return {
    id: review.id,
    userId: review.userId,
    userName: review.user?.name || null,
    shopId: review.shopId,
    rating: review.rating,
    comment: review.comment,
    photos: review.photos,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function recalculateShopRating(shopId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { shopId },
    select: { rating: true },
  });

  const reviewCount = reviews.length;
  const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
  const rating = reviewCount > 0 ? totalRatingSum / reviewCount : 0;

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      totalRatingSum,
    },
  });
}

export const reviewService = {
  async createReview(userId: string, input: CreateReviewInput): Promise<ReviewResponse> {
    const { shopId, rating, comment, photos } = input;

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new Error('Shop not found');
    }

    const existingReview = await prisma.review.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this shop');
    }

    const review = await prisma.review.create({
      data: {
        userId,
        shopId,
        rating,
        comment: comment || null,
        photos: photos || [],
      },
      include: { user: { select: { name: true } } },
    });

    await recalculateShopRating(shopId);

    return formatReviewResponse(review);
  },

  async updateReview(userId: string, reviewId: string, input: UpdateReviewInput): Promise<ReviewResponse> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Not authorized to update this review');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.comment !== undefined && { comment: input.comment }),
        ...(input.photos !== undefined && { photos: input.photos }),
      },
      include: { user: { select: { name: true } } },
    });

    if (input.rating !== undefined) {
      await recalculateShopRating(review.shopId);
    }

    return formatReviewResponse(updatedReview);
  },

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Not authorized to delete this review');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    await recalculateShopRating(review.shopId);
  },

  async getShopReviews(shopId: string, page: number, limit: number): Promise<ReviewsWithStats> {
    const skip = (page - 1) * limit;

    const [reviews, total, allReviews] = await Promise.all([
      prisma.review.findMany({
        where: { shopId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { shopId } }),
      prisma.review.findMany({
        where: { shopId },
        select: { rating: true },
      }),
    ]);

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    for (const r of allReviews) {
      ratingBreakdown[r.rating]++;
      totalRating += r.rating;
    }

    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    return {
      items: reviews.map(formatReviewResponse),
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingBreakdown,
    };
  },

  async getUserReview(userId: string, shopId: string): Promise<ReviewResponse | null> {
    const review = await prisma.review.findUnique({
      where: { userId_shopId: { userId, shopId } },
      include: { user: { select: { name: true } } },
    });

    if (!review) return null;
    return formatReviewResponse(review);
  },
};
