// backend/db.js
// PostgreSQL connection pool with proper configuration and monitoring
// Requirements: 2.1, 2.2, 10.4, 10.5
const { Pool } = require("pg");
require("dotenv").config();
const { monitorConnectionPool } = require('./utils/pool-monitor');

// Connection pool configuration with performance optimization
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  
  // Connection pool settings for optimal performance
  max: 20,                    // Maximum number of clients in the pool
  min: 5,                     // Minimum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
  
  // Statement timeout to prevent long-running queries
  statement_timeout: 30000,   // 30 seconds max per query
  
  // Query timeout
  query_timeout: 30000,
  
  // Application name for monitoring
  application_name: 'realtime-scoring-system'
});

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL 数据库连接成功！');
});

pool.on('acquire', (client) => {
  // Log when a client is acquired from the pool (optional, for debugging)
  // console.log('Client acquired from pool');
});

pool.on('error', (err, client) => {
  console.error('❌ 数据库连接意外错误:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit process, let the pool handle reconnection
});

pool.on('remove', (client) => {
  console.log('⚠️  Client removed from pool');
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down database connection pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down database connection pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

// Test initial connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ 初始数据库连接测试失败:', err.message);
  } else {
    console.log('✅ 数据库连接测试成功，当前时间:', res.rows[0].now);
  }
});

// Start connection pool monitoring
if (process.env.ENABLE_POOL_MONITORING !== 'false') {
  monitorConnectionPool(pool);
  console.log('📊 Connection pool monitoring enabled');
}

// Export query method with parameterized query support
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Export pool for advanced usage if needed
  
  // Helper method for transactions
  getClient: () => pool.connect(),
};