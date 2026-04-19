// Test script to verify judge count updates after creation

const API_BASE_URL = 'http://localhost:5000';

async function testJudgeCountUpdate() {
  console.log('🧪 Testing Judge Count Update After Creation\n');

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

    // Step 2: Get initial judges count
    console.log('2. Getting initial judges count...');
    const initialResponse = await fetch(`${API_BASE_URL}/api/judges`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const initialData = await initialResponse.json();
    const initialCount = initialData.data?.total || 0;
    console.log(`Initial judge count: ${initialCount}`);

    // Step 3: Create a new judge
    console.log('\n3. Creating a new judge...');
    const uniqueCode = `T${Date.now().toString().slice(-4)}`;
    const createResponse = await fetch(`${API_BASE_URL}/api/judges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Judge Count',
        display_name: 'Test Judge Count Display',
        code: uniqueCode
      })
    });

    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('❌ Judge creation failed:', createData.message);
      return;
    }

    const createdJudgeId = createData.data.id;
    console.log(`✅ Judge created with ID: ${createdJudgeId}`);

    // Step 4: Get updated judges count
    console.log('\n4. Getting updated judges count...');
    const updatedResponse = await fetch(`${API_BASE_URL}/api/judges`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const updatedData = await updatedResponse.json();
    const updatedCount = updatedData.data?.total || 0;
    console.log(`Updated judge count: ${updatedCount}`);

    // Step 5: Verify count increased
    if (updatedCount === initialCount + 1) {
      console.log('✅ Judge count correctly increased by 1');
    } else {
      console.log(`❌ Judge count should be ${initialCount + 1}, but got ${updatedCount}`);
    }

    // Step 6: Clean up - delete the test judge
    console.log('\n5. Cleaning up test judge...');
    const deleteResponse = await fetch(`${API_BASE_URL}/api/judges/${createdJudgeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Test judge cleaned up');
      
      // Verify count returned to original
      const finalResponse = await fetch(`${API_BASE_URL}/api/judges`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const finalData = await finalResponse.json();
      const finalCount = finalData.data?.total || 0;
      console.log(`Final judge count: ${finalCount}`);

      if (finalCount === initialCount) {
        console.log('✅ Judge count correctly returned to original value');
      } else {
        console.log(`❌ Judge count should be ${initialCount}, but got ${finalCount}`);
      }
    } else {
      console.log('❌ Failed to clean up test judge');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testJudgeCountUpdate();