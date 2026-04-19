// Test Google OAuth behavior in production-like environment
const axios = require('axios');

// Temporarily set NODE_ENV to production to test the disabled state
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

// Remove Google OAuth environment variables to simulate production
delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
delete process.env.GOOGLE_REDIRECT_URI;

console.log('🧪 Testing Google OAuth in production-like environment...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID || 'undefined'}`);
console.log('');

// Test the backend logic
const API_BASE = 'http://localhost:5000/api';

async function testGoogleOAuthProduction() {
  const tests = [
    {
      name: 'Google Auth Status',
      url: `${API_BASE}/auth/google/status`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' }
    },
    {
      name: 'Google Auth URL',
      url: `${API_BASE}/auth/google/auth-url`,
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
        validateStatus: () => true, // Don't throw on error status codes
        timeout: 5000
      });

      if (response.status === 503) {
        console.log(`✅ ${test.name}: Correctly returns 503 (Service Unavailable)`);
        console.log(`   Message: ${response.data.message}`);
      } else {
        console.log(`❌ ${test.name}: Expected 503, got ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        allPassed = false;
      }
      
      console.log('');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️ ${test.name}: Backend server not running`);
        console.log('   Please start the backend server first: npm start');
        allPassed = false;
      } else {
        console.log(`❌ ${test.name}: Unexpected error - ${error.message}`);
        allPassed = false;
      }
      console.log('');
    }
  }

  // Restore original environment
  process.env.NODE_ENV = originalNodeEnv;

  console.log('='.repeat(50));
  if (allPassed) {
    console.log('✅ All tests passed! Google OAuth is properly disabled in production.');
    console.log('🚀 Ready for production deployment!');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
  console.log('='.repeat(50));
}

// Run the test
testGoogleOAuthProduction().catch(console.error);