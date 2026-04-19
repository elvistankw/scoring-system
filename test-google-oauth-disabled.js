// Test script to verify Google OAuth is properly disabled in production
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testGoogleOAuthDisabled() {
  console.log('🧪 Testing Google OAuth disabled state...\n');

  const tests = [
    {
      name: 'Google Auth URL',
      url: `${API_BASE}/auth/google/auth-url`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' }
    },
    {
      name: 'Google Auth Status',
      url: `${API_BASE}/auth/google/status`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' }
    },
    {
      name: 'Google Auth Callback',
      url: `${API_BASE}/auth/google/callback`,
      method: 'GET'
    },
    {
      name: 'Google Sheets Export',
      url: `${API_BASE}/google/sheets/export/1`,
      method: 'POST'
    },
    {
      name: 'Google Drive Upload',
      url: `${API_BASE}/google/drive/upload`,
      method: 'POST'
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        headers: test.headers || {},
        validateStatus: () => true // Don't throw on error status codes
      });

      if (response.status === 503) {
        console.log(`✅ ${test.name}: Correctly returns 503 (Service Unavailable)`);
        console.log(`   Message: ${response.data.message}\n`);
      } else {
        console.log(`❌ ${test.name}: Expected 503, got ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
        allPassed = false;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️ ${test.name}: Backend server not running\n`);
        allPassed = false;
      } else {
        console.log(`❌ ${test.name}: Unexpected error - ${error.message}\n`);
        allPassed = false;
      }
    }
  }

  console.log('='.repeat(50));
  if (allPassed) {
    console.log('✅ All tests passed! Google OAuth is properly disabled.');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
  console.log('='.repeat(50));
}

// Run the test
testGoogleOAuthDisabled().catch(console.error);