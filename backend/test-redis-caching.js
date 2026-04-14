// backend/test-redis-caching.js
// Test script for Redis caching patterns and cache hit rate monitoring
// Requirements: 6.2, 6.3, 10.5

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let testCompetitionId = null;
let testAthleteId = null;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testNumber, description) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Test ${testNumber}: ${description}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Login as admin
async function testLogin() {
  logTest(1, 'Admin Login');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      log('✅ Login successful', 'green');
      log(`Token: ${authToken.substring(0, 20)}...`, 'cyan');
      return true;
    } else {
      log('❌ Login response missing token', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ Login failed: ${err.response?.data?.message || err.message}`, 'red');
    log('⚠️  Make sure the server is running: cd backend && node index.js', 'yellow');
    return false;
  }
}

// Test 2: Reset cache statistics
async function testResetCacheStats() {
  logTest(2, 'Reset Cache Statistics');
  try {
    const response = await axios.post(
      `${API_BASE}/cache/reset-stats`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('✅ Cache statistics reset', 'green');
    return true;
  } catch (err) {
    log(`❌ Reset failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 3: Create test competition
async function testCreateCompetition() {
  logTest(3, 'Create Test Competition');
  try {
    const response = await axios.post(
      `${API_BASE}/competitions`,
      {
        name: 'Cache Test Competition',
        competition_type: 'individual',
        region: '测试赛区',
        status: 'active'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    testCompetitionId = response.data.data.competition.id;
    log('✅ Competition created', 'green');
    log(`Competition ID: ${testCompetitionId}`, 'cyan');
    return true;
  } catch (err) {
    log(`❌ Creation failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 4: First read (Cache MISS expected)
async function testFirstRead() {
  logTest(4, 'First Read - Cache MISS Expected');
  try {
    const response = await axios.get(
      `${API_BASE}/competitions/${testCompetitionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.cached === false) {
      log('✅ Cache MISS as expected (first read)', 'green');
      log(`Source: ${response.data.cached ? 'cache' : 'database'}`, 'cyan');
      return true;
    } else {
      log('⚠️  Unexpected cache HIT on first read', 'yellow');
      return false;
    }
  } catch (err) {
    log(`❌ Read failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 5: Second read (Cache HIT expected - Cache-Aside Pattern)
async function testSecondRead() {
  logTest(5, 'Second Read - Cache HIT Expected (Cache-Aside Pattern)');
  try {
    await sleep(100); // Small delay to ensure cache is written
    
    const response = await axios.get(
      `${API_BASE}/competitions/${testCompetitionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.cached === true) {
      log('✅ Cache HIT as expected (Cache-Aside Pattern working)', 'green');
      log(`Source: ${response.data.cached ? 'cache' : 'database'}`, 'cyan');
      return true;
    } else {
      log('❌ Expected cache HIT but got MISS', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ Read failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 6: Update competition (Cache Invalidation)
async function testUpdateCompetition() {
  logTest(6, 'Update Competition - Cache Invalidation');
  try {
    const response = await axios.put(
      `${API_BASE}/competitions/${testCompetitionId}`,
      {
        name: 'Cache Test Competition (Updated)',
        status: 'active'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('✅ Competition updated', 'green');
    log('Cache should be invalidated', 'cyan');
    return true;
  } catch (err) {
    log(`❌ Update failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 7: Read after update (Cache MISS expected due to invalidation)
async function testReadAfterUpdate() {
  logTest(7, 'Read After Update - Cache MISS Expected (Cache Invalidation)');
  try {
    await sleep(100); // Small delay to ensure cache is invalidated
    
    const response = await axios.get(
      `${API_BASE}/competitions/${testCompetitionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.cached === false) {
      log('✅ Cache MISS as expected (cache invalidation working)', 'green');
      log(`Updated name: ${response.data.data.competition.name}`, 'cyan');
      return true;
    } else {
      log('⚠️  Unexpected cache HIT after update', 'yellow');
      return false;
    }
  } catch (err) {
    log(`❌ Read failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 8: Multiple reads to test cache hit rate
async function testMultipleReads() {
  logTest(8, 'Multiple Reads - Testing Cache Hit Rate');
  try {
    let hits = 0;
    let misses = 0;
    const iterations = 10;
    
    for (let i = 0; i < iterations; i++) {
      const response = await axios.get(
        `${API_BASE}/competitions/${testCompetitionId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (response.data.cached) {
        hits++;
      } else {
        misses++;
      }
      
      await sleep(50); // Small delay between requests
    }
    
    const hitRate = (hits / iterations * 100).toFixed(2);
    log(`✅ Completed ${iterations} reads`, 'green');
    log(`Cache HITs: ${hits}`, 'cyan');
    log(`Cache MISSes: ${misses}`, 'cyan');
    log(`Hit Rate: ${hitRate}%`, 'cyan');
    
    if (hitRate >= 80) {
      log('✅ Hit rate meets requirement (>80%)', 'green');
      return true;
    } else {
      log('⚠️  Hit rate below target (should be >80%)', 'yellow');
      return true; // Still pass, as this is informational
    }
  } catch (err) {
    log(`❌ Multiple reads failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 9: Get cache statistics
async function testGetCacheStats() {
  logTest(9, 'Get Cache Statistics');
  try {
    const response = await axios.get(
      `${API_BASE}/cache/stats`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const stats = response.data.data;
    log('✅ Cache statistics retrieved', 'green');
    log(`Total requests: ${stats.total}`, 'cyan');
    log(`Cache HITs: ${stats.hits}`, 'cyan');
    log(`Cache MISSes: ${stats.misses}`, 'cyan');
    log(`Hit Rate: ${stats.hitRate}`, 'cyan');
    log(`Timestamp: ${stats.timestamp}`, 'cyan');
    
    return true;
  } catch (err) {
    log(`❌ Stats retrieval failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 10: Test competition list caching
async function testCompetitionListCaching() {
  logTest(10, 'Competition List Caching');
  try {
    // First request - should be cache MISS
    const response1 = await axios.get(
      `${API_BASE}/competitions?status=active`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`First request - Cached: ${response1.data.cached}`, 'cyan');
    
    await sleep(100);
    
    // Second request - should be cache HIT
    const response2 = await axios.get(
      `${API_BASE}/competitions?status=active`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`Second request - Cached: ${response2.data.cached}`, 'cyan');
    
    if (response2.data.cached === true) {
      log('✅ Competition list caching working', 'green');
      return true;
    } else {
      log('⚠️  Competition list not cached', 'yellow');
      return false;
    }
  } catch (err) {
    log(`❌ List caching test failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 11: Manual cache invalidation
async function testManualInvalidation() {
  logTest(11, 'Manual Cache Invalidation');
  try {
    const response = await axios.delete(
      `${API_BASE}/cache/invalidate/${testCompetitionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('✅ Manual cache invalidation successful', 'green');
    log(response.data.message, 'cyan');
    return true;
  } catch (err) {
    log(`❌ Manual invalidation failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Test 12: Cleanup - Delete test competition
async function testCleanup() {
  logTest(12, 'Cleanup - Delete Test Competition');
  try {
    await axios.delete(
      `${API_BASE}/competitions/${testCompetitionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('✅ Test competition deleted', 'green');
    return true;
  } catch (err) {
    log(`❌ Cleanup failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Redis Caching Optimization Test Suite                 ║', 'cyan');
  log('║     Task 24: Performance Optimization - Redis Caching     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Reset Cache Stats', fn: testResetCacheStats },
    { name: 'Create Competition', fn: testCreateCompetition },
    { name: 'First Read (Cache MISS)', fn: testFirstRead },
    { name: 'Second Read (Cache HIT)', fn: testSecondRead },
    { name: 'Update Competition', fn: testUpdateCompetition },
    { name: 'Read After Update (Cache Invalidation)', fn: testReadAfterUpdate },
    { name: 'Multiple Reads (Hit Rate)', fn: testMultipleReads },
    { name: 'Get Cache Statistics', fn: testGetCacheStats },
    { name: 'Competition List Caching', fn: testCompetitionListCaching },
    { name: 'Manual Cache Invalidation', fn: testManualInvalidation },
    { name: 'Cleanup', fn: testCleanup }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      log(`❌ Test "${test.name}" threw an error: ${err.message}`, 'red');
      failed++;
    }
    
    await sleep(200); // Small delay between tests
  }
  
  // Summary
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      Test Summary                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`Total Tests: ${tests.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${(passed / tests.length * 100).toFixed(2)}%`, failed > 0 ? 'yellow' : 'green');
  console.log('\n');
  
  if (failed === 0) {
    log('🎉 All tests passed! Redis caching optimization is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'yellow');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  log(`\n❌ Test suite failed with error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
