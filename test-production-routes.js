// Test production route behavior
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { message: data }
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testProductionRoutes() {
  console.log('🧪 Testing Google OAuth routes behavior...\n');

  const tests = [
    {
      name: 'Google Auth Status',
      url: `${API_BASE}/auth/google/status`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' },
      expectedStatus: [503, 401] // 503 if disabled, 401 if enabled but invalid token
    },
    {
      name: 'Google Auth URL',
      url: `${API_BASE}/auth/google/auth-url`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' },
      expectedStatus: [503, 401]
    },
    {
      name: 'Google Auth Callback (No Params)',
      url: `${API_BASE}/auth/google/callback`,
      method: 'GET',
      expectedStatus: [503, 302] // 503 if disabled, 302 redirect if enabled
    },
    {
      name: 'Google Sheets Export',
      url: `${API_BASE}/google/sheets/export/1`,
      method: 'POST',
      headers: { 'Authorization': 'Bearer fake-token' },
      expectedStatus: [503, 401, 404] // 503 if disabled, 401/404 if enabled
    },
    {
      name: 'Google Drive Upload',
      url: `${API_BASE}/google/drive/upload`,
      method: 'POST',
      headers: { 'Authorization': 'Bearer fake-token' },
      expectedStatus: [503, 401, 400] // 503 if disabled, 401/400 if enabled
    },
    {
      name: 'Google Drive Files List',
      url: `${API_BASE}/google/drive/files`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' },
      expectedStatus: [503, 401]
    }
  ];

  let results = [];
  let googleAuthEnabled = null;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await makeRequest(test.url, test.method, test.headers || {});

      const result = {
        name: test.name,
        status: response.status,
        message: response.data?.message || 'No message',
        success: test.expectedStatus.includes(response.status)
      };

      results.push(result);

      // Determine if Google Auth is enabled based on first response
      if (googleAuthEnabled === null && test.name === 'Google Auth Status') {
        googleAuthEnabled = response.status !== 503;
      }

      if (result.success) {
        console.log(`✅ ${test.name}: Status ${response.status}`);
        console.log(`   Message: ${result.message}`);
      } else {
        console.log(`❌ ${test.name}: Status ${response.status} (Expected: ${test.expectedStatus.join('/')})`);
        console.log(`   Message: ${result.message}`);
      }
      
      console.log('');
    } catch (error) {
      const result = {
        name: test.name,
        status: 'ERROR',
        message: error.message,
        success: false
      };
      
      results.push(result);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️ ${test.name}: Backend server not running`);
      } else {
        console.log(`❌ ${test.name}: Error - ${error.message}`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(60));
  
  console.log(`🔧 Google OAuth Status: ${googleAuthEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log('');
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
  });

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('');
  console.log(`📈 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! Routes are working correctly.');
    console.log('');
    if (!googleAuthEnabled) {
      console.log('ℹ️ Google OAuth is properly disabled - all routes return 503 as expected.');
    } else {
      console.log('ℹ️ Google OAuth is enabled - routes return appropriate auth/validation errors.');
    }
  } else {
    console.log('⚠️ Some tests failed. Check individual results above.');
  }
  
  console.log('='.repeat(60));
}

// Run the test
testProductionRoutes().catch(console.error);