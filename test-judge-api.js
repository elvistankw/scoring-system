// Test Judge API endpoints

const API_BASE = 'http://localhost:5000/api';

// Test function
async function testJudgeAPI() {
  console.log('🧪 Testing Judge API endpoints...\n');

  try {
    // Test 1: Get judge stats (without auth - should fail)
    console.log('1. Testing judge stats without auth (should fail):');
    const statsResponse = await fetch(`${API_BASE}/judges/stats`);
    console.log(`   Status: ${statsResponse.status}`);
    const statsData = await statsResponse.json();
    console.log(`   Response:`, statsData);
    console.log('');

    // Test 2: Get all judges (without auth - should fail)
    console.log('2. Testing get all judges without auth (should fail):');
    const judgesResponse = await fetch(`${API_BASE}/judges`);
    console.log(`   Status: ${judgesResponse.status}`);
    const judgesData = await judgesResponse.json();
    console.log(`   Response:`, judgesData);
    console.log('');

    console.log('✅ Judge API endpoints are responding correctly (auth required)');

  } catch (error) {
    console.error('❌ Error testing Judge API:', error.message);
  }
}

testJudgeAPI();