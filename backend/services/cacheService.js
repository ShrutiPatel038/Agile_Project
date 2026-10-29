import logger from '../utils/logger.js';

// In-memory cache with TTL (per process; empty after a restart).
const memoryCache = new Map();

const localCache = {
    get: (key) => {
        const item = memoryCache.get(key);
        if (!item) return null;

        // Check if the item has expired
        if (Date.now() > item.expiry) {
            memoryCache.delete(key); // Evict expired key
            return null;
        }

        try {
            return JSON.parse(item.value);
        } catch {
            return item.value;
        }
    },
    set: (key, value, ttlSeconds = 3600) => {
        const expiry = Date.now() + (ttlSeconds * 1000);
        memoryCache.set(key, {
            value: JSON.stringify(value),
            expiry
        });
    },
    del: (key) => {
        memoryCache.delete(key);
    },
    clear: () => {
        memoryCache.clear();
    }
};

export const cacheService = {
    /**
     * Get a value from the cache
     * @param {string} key - Cache key
     */
    get: async (key) => {
        const value = localCache.get(key);
        logger.debug(value === null ? `Cache miss: ${key}` : `Cache hit: ${key}`);
        return value;
    },

    /**
     * Store a value in the cache with a time-to-live (TTL)
     * @param {string} key - Cache key
     * @param {any} value - Cache value (will be serialized to JSON string)
     * @param {number} ttlSeconds - Time-To-Live in seconds (default: 1 hour)
     */
    set: async (key, value, ttlSeconds = 3600) => {
        localCache.set(key, value, ttlSeconds);
    },

    /**
     * Delete a value from the cache (Cache Invalidation)
     * @param {string} key - Cache key
     */
    del: async (key) => {
        localCache.del(key);
    },

    /**
     * Clear all keys in memory (useful during seeding/testing)
     */
    clear: async () => {
        localCache.clear();
    }
};
