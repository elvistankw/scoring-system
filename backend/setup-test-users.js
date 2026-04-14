/**
 * Setup Test Users for Integration Testing
 * Creates admin and judge accounts needed for testing
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function setupTestUsers() {
  console.log('🔧 Setting up test users for integration testing...\n');

  try {
    // Create Admin User
    console.log('1. Creating admin user...');
    try {
      const adminResponse = await axios.post(`${API_BASE}/api/auth/register`, {
        username: 'admin_test',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('   ✅ Admin user created:', adminResponse.data.user?.username || 'admin@test.com');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ℹ️  Admin user already exists');
      } else {
        console.log('   ❌ Error creating admin:', error.response?.data?.message || error.message);
      }
    }

    // Create Judge User 1
    console.log('\n2. Creating judge user 1...');
    try {
      const judgeResponse = await axios.post(`${API_BASE}/api/auth/register`, {
        username: 'judge_test',
        email: 'judge@test.com',
        password: 'judge123',
        role: 'judge'
      });
      console.log('   ✅ Judge user 1 created:', judgeResponse.data.user?.username || 'judge@test.com');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ℹ️  Judge user 1 already exists');
      } else {
        console.log('   ❌ Error creating judge 1:', error.response?.data?.message || error.message);
      }
    }

    // Create Judge User 2
    console.log('\n3. Creating judge user 2...');
    try {
      const judge2Response = await axios.post(`${API_BASE}/api/auth/register`, {
        username: 'judge_test2',
        email: 'judge2@test.com',
        password: 'judge123',
        role: 'judge'
      });
      console.log('   ✅ Judge user 2 created:', judge2Response.data.user?.username || 'judge2@test.com');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ℹ️  Judge user 2 already exists');
      } else {
        console.log('   ❌ Error creating judge 2:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n✅ Test user setup complete!');
    console.log('\nTest Credentials:');
    console.log('  Admin: admin@test.com / admin123');
    console.log('  Judge 1: judge@test.com / judge123');
    console.log('  Judge 2: judge2@test.com / judge123');
    console.log('\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n⚠️  Make sure the backend server is running on port 5000');
    process.exit(1);
  }
}

setupTestUsers();
