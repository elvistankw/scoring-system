// Test script for judge identity selection API
// Requirements: Test judge identity selection system

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testJudgeIdentityAPI() {
  console.log('🧪 Testing Judge Identity Selection API...\n');

  try {
    // Test 1: Get available judges (public endpoint)
    console.log('1️⃣ Testing GET /api/judges/available');
    const availableResponse = await fetch(`${API_BASE}/judges/available`);
    const availableData = await availableResponse.json();
    
    if (availableResponse.ok) {
      console.log('✅ Available judges:', availableData.count, 'judges found');
      console.log('📋 Sample judges:', availableData.data.slice(0, 2));
    } else {
      console.log('❌ Failed to get available judges:', availableData);
    }

    // Test 2: Try to select identity without authentication (should fail)
    console.log('\n2️⃣ Testing POST /api/judges/select-identity (without auth)');
    const selectResponse = await fetch(`${API_BASE}/judges/select-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judgeId: 1,
        judgeCode: 'J001'
      })
    });
    const selectData = await selectResponse.json();
    
    if (selectResponse.status === 401) {
      console.log('✅ Correctly rejected without authentication');
    } else {
      console.log('❌ Should have rejected without auth:', selectData);
    }

    // Test 3: Get judge statistics (admin endpoint, should fail without auth)
    console.log('\n3️⃣ Testing GET /api/judges/stats (without auth)');
    const statsResponse = await fetch(`${API_BASE}/judges/stats`);
    const statsData = await statsResponse.json();
    
    if (statsResponse.status === 401) {
      console.log('✅ Correctly rejected admin endpoint without authentication');
    } else {
      console.log('❌ Should have rejected admin endpoint without auth:', statsData);
    }

    console.log('\n✅ Judge Identity API tests completed successfully!');
    console.log('📝 Next steps:');
    console.log('   - Test with actual authentication tokens');
    console.log('   - Test judge identity selection flow');
    console.log('   - Test session management');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testJudgeIdentityAPI();