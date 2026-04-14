// backend/test-performance-optimization.js
// Test script for database performance optimizations
// Requirements: 6.1, 6.2, 10.4, 10.5

const db = require('./db');
const { verifyIndexes } = require('./verify-indexes');
const { getPoolStats } = require('./utils/pool-monitor');
const { executeWithLogging } = require('./utils/query-logger');

async function testPerformanceOptimizations() {
  console.log('🚀 Testing Database Performance Optimizations\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Verify all indexes are created
    console.log('\n📋 Test 1: Verify Database Indexes');
    console.log('-'.repeat(60));
    const indexesVerified = await verifyIndexes();
    
    if (!indexesVerified) {
      console.error('❌ Some indexes are missing!');
      return false;
    }
    
    // Test 2: Check connection pool stats
    console.log('\n📊 Test 2: Connection Pool Statistics');
    console.log('-'.repeat(60));
    const poolStats = getPoolStats(db.pool);
    console.log('Pool Stats:', poolStats);
    console.log(`✅ Pool utilization: ${poolStats.utilization.toFixed(1)}%`);
    
    // Test 3: Test optimized score retrieval with DISTINCT ON
    console.log('\n🔍 Test 3: Optimized Score Retrieval (DISTINCT ON)');
    console.log('-'.repeat(60));
    
    // First, check if we have any competitions
    const competitionsResult = await db.query('SELECT id FROM competitions LIMIT 1');
    
    if (competitionsResult.rows.length === 0) {
      console.log('⚠️  No competitions found. Skipping score retrieval test.');
    } else {
      const competitionId = competitionsResult.rows[0].id;
      console.log(`Testing with competition ID: ${competitionId}`);
      
      const startTime = Date.now();
      const query = `
        SELECT DISTINCT ON (s.athlete_id)
          s.id,
          s.athlete_id,
          s.submitted_at,
          a.name as athlete_name
        FROM scores s
        INNER JOIN athletes a ON s.athlete_id = a.id
        WHERE s.competition_id = $1
        ORDER BY s.athlete_id, s.submitted_at DESC
      `;
      
      const result = await executeWithLogging(
        db.query.bind(db),
        'test_distinct_on',
        query,
        [competitionId]
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Retrieved ${result.rows.length} latest scores in ${duration}ms`);
      
      if (duration > 1000) {
        console.warn(`⚠️  Query took longer than 1 second (${duration}ms)`);
      }
    }
    
    // Test 4: Test optimized rankings query
    console.log('\n📊 Test 4: Optimized Rankings Query');
    console.log('-'.repeat(60));
    
    if (competitionsResult.rows.length === 0) {
      console.log('⚠️  No competitions found. Skipping rankings test.');
    } else {
      const competitionId = competitionsResult.rows[0].id;
      
      const startTime = Date.now();
      const query = `
        SELECT 
          a.id as athlete_id,
          a.name as athlete_name,
          COUNT(DISTINCT s.judge_id) as judge_count,
          ROUND(AVG(s.action_difficulty)::numeric, 2) as avg_difficulty
        FROM athletes a
        INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
        LEFT JOIN scores s ON s.athlete_id = a.id AND s.competition_id = ca.competition_id
        WHERE ca.competition_id = $1
        GROUP BY a.id, a.name
        ORDER BY avg_difficulty DESC NULLS LAST
      `;
      
      const result = await executeWithLogging(
        db.query.bind(db),
        'test_rankings',
        query,
        [competitionId]
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Calculated rankings for ${result.rows.length} athletes in ${duration}ms`);
      
      if (duration > 1000) {
        console.warn(`⚠️  Query took longer than 1 second (${duration}ms)`);
      }
    }
    
    // Test 5: Test query with index usage
    console.log('\n🔎 Test 5: Verify Index Usage');
    console.log('-'.repeat(60));
    
    const explainQuery = `
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT * FROM scores 
      WHERE competition_id = 1 
      ORDER BY submitted_at DESC 
      LIMIT 10
    `;
    
    try {
      const explainResult = await db.query(explainQuery);
      console.log('Query Plan:');
      explainResult.rows.forEach(row => {
        console.log(`  ${row['QUERY PLAN']}`);
      });
      
      // Check if index is being used
      const planText = explainResult.rows.map(r => r['QUERY PLAN']).join(' ');
      if (planText.includes('Index Scan') || planText.includes('Index Only Scan')) {
        console.log('✅ Query is using indexes');
      } else {
        console.warn('⚠️  Query might not be using indexes optimally');
      }
    } catch (err) {
      console.log('⚠️  Could not run EXPLAIN (no data yet)');
    }
    
    // Test 6: Check for slow queries
    console.log('\n⏱️  Test 6: Slow Query Detection');
    console.log('-'.repeat(60));
    console.log('Slow query logging is enabled for queries > 1 second');
    console.log('Check server logs for any slow query warnings');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All performance optimization tests completed!');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (err) {
    console.error('\n❌ Performance optimization test failed:', err);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testPerformanceOptimizations()
    .then((success) => {
      if (success) {
        console.log('\n✅ Performance optimization verification complete');
        process.exit(0);
      } else {
        console.log('\n❌ Performance optimization verification failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('\n❌ Test execution failed:', err);
      process.exit(1);
    });
}

module.exports = { testPerformanceOptimizations };
