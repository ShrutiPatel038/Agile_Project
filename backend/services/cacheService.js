import Redis from 'ioredis';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisClient = null;
let useRedis = false;

// In-memory fallback for when Redis is unavailable
const memoryCache = new Map();
const localCache = {
  get: (key) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) { memoryCache.delete(key); return null; }
    try { return JSON.parse(item.value); } catch { return item.value; }
  },
  set: (key, value, ttlSeconds = 3600) => {
    memoryCache.set(key, { value: JSON.stringify(value), expiry: Date.now() + ttlSeconds * 1000 });
  },
  del: (key) => memoryCache.delete(key),
  clear: () => memoryCache.clear(),
};

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    reconnectOnError: () => false,
    retryStrategy: (times) => {
      if (times > 2) {
        logger.warn('Redis connection failed — falling back to in-memory cache');
        useRedis = false;
        return null;
      }
      return 1000;
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis cache connected');
    useRedis = true;
  });

  redisClient.on('error', (err) => {
    if (useRedis) {
      logger.warn('Redis error — switching to in-memory cache', { message: err.message });
      useRedis = false;
    }
  });
} catch (err) {
  logger.warn('Failed to initialise Redis client — using in-memory cache', { message: err.message });
}

export const cacheService = {
  get: async (key) => {
    if (useRedis && redisClient) {
      try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        logger.error('Cache get error', { key, message: err.message });
        return localCache.get(key);
      }
    }
    return localCache.get(key);
  },

  set: async (key, value, ttlSeconds = 3600) => {
    if (useRedis && redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch (err) {
        logger.error('Cache set error', { key, message: err.message });
      }
    }
    localCache.set(key, value, ttlSeconds);
  },

  del: async (key) => {
    if (useRedis && redisClient) {
      try { await redisClient.del(key); return; } catch (err) {
        logger.error('Cache del error', { key, message: err.message });
      }
    }
    localCache.del(key);
  },

  clear: async () => {
    if (useRedis && redisClient) {
      try { await redisClient.flushall(); return; } catch (err) {
        logger.error('Cache clear error', { message: err.message });
      }
    }
    localCache.clear();
  },
};
