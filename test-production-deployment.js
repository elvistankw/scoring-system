// Test script for production deployment
const axios = require('axios');

const FRONTEND_URL = 'https://scoring-system-nine.vercel.app';
const BACKEND_URL = 'https://scoring-system-production-2c13.up.railway.app';

async function testProductionDeployment() {
  console.log('🧪 Testing Production Deployment...\n');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}\n`);

  const tests = [
    {
      name: 'Backend Health Check',
      url: `${BACKEND_URL}/api/health`,
      method: 'GET',
      expectedStatus: [200, 404] // 404 is ok if no health endpoint
    },
    {
      name: 'CORS Preflight',
      url: `${BACKEND_URL}/api/auth/login`,
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      expectedStatus: [200, 204]
    },
    {
      name: 'Google OAuth Status (Should be 503)',
      url: `${BACKEND_URL}/api/auth/google/status`,
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Authorization': 'Bearer fake-token'
      },
      expectedStatus: [503]
    },
    {
      name: 'Google Auth URL (Should be 503)',
      url: `${BACKEND_URL}/api/auth/google/auth-url`,
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Authorization': 'Bearer fake-token'
      },
      expectedStatus: [503]
    },
    {
      name: 'Auth Login Endpoint',
      url: `${BACKEND_URL}/api/auth/login`,
      method: 'POST',
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      },
      data: { email: 'test@test.com', password: 'test' },
      expectedStatus: [400, 401, 422] // Should not be CORS error
    }
  ];

  let allPassed = true;
  let corsIssues = [];
  let googleOAuthIssues = [];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        headers: test.headers || {},
        validateStatus: () => true, // Don't throw on error status codes
        timeout: 10000
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);

      if (test.expectedStatus.includes(response.status)) {
        console.log(`✅ ${test.name}: Status ${response.status} (Expected)`);
        
        // Check for CORS headers
        if (test.headers && test.headers.Origin) {
          const corsHeader = response.headers['access-control-allow-origin'];
          if (corsHeader) {
            console.log(`   CORS: ${corsHeader}`);
          } else {
            console.log(`   ⚠️ No CORS header found`);
          }
        }
      } else {
        console.log(`❌ ${test.name}: Status ${response.status} (Expected: ${test.expectedStatus.join(' or ')})`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        allPassed = false;

        if (test.name.includes('Google OAuth')) {
          googleOAuthIssues.push(`${test.name}: Got ${response.status}, expected 503`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      
      if (error.message.includes('CORS') || error.message.includes('blocked')) {
        corsIssues.push(`${test.name}: ${error.message}`);
      }
      
      allPassed = false;
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('✅ All tests passed! Deployment looks good.');
  } else {
    console.log('❌ Some tests failed. Issues found:');
    
    if (corsIssues.length > 0) {
      console.log('\n🚫 CORS Issues:');
      corsIssues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Fix: Update CORS_ORIGIN in Railway backend environment variables');
    }
    
    if (googleOAuthIssues.length > 0) {
      console.log('\n🔐 Google OAuth Issues:');
      googleOAuthIssues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Fix: Check Google OAuth route middleware logic');
    }
  }
  console.log('='.repeat(60));
}

// Run the test
testProductionDeployment().catch(console.error);