// backend/db.js
// PostgreSQL connection pool with proper configuration and monitoring
// Requirements: 2.1, 2.2, 10.4, 10.5
const { Pool } = require("pg");
require("dotenv").config();
const { monitorConnectionPool } = require('./utils/pool-monitor');

// Connection pool configuration with performance optimization
// Support both DATABASE_URL (Railway/production) and individual env vars (local dev)
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      application_name: 'realtime-scoring-system'
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'scoring',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      application_name: 'realtime-scoring-system'
    };

const pool = new Pool(poolConfig);

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