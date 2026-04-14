// backend/redis.js
// Redis connection with retry strategy and error handling
// Requirements: 2.6, 10.5
const Redis = require("ioredis");
require("dotenv").config();

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
let hasShownInstallGuide = false;

// Redis connection configuration with retry strategy
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
  
  // Retry strategy configuration - reduced for development
  retryStrategy: (times) => {
    const maxRetries = parseInt(process.env.REDIS_MAX_RECONNECT_ATTEMPTS || '3', 10);
    if (times > maxRetries) {
      if (!hasShownInstallGuide && process.env.NODE_ENV === 'development') {
        showRedisInstallGuide();
        hasShownInstallGuide = true;
      }
      return null; // Stop retrying
    }
    
    const delay = Math.min(times * parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILURE || '100', 10), 500);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'EPIPE'];
    return targetErrors.some(targetError => err.message.includes(targetError));
  },
  
  // Advanced options
  lazyConnect: false, // 改为false以立即连接
  enableOfflineQueue: false, // 保持false以快速失败
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10), // 增加重试次数
  enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
  
  // Show friendly error messages in development
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',
};

// Show Redis installation guide
function showRedisInstallGuide() {
  console.log('\n📦 Redis未安装或未运行');
  console.log('💡 快速安装Redis:');
  console.log('');
  console.log('🐳 Docker方式 (推荐):');
  console.log('   docker run --name redis-scoring -p 6379:6379 -d redis:latest');
  console.log('');
  console.log('🪟 Windows方式:');
  console.log('   1. 安装WSL2: wsl --install');
  console.log('   2. 在WSL2中: sudo apt install redis-server');
  console.log('   3. 启动服务: sudo service redis-server start');
  console.log('');
  console.log('📚 详细指南: 运行 node install-redis.js');
  console.log('🧪 测试配置: 运行 node test-redis-config.js');
  console.log('');
}

// Create Redis client
const redis = new Redis(redisConfig);

// Connection event handlers
redis.on('connect', () => {
  connectionAttempts++;
});

redis.on('ready', () => {
  isConnected = true;
  console.log('✅ Redis connected successfully');
  console.log(`📊 Redis info: ${redisConfig.host}:${redisConfig.port} DB:${redisConfig.db}`);
});

redis.on('error', () => {
  isConnected = false;
  // Silent - errors are expected when Redis is not running
  // The application will continue with graceful degradation
});

redis.on('close', () => {
  isConnected = false;
});

redis.on('reconnecting', () => {
  // Silent
});

redis.on('end', () => {
  isConnected = false;
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  if (isConnected) {
    console.log(`🛑 ${signal} received. Shutting down Redis connection...`);
    try {
      await redis.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Test Redis connection - silent failure
redis.ping()
  .then(() => {
    console.log('✅ Redis connection verified');
  })
  .catch(() => {
    console.log('⚠️  Redis unavailable - running without cache (this is OK for development)');
  });

// Cache hit/miss statistics tracking
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
    if (process.env.NODE_ENV === 'development') {
      console.warn('Redis operation failed:', error.message);
    }
    return fallback;
  }
};

// Helper functions for common Redis operations
const redisHelpers = {
  // Connection status
  isConnected: () => isConnected,
  getCacheStats: () => cacheStats.getStats(),
  resetCacheStats: () => cacheStats.reset(),

  /**
   * Set latest score for a competition with expiration (Write-Through Pattern)
   * @param {number} competitionId - Competition ID
   * @param {object} scoreData - Score data object
   * @param {number} ttl - Time to live in seconds (default: from env)
   */
  setLatestScore: async (competitionId, scoreData, ttl = null) => {
    const key = `latest_score:competition:${competitionId}`;
    const defaultTtl = parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10);
    const expiration = ttl || defaultTtl;
    
    return safeRedisOperation(async () => {
      await redis.set(key, JSON.stringify(scoreData), 'EX', expiration);
      return true;
    }, false);
  },

  /**
   * Get latest score for a competition (Cache-Aside Pattern)
   * @param {number} competitionId - Competition ID
   * @returns {object|null} Score data or null
   */
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

  /**
   * Update leaderboard with athlete score
   * @param {number} competitionId - Competition ID
   * @param {number} score - Total score
   * @param {string} athleteId - Athlete ID
   */
  updateLeaderboard: async (competitionId, score, athleteId) => {
    const key = `leaderboard:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      await redis.zadd(key, score, `athlete_id:${athleteId}`);
      // Set expiration for leaderboard (2 hours)
      await redis.expire(key, 7200);
      return true;
    }, false);
  },

  /**
   * Get top N athletes from leaderboard
   * @param {number} competitionId - Competition ID
   * @param {number} limit - Number of top athletes (default: 10)
   * @returns {array} Array of {athleteId, score}
   */
  getLeaderboard: async (competitionId, limit = 10) => {
    const key = `leaderboard:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
      
      // Parse results into array of objects
      const leaderboard = [];
      for (let i = 0; i < results.length; i += 2) {
        const athleteId = results[i].replace('athlete_id:', '');
        const score = parseFloat(results[i + 1]);
        leaderboard.push({ athleteId, score });
      }
      
      cacheStats.hits++;
      return leaderboard;
    }, []);
  },

  /**
   * Add competition to active competitions set
   * @param {number} competitionId - Competition ID
   */
  addActiveCompetition: async (competitionId) => {
    return safeRedisOperation(async () => {
      await redis.sadd('active_competitions', competitionId);
      return true;
    }, false);
  },

  /**
   * Remove competition from active competitions set
   * @param {number} competitionId - Competition ID
   */
  removeActiveCompetition: async (competitionId) => {
    return safeRedisOperation(async () => {
      await redis.srem('active_competitions', competitionId);
      return true;
    }, false);
  },

  /**
   * Get all active competitions
   * @returns {array} Array of competition IDs
   */
  getActiveCompetitions: async () => {
    return safeRedisOperation(async () => {
      const competitions = await redis.smembers('active_competitions');
      cacheStats.hits++;
      return competitions;
    }, []);
  },

  /**
   * Track WebSocket connection for a competition
   * @param {number} competitionId - Competition ID
   * @param {string} socketId - Socket ID
   */
  addWebSocketConnection: async (competitionId, socketId) => {
    const key = `ws_connections:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      await redis.sadd(key, socketId);
      await redis.expire(key, 3600); // 1 hour expiration
      return true;
    }, false);
  },

  /**
   * Remove WebSocket connection
   * @param {number} competitionId - Competition ID
   * @param {string} socketId - Socket ID
   */
  removeWebSocketConnection: async (competitionId, socketId) => {
    const key = `ws_connections:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      await redis.srem(key, socketId);
      return true;
    }, false);
  },

  /**
   * Get count of WebSocket connections for a competition
   * @param {number} competitionId - Competition ID
   * @returns {number} Connection count
   */
  getWebSocketConnectionCount: async (competitionId) => {
    const key = `ws_connections:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      const count = await redis.scard(key);
      return count;
    }, 0);
  },

  /**
   * Cache competition data (Cache-Aside Pattern)
   * @param {number} competitionId - Competition ID
   * @param {object} competitionData - Competition data object
   * @param {number} ttl - Time to live in seconds (default: from env)
   */
  cacheCompetition: async (competitionId, competitionData, ttl = null) => {
    const key = `competition:${competitionId}`;
    const defaultTtl = parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10);
    const expiration = ttl || defaultTtl;
    
    return safeRedisOperation(async () => {
      await redis.set(key, JSON.stringify(competitionData), 'EX', expiration);
      return true;
    }, false);
  },

  /**
   * Get cached competition data (Cache-Aside Pattern)
   * @param {number} competitionId - Competition ID
   * @returns {object|null} Competition data or null
   */
  getCachedCompetition: async (competitionId) => {
    const key = `competition:${competitionId}`;
    
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

  /**
   * Cache competition list (Cache-Aside Pattern)
   * @param {string} filterKey - Filter key (e.g., "all:all:all" or "active:华东赛区:individual")
   * @param {array} competitions - Array of competition objects
   * @param {number} ttl - Time to live in seconds (default: from env)
   */
  cacheCompetitionList: async (filterKey, competitions, ttl = null) => {
    const key = `competitions:list:${filterKey}`;
    const defaultTtl = parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10);
    const expiration = ttl || defaultTtl;
    
    return safeRedisOperation(async () => {
      await redis.set(key, JSON.stringify(competitions), 'EX', expiration);
      return true;
    }, false);
  },

  /**
   * Get cached competition list (Cache-Aside Pattern)
   * @param {string} filterKey - Filter key
   * @returns {array|null} Array of competitions or null
   */
  getCachedCompetitionList: async (filterKey) => {
    const key = `competitions:list:${filterKey}`;
    
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

  /**
   * Cache rankings data
   * @param {number} competitionId - Competition ID
   * @param {array} rankings - Rankings array
   * @param {number} ttl - Time to live in seconds (default: 7200)
   */
  cacheRankings: async (competitionId, rankings, ttl = 7200) => {
    const key = `rankings:competition:${competitionId}`;
    
    return safeRedisOperation(async () => {
      await redis.set(key, JSON.stringify(rankings), 'EX', ttl);
      return true;
    }, false);
  },

  /**
   * Get cached rankings
   * @param {number} competitionId - Competition ID
   * @returns {array|null} Rankings array or null
   */
  getCachedRankings: async (competitionId) => {
    const key = `rankings:competition:${competitionId}`;
    
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

  /**
   * Invalidate all caches related to a competition
   * @param {number} competitionId - Competition ID
   */
  invalidateCompetitionCaches: async (competitionId) => {
    return safeRedisOperation(async () => {
      const keys = [
        `competition:${competitionId}`,
        `competition:${competitionId}:athletes`,
        `latest_score:competition:${competitionId}`,
        `rankings:competition:${competitionId}`,
        `leaderboard:competition:${competitionId}`
      ];
      
      // Also invalidate list caches
      const listKeys = await redis.keys('competitions:list:*');
      
      const allKeys = [...keys, ...listKeys];
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
      }
      return true;
    }, false);
  },

  /**
   * Invalidate score-related caches for a competition
   * @param {number} competitionId - Competition ID
   */
  invalidateScoreCaches: async (competitionId) => {
    return safeRedisOperation(async () => {
      const keys = [
        `latest_score:competition:${competitionId}`,
        `rankings:competition:${competitionId}`,
        `leaderboard:competition:${competitionId}`
      ];
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    }, false);
  }
};

module.exports = {
  redis,
  redisHelpers,
};
