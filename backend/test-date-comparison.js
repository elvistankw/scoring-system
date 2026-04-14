// Test script to verify date comparison logic
// Ensures status determination is based on DATE only, not TIME

console.log('🧪 Testing Date Comparison Logic\n');
console.log('=' .repeat(60));

// Helper function to test date comparison (same logic as controller)
function determineStatus(start_date, explicitStatus = null) {
  if (explicitStatus) {
    return { status: explicitStatus, reason: 'Explicitly provided' };
  }

  if (!start_date) {
    return { status: 'upcoming', reason: 'No start_date provided' };
  }

  // Get today's date at midnight (00:00:00) for pure date comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get start date at midnight (00:00:00) for pure date comparison
  const startDate = new Date(start_date);
  startDate.setHours(0, 0, 0, 0);
  
  // Compare dates only (not time)
  if (startDate.getTime() <= today.getTime()) {
    return { 
      status: 'active', 
      reason: `start_date (${start_date}) is today or in the past`,
      comparison: `${startDate.toISOString().split('T')[0]} <= ${today.toISOString().split('T')[0]}`
    };
  } else {
    return { 
      status: 'upcoming', 
      reason: `start_date (${start_date}) is in the future`,
      comparison: `${startDate.toISOString().split('T')[0]} > ${today.toISOString().split('T')[0]}`
    };
  }
}

// Test cases
const testCases = [
  {
    name: 'Today (2026-04-13)',
    start_date: '2026-04-13',
    explicitStatus: null,
    expected: 'active'
  },
  {
    name: 'Today with time (2026-04-13T10:30:00)',
    start_date: '2026-04-13T10:30:00',
    explicitStatus: null,
    expected: 'active'
  },
  {
    name: 'Today with different time (2026-04-13T23:59:59)',
    start_date: '2026-04-13T23:59:59',
    explicitStatus: null,
    expected: 'active'
  },
  {
    name: 'Yesterday (2026-04-12)',
    start_date: '2026-04-12',
    explicitStatus: null,
    expected: 'active'
  },
  {
    name: 'Tomorrow (2026-04-14)',
    start_date: '2026-04-14',
    explicitStatus: null,
    expected: 'upcoming'
  },
  {
    name: 'Next week (2026-04-20)',
    start_date: '2026-04-20',
    explicitStatus: null,
    expected: 'upcoming'
  },
  {
    name: 'Today but explicit upcoming',
    start_date: '2026-04-13',
    explicitStatus: 'upcoming',
    expected: 'upcoming'
  },
  {
    name: 'Tomorrow but explicit active',
    start_date: '2026-04-14',
    explicitStatus: 'active',
    expected: 'active'
  }
];

console.log('\n📅 Current System Date:');
const now = new Date();
console.log(`   Full: ${now.toISOString()}`);
console.log(`   Date only: ${now.toISOString().split('T')[0]}`);
console.log(`   Local: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}`);

console.log('\n' + '='.repeat(60));
console.log('🧪 Running Test Cases:\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = determineStatus(test.start_date, test.explicitStatus);
  const success = result.status === test.expected;
  
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`   Input: start_date="${test.start_date}", status=${test.explicitStatus || 'null'}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Result: ${result.status}`);
  console.log(`   Reason: ${result.reason}`);
  if (result.comparison) {
    console.log(`   Comparison: ${result.comparison}`);
  }
  console.log(`   ${success ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log('='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('✅ All tests passed! Date comparison logic is working correctly.');
} else {
  console.log('❌ Some tests failed. Please review the logic.');
  process.exit(1);
}

console.log('\n💡 Key Points:');
console.log('   1. Date comparison ignores time (uses midnight 00:00:00)');
console.log('   2. start_date <= today → status = "active"');
console.log('   3. start_date > today → status = "upcoming"');
console.log('   4. Explicit status parameter always takes precedence');
console.log('   5. Works with both date strings and datetime strings');
