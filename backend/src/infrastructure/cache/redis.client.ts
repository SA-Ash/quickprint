/**
 * Redis Client for QuickPrint
 * Caching layer for sessions, rate limiting, and general caching
 */
import Redis from 'ioredis';
import { env } from '../../config/env.js';

let redis: Redis | null = null;

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    console.warn(' REDIS_URL not configured, caching disabled');
    return;
  }

  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    await redis.connect();
    console.log('Redis connected successfully');

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redis.on('close', () => {
      console.log('Redis connection closed');
    });
  } catch (error) {
    console.error('Redis connection failed:', error);
    redis = null;
    // Don't exit - allow app to run without cache in development
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('Redis disconnected');
  }
}

/**
 * Get the Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redis;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return redis !== null && redis.status === 'ready';
}

/**
 * Set a value in cache with optional TTL (in seconds)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error(`Error setting cache key ${key}:`, error);
    return false;
  }
}

/**
 * Get a value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error getting cache key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a key from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (error) {
    console.error(`Error deleting cache pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Increment a counter (useful for rate limiting)
 */
export async function incrementCounter(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const count = await redis.incr(key);
    if (ttlSeconds && count === 1) {
      // Set expiry only on first increment
      await redis.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    console.error(`Error incrementing counter ${key}:`, error);
    return 0;
  }
}

// Cache key prefixes for organization
export const CACHE_KEYS = {
  SESSION: 'session:',
  OTP: 'otp:',
  RATE_LIMIT: 'rate:',
  SHOP: 'shop:',
  USER: 'user:',
} as const;
