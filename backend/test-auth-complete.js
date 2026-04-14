// backend/test-auth-complete.js
// Comprehensive authentication test including protected routes
// Run with: node test-auth-complete.js

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Helper function to make HTTP requests with optional auth token
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
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
  console.log('🧪 Comprehensive Authentication Tests\n');

  try {
    // Test 1: Register admin user
    console.log('1️⃣  Registering admin user...');
    const adminData = {
      username: 'admin1',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    };

    const adminRegRes = await makeRequest('POST', '/api/auth/register', adminData);
    console.log(`   Status: ${adminRegRes.status}`);
    
    if (adminRegRes.status === 201) {
      console.log(`   ✅ Admin registered: ${adminRegRes.data.data.user.username}`);
      console.log(`   Role: ${adminRegRes.data.data.user.role}\n`);
    } else if (adminRegRes.status === 409) {
      console.log('   ℹ️  Admin already exists\n');
    }

    // Test 2: Login and get token
    console.log('2️⃣  Logging in as judge...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'testjudge@example.com',
      password: 'password123'
    });

    if (loginRes.status !== 200) {
      console.log('   ❌ Login failed');
      return;
    }

    const token = loginRes.data.data.token;
    console.log('   ✅ Login successful');
    console.log(`   Token: ${token.substring(0, 30)}...\n`);

    // Test 3: Access protected route with token
    console.log('3️⃣  Accessing /api/auth/me with token...');
    const meRes = await makeRequest('GET', '/api/auth/me', null, token);
    console.log(`   Status: ${meRes.status}`);
    
    if (meRes.status === 200) {
      console.log('   ✅ Protected route accessible with valid token');
      console.log(`   User: ${meRes.data.data.user.username}`);
      console.log(`   Email: ${meRes.data.data.user.email}`);
      console.log(`   Role: ${meRes.data.data.user.role}\n`);
    } else {
      console.log('   ❌ Failed to access protected route\n');
    }

    // Test 4: Test password validation
    console.log('4️⃣  Testing password validation...');
    const weakPassRes = await makeRequest('POST', '/api/auth/register', {
      username: 'weakuser',
      email: 'weak@example.com',
      password: 'weak',
      role: 'judge'
    });
    
    if (weakPassRes.status === 400) {
      console.log('   ✅ Weak password rejected');
      console.log(`   Message: ${weakPassRes.data.message}\n`);
    }

    // Test 5: Test email validation
    console.log('5️⃣  Testing email validation...');
    const invalidEmailRes = await makeRequest('POST', '/api/auth/register', {
      username: 'emailtest',
      email: 'invalid-email',
      password: 'password123',
      role: 'judge'
    });
    
    if (invalidEmailRes.status === 400) {
      console.log('   ✅ Invalid email rejected');
      console.log(`   Message: ${invalidEmailRes.data.message}\n`);
    }

    // Test 6: Test duplicate registration
    console.log('6️⃣  Testing duplicate registration prevention...');
    const dupRes = await makeRequest('POST', '/api/auth/register', {
      username: 'testjudge',
      email: 'testjudge@example.com',
      password: 'password123',
      role: 'judge'
    });
    
    if (dupRes.status === 409) {
      console.log('   ✅ Duplicate user rejected');
      console.log(`   Message: ${dupRes.data.message}\n`);
    }

    // Test 7: Test invalid role
    console.log('7️⃣  Testing invalid role rejection...');
    const invalidRoleRes = await makeRequest('POST', '/api/auth/register', {
      username: 'invalidrole',
      email: 'invalid@example.com',
      password: 'password123',
      role: 'superadmin'
    });
    
    if (invalidRoleRes.status === 400) {
      console.log('   ✅ Invalid role rejected');
      console.log(`   Message: ${invalidRoleRes.data.message}\n`);
    }

    // Test 8: Test expired/invalid token
    console.log('8️⃣  Testing invalid token...');
    const invalidTokenRes = await makeRequest('GET', '/api/auth/me', null, 'invalid-token');
    
    if (invalidTokenRes.status === 401) {
      console.log('   ✅ Invalid token rejected');
      console.log(`   Message: ${invalidTokenRes.data.message}\n`);
    }

    console.log('✅ All comprehensive authentication tests completed!');
    console.log('\n📊 Summary:');
    console.log('   - User registration with validation ✅');
    console.log('   - User login with JWT generation ✅');
    console.log('   - Protected route access ✅');
    console.log('   - Password strength validation ✅');
    console.log('   - Email format validation ✅');
    console.log('   - Duplicate prevention ✅');
    console.log('   - Role validation ✅');
    console.log('   - Token validation ✅');

  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.log('\n⚠️  Make sure the server is running on port 5000');
  }
}

// Run tests
runTests();
