// backend/test-auth.js
// Simple test script for authentication endpoints
// Run with: node test-auth.js

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (err) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('🧪 Testing Authentication Endpoints\n');

  try {
    // Test 1: Register new user
    console.log('1️⃣  Testing user registration...');
    const registerData = {
      username: 'testjudge',
      email: 'testjudge@example.com',
      password: 'password123',
      role: 'judge'
    };

    const registerRes = await makeRequest('POST', '/api/auth/register', registerData);
    console.log(`   Status: ${registerRes.status}`);
    console.log(`   Response:`, registerRes.data);

    if (registerRes.status === 201 || registerRes.status === 409) {
      console.log('   ✅ Registration endpoint working\n');
    } else {
      console.log('   ❌ Registration failed\n');
      return;
    }

    // Test 2: Login
    console.log('2️⃣  Testing user login...');
    const loginData = {
      email: 'testjudge@example.com',
      password: 'password123'
    };

    const loginRes = await makeRequest('POST', '/api/auth/login', loginData);
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Response:`, loginRes.data);

    if (loginRes.status === 200 && loginRes.data?.data?.token) {
      console.log('   ✅ Login successful\n');
      
      const token = loginRes.data.data.token;

      // Test 3: Get current user
      console.log('3️⃣  Testing /api/auth/me endpoint...');
      const meRes = await makeRequest('GET', '/api/auth/me');
      console.log(`   Status (without token): ${meRes.status}`);
      
      if (meRes.status === 401) {
        console.log('   ✅ Protected route requires authentication\n');
      }

      console.log('   Note: Testing with token requires modifying the request headers');
      console.log('   Token received:', token.substring(0, 20) + '...\n');
    } else {
      console.log('   ❌ Login failed\n');
    }

    // Test 4: Invalid login
    console.log('4️⃣  Testing invalid login...');
    const invalidLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'testjudge@example.com',
      password: 'wrongpassword'
    });
    console.log(`   Status: ${invalidLoginRes.status}`);
    
    if (invalidLoginRes.status === 401) {
      console.log('   ✅ Invalid credentials rejected\n');
    } else {
      console.log('   ❌ Should reject invalid credentials\n');
    }

    console.log('✅ All authentication tests completed!');

  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.log('\n⚠️  Make sure the server is running on port 5000');
    console.log('   Run: npm run dev');
  }
}

// Run tests
runTests();
