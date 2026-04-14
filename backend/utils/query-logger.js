// backend/utils/query-logger.js
// Query performance logging utility
// Requirements: 6.1, 10.5

/**
 * Log slow queries (> 1 second)
 * @param {string} queryName - Name/description of the query
 * @param {number} duration - Query duration in milliseconds
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 */
function logSlowQuery(queryName, duration, query, params = []) {
  const SLOW_QUERY_THRESHOLD = 1000; // 1 second
  
  if (duration > SLOW_QUERY_THRESHOLD) {
    console.warn('⚠️  SLOW QUERY DETECTED');
    console.warn(`   Name: ${queryName}`);
    console.warn(`   Duration: ${duration}ms`);
    console.warn(`   Query: ${query.substring(0, 200)}${query.length > 200 ? '...' : ''}`);
    console.warn(`   Params: ${JSON.stringify(params)}`);
    console.warn(`   Timestamp: ${new Date().toISOString()}`);
  }
}

/**
 * Wrapper for database queries with performance logging
 * @param {Function} queryFn - Database query function
 * @param {string} queryName - Name/description of the query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function executeWithLogging(queryFn, queryName, query, params = []) {
  const startTime = Date.now();
  
  try {
    const result = await queryFn(query, params);
    const duration = Date.now() - startTime;
    
    // Log slow queries
    logSlowQuery(queryName, duration, query, params);
    
    // Log all queries in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Query: ${queryName} - ${duration}ms`);
    }
    
    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query failed: ${queryName} - ${duration}ms`);
    console.error(`   Error: ${err.message}`);
    throw err;
  }
}

/**
 * Log query statistics
 * @param {string} queryName - Name/description of the query
 * @param {number} rowCount - Number of rows returned/affected
 * @param {number} duration - Query duration in milliseconds
 */
function logQueryStats(queryName, rowCount, duration) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${queryName}: ${rowCount} rows in ${duration}ms`);
  }
}

module.exports = {
  logSlowQuery,
  executeWithLogging,
  logQueryStats
};
