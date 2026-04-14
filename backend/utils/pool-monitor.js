// backend/utils/pool-monitor.js
// PostgreSQL connection pool monitoring
// Requirements: 10.4, 10.5

/**
 * Monitor PostgreSQL connection pool statistics
 * @param {Pool} pool - PostgreSQL connection pool
 */
function monitorConnectionPool(pool) {
  // Log pool statistics every 30 seconds
  const MONITOR_INTERVAL = 30000; // 30 seconds
  
  setInterval(() => {
    const stats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Connection Pool Stats:', stats);
    
    // Warn if pool is exhausted
    if (stats.waiting > 0) {
      console.warn('⚠️  Connection pool has waiting clients:', stats.waiting);
    }
    
    // Warn if pool utilization is high (> 80%)
    const utilization = ((stats.total - stats.idle) / stats.total) * 100;
    if (utilization > 80) {
      console.warn(`⚠️  High pool utilization: ${utilization.toFixed(1)}%`);
    }
    
  }, MONITOR_INTERVAL);
  
  // Log pool events
  pool.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 New client connected to pool');
    }
  });
  
  pool.on('acquire', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Client acquired from pool');
    }
  });
  
  pool.on('remove', () => {
    console.log('🗑️  Client removed from pool');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Pool error:', err.message);
  });
}

/**
 * Get current pool statistics
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Object} Pool statistics
 */
function getPoolStats(pool) {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    utilization: ((pool.totalCount - pool.idleCount) / pool.totalCount) * 100
  };
}

module.exports = {
  monitorConnectionPool,
  getPoolStats
};
