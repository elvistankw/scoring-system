// backend/redis-enhanced.js
// Enhanced Redis connection with comprehensive configuration
// Requirements: 2.6, 10.5

const Redis = require("ioredis");

// Redis connection configuration with environment variables
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  username: process.env.REDIS_USERNAME || undefined,
  family: parseInt(process.env.REDIS_FAMILY || '4', 10),
  keepAlive: parseInt(process.env.REDIS_KEEPALIVE || '30000', 10),
  
  // Connection timeouts
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
  
  // Retry strategy configuration
  retryStrategy: (times) => {
    const maxRetries = parseInt(process.env.REDIS_MAX_RECONNECT_ATTEMPTS || '10', 10);
    if (times > maxRetries) {
      console.log('⚠️  Redis unavailable - continuing without cache');
      return null; // Stop retrying
    }
    
    const delay = Math.min(times * parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILURE || '100', 10), 2000);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'EPIPE'];
    return targetErrors.some(targetError => err.message.includes(targetError));
  },
  
  // Advanced options
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
  enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
  enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
  
  // Show friendly error messages in development
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',
};

// Create Redis client
const redis = new Redis(redisConfig);

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;

// Connection event handlers
redis.on('connect', () => {
  connectionAttempts++;
  console.log(`🔄 Redis connecting... (attempt ${connectionAttempts})`);
});

redis.on('ready', () => {
  isConnected = true;
  console.log('✅ Redis connected successfully');
  console.log(`📊 Redis info: ${redisConfig.host}:${redisConfig.port} DB:${redisConfig.db}`);
});

redis.on('error', (err) => {
  isConnected = false;
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Redis unavailable - running without cache (this is OK for development)');
  } else {
    console.error('❌ Redis connection error:', err.message);
  }
});

redis.on('close', () => {
  isConnected = false;
  console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', (delay) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms...`);
});

redis.on('end', () => {
  isConnected = false;
  console.log('🛑 Redis connection ended');
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received. Shutting down Redis connection...`);
  try {
    await redis.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error.message);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Test Redis connection with timeout
const testConnection = async () => {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      console.log('✅ Redis connection verified');
      return true;
    }
  } catch (error) {
    console.log('⚠️  Redis unavailable - running without cache (this is OK for development)');
    return false;
  }
};

// Initialize connection test
testConnection();

// Cache statistics tracking
const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  operations: 0,
  startTime: Date.now(),
  
  getHitRate: function() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total * 100).toFixed(2) : 0;
  },
  
  getUptime: function() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  },
  
  reset: function() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.operations = 0;
    this.startTime = Date.now();
  },
  
  getStats: function() {
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      operations: this.operations,
      hitRate: this.getHitRate(),
      uptime: this.getUptime(),
      isConnected: isConnected
    };
  }
};

// Safe Redis operation wrapper
const safeRedisOperation = async (operation, fallback = null) => {
  if (!isConnected) {
    cacheStats.errors++;
    return fallback;
  }
  
  try {
    cacheStats.operations++;
    const result = await operation();
    return result;
  } catch (error) {
    cacheStats.errors++;
    console.warn('Redis operation failed:', error.message);
    return fallback;
  }
};

// Enhanced helper functions
const redisHelpers = {
  isConnected: () => isConnected,
  getCacheStats: () => cacheStats.getStats(),
  resetCacheStats: () => cacheStats.reset(),
  
  // All existing helper functions with safe operation wrapper
  setLatestScore: async (competitionId, scoreData, ttl = null) => {
    const key = `latest_score:competition:${competitionId}`;
    const defaultTtl = parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10);
    const expiration = ttl || defaultTtl;
    
    return safeRedisOperation(async () => {
      await redis.set(key, JSON.stringify(scoreData), 'EX', expiration);
      return true;
    }, false);
  },

  getLatestScore: async (competitionId) => {
    const key = `latest_score:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      const data = await redis.get(key);
      if (data) {
        cacheStats.hits++;
        return JSON.parse(data);
      } else {
        cacheStats.misses++;
        return null;
      }
    }, null);
  },

  // ... (继续添加其他helper函数)
};

module.exports = {
  redis,
  redisHelpers,
};