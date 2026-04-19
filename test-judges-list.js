// Test script to verify judges list API response format

const API_BASE_URL = 'http://localhost:5000';

async function testJudgesList() {
  console.log('🧪 Testing Judges List API Response Format\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testadmin@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', loginData.message);
      return;
    }

    const adminToken = loginData.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Get judges list
    console.log('2. Getting judges list...');
    const judgesResponse = await fetch(`${API_BASE_URL}/api/judges`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const judgesData = await judgesResponse.json();
    console.log('Judges list response status:', judgesResponse.status);
    console.log('Judges list response structure:');
    console.log('- success:', judgesData.success);
    console.log('- count:', judgesData.count);
    console.log('- data type:', typeof judgesData.data);
    console.log('- data.judges type:', Array.isArray(judgesData.data?.judges) ? 'array' : typeof judgesData.data?.judges);
    console.log('- data.total:', judgesData.data?.total);
    console.log('- judges array length:', judgesData.data?.judges?.length);

    if (judgesResponse.ok) {
      console.log('✅ Judges list retrieved successfully');
      
      if (judgesData.data?.total === judgesData.data?.judges?.length) {
        console.log('✅ Total count matches judges array length');
      } else {
        console.log('❌ Total count does not match judges array length');
      }
    } else {
      console.log('❌ Failed to get judges list:', judgesData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testJudgesList();