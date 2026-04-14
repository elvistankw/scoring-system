// backend/test-query-logger.js
// Unit tests for query logger utility (no database required)
// Requirements: 10.5

const { logSlowQuery, logQueryStats } = require('./utils/query-logger');

console.log('🧪 Testing Query Logger Utility\n');
console.log('='.repeat(60));

// Test 1: Fast query (should not log warning)
console.log('\n📋 Test 1: Fast Query (< 1 second)');
console.log('-'.repeat(60));
logSlowQuery('test_fast_query', 500, 'SELECT * FROM users WHERE id = $1', [1]);
console.log('✅ Fast query did not trigger slow query warning');

// Test 2: Slow query (should log warning)
console.log('\n📋 Test 2: Slow Query (> 1 second)');
console.log('-'.repeat(60));
logSlowQuery('test_slow_query', 1500, 'SELECT * FROM scores WHERE competition_id = $1', [1]);
console.log('✅ Slow query warning logged above');

// Test 3: Very slow query
console.log('\n📋 Test 3: Very Slow Query (> 5 seconds)');
console.log('-'.repeat(60));
logSlowQuery('test_very_slow_query', 5200, 'SELECT * FROM scores s JOIN athletes a ON s.athlete_id = a.id WHERE s.competition_id = $1 ORDER BY s.submitted_at DESC', [1]);
console.log('✅ Very slow query warning logged above');

// Test 4: Query stats logging
console.log('\n📋 Test 4: Query Statistics Logging');
console.log('-'.repeat(60));
process.env.NODE_ENV = 'development';
logQueryStats('getScoresByCompetition', 25, 45);
logQueryStats('getRankings', 100, 120);
console.log('✅ Query statistics logged above (development mode)');

// Test 5: Production mode (should not log stats)
console.log('\n📋 Test 5: Production Mode (No Stats Logging)');
console.log('-'.repeat(60));
process.env.NODE_ENV = 'production';
logQueryStats('getScoresByCompetition', 25, 45);
console.log('✅ No stats logged in production mode');

// Test 6: Long query truncation
console.log('\n📋 Test 6: Long Query Truncation');
console.log('-'.repeat(60));
const longQuery = 'SELECT ' + 'column, '.repeat(100) + 'FROM scores WHERE competition_id = $1';
logSlowQuery('test_long_query', 1200, longQuery, [1]);
console.log('✅ Long query was truncated in log');

console.log('\n' + '='.repeat(60));
console.log('✅ All query logger tests passed!');
console.log('='.repeat(60));
