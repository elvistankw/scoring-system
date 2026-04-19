// Test frontend-backend connection
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

async function testConnection() {
  console.log('🔗 Testing Frontend-Backend Connection...\n');

  const tests = [
    {
      name: 'Backend Health Check',
      url: `${API_BASE}/health`,
      method: 'GET',
      expectedStatus: [200, 404] // 404 is OK if no health endpoint
    },
    {
      name: 'Auth Login Endpoint',
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      data: { email: 'test@test.com', password: 'test' },
      expectedStatus: [400, 401, 422] // Should not be connection error
    },
    {
      name: 'Google Auth Status (No Token)',
      url: `${API_BASE}/auth/google/status`,
      method: 'GET',
      expectedStatus: [401, 503] // 401 if enabled, 503 if disabled
    },
    {
      name: 'Google Auth Status (Fake Token)',
      url: `${API_BASE}/auth/google/status`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake-token' },
      expectedStatus: [401, 503] // 401 if enabled, 503 if disabled
    },
    {
      name: 'Competitions List',
      url: `${API_BASE}/competitions`,
      method: 'GET',
      expectedStatus: [200, 401] // Should work or require auth
    }
  ];

  let results = [];
  let connectionWorking = true;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        headers: test.headers || {}
      };

      if (test.data) {
        config.data = JSON.stringify(test.data);
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await makeRequest(test.url, test.method, config.headers);

      const result = {
        name: test.name,
        status: response.status,
        message: response.data?.message || 'No message',
        success: test.expectedStatus.includes(response.status)
      };

      results.push(result);

      if (result.success) {
        console.log(`✅ ${test.name}: Status ${response.status}`);
        console.log(`   Response: ${result.message}`);
      } else {
        console.log(`❌ ${test.name}: Status ${response.status} (Expected: ${test.expectedStatus.join('/')})`);
        console.log(`   Response: ${result.message}`);
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
      connectionWorking = false;
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${test.name}: Backend server not running (ECONNREFUSED)`);
      } else if (error.message.includes('timeout')) {
        console.log(`❌ ${test.name}: Request timeout`);
      } else {
        console.log(`❌ ${test.name}: Connection error - ${error.message}`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Connection Test Results:');
  console.log('='.repeat(60));
  
  console.log(`🔗 Backend Connection: ${connectionWorking ? 'WORKING' : 'FAILED'}`);
  console.log('');
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
  });

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('');
  console.log(`📈 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (connectionWorking && successCount === totalCount) {
    console.log('🎉 All tests passed! Frontend can connect to backend.');
    console.log('');
    console.log('💡 The "Failed to fetch" error should now be resolved.');
    console.log('   Make sure both frontend and backend are running:');
    console.log('   - Backend: npm start (in backend folder)');
    console.log('   - Frontend: npm run dev (in root folder)');
  } else if (!connectionWorking) {
    console.log('❌ Backend connection failed!');
    console.log('');
    console.log('🔧 To fix the "Failed to fetch" error:');
    console.log('   1. Start the backend server: cd backend && npm start');
    console.log('   2. Verify it\'s running on http://localhost:5000');
    console.log('   3. Check firewall/antivirus settings');
  } else {
    console.log('⚠️ Some endpoints failed. Check individual results above.');
  }
  
  console.log('='.repeat(60));
}

// Run the test
testConnection().catch(console.error);