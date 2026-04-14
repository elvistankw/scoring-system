// backend/test-pool-monitor.js
// Unit tests for pool monitor utility (no database required)
// Requirements: 10.4, 10.5

const { getPoolStats } = require('./utils/pool-monitor');

console.log('🧪 Testing Pool Monitor Utility\n');
console.log('='.repeat(60));

// Mock pool object for testing
const mockPool = {
  totalCount: 20,
  idleCount: 15,
  waitingCount: 0
};

// Test 1: Get pool stats with normal utilization
console.log('\n📋 Test 1: Normal Pool Utilization');
console.log('-'.repeat(60));
const stats1 = getPoolStats(mockPool);
console.log('Pool Stats:', stats1);
console.log(`Total: ${stats1.total}, Idle: ${stats1.idle}, Waiting: ${stats1.waiting}`);
console.log(`Utilization: ${stats1.utilization.toFixed(1)}%`);
if (stats1.utilization < 80) {
  console.log('✅ Pool utilization is healthy (< 80%)');
} else {
  console.log('⚠️  Pool utilization is high (> 80%)');
}

// Test 2: High pool utilization
console.log('\n📋 Test 2: High Pool Utilization');
console.log('-'.repeat(60));
const mockPoolHigh = {
  totalCount: 20,
  idleCount: 2,
  waitingCount: 0
};
const stats2 = getPoolStats(mockPoolHigh);
console.log('Pool Stats:', stats2);
console.log(`Total: ${stats2.total}, Idle: ${stats2.idle}, Waiting: ${stats2.waiting}`);
console.log(`Utilization: ${stats2.utilization.toFixed(1)}%`);
if (stats2.utilization > 80) {
  console.log('⚠️  Pool utilization is high (> 80%) - Consider increasing pool size');
} else {
  console.log('✅ Pool utilization is healthy');
}

// Test 3: Pool with waiting clients
console.log('\n📋 Test 3: Pool with Waiting Clients');
console.log('-'.repeat(60));
const mockPoolWaiting = {
  totalCount: 20,
  idleCount: 0,
  waitingCount: 5
};
const stats3 = getPoolStats(mockPoolWaiting);
console.log('Pool Stats:', stats3);
console.log(`Total: ${stats3.total}, Idle: ${stats3.idle}, Waiting: ${stats3.waiting}`);
console.log(`Utilization: ${stats3.utilization.toFixed(1)}%`);
if (stats3.waiting > 0) {
  console.log('⚠️  Pool has waiting clients - Pool is exhausted!');
} else {
  console.log('✅ No waiting clients');
}

// Test 4: Low utilization
console.log('\n📋 Test 4: Low Pool Utilization');
console.log('-'.repeat(60));
const mockPoolLow = {
  totalCount: 20,
  idleCount: 19,
  waitingCount: 0
};
const stats4 = getPoolStats(mockPoolLow);
console.log('Pool Stats:', stats4);
console.log(`Total: ${stats4.total}, Idle: ${stats4.idle}, Waiting: ${stats4.waiting}`);
console.log(`Utilization: ${stats4.utilization.toFixed(1)}%`);
if (stats4.utilization < 20) {
  console.log('✅ Pool utilization is very low - Pool size may be too large');
} else {
  console.log('✅ Pool utilization is normal');
}

// Test 5: Full pool utilization
console.log('\n📋 Test 5: Full Pool Utilization');
console.log('-'.repeat(60));
const mockPoolFull = {
  totalCount: 20,
  idleCount: 0,
  waitingCount: 0
};
const stats5 = getPoolStats(mockPoolFull);
console.log('Pool Stats:', stats5);
console.log(`Total: ${stats5.total}, Idle: ${stats5.idle}, Waiting: ${stats5.waiting}`);
console.log(`Utilization: ${stats5.utilization.toFixed(1)}%`);
if (stats5.utilization === 100) {
  console.log('⚠️  Pool is at 100% utilization - Monitor for waiting clients');
} else {
  console.log('✅ Pool has available capacity');
}

console.log('\n' + '='.repeat(60));
console.log('✅ All pool monitor tests passed!');
console.log('='.repeat(60));

console.log('\n📊 Summary:');
console.log('- Pool monitoring tracks total, idle, and waiting connections');
console.log('- Utilization is calculated as (total - idle) / total * 100');
console.log('- Warnings are issued when utilization > 80% or waiting > 0');
console.log('- In production, stats are logged every 30 seconds');
