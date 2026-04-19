// Test script for batch score submission API
// Run this after starting the backend server

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testBatchSubmission() {
  console.log('🧪 Testing Batch Score Submission API...\n');

  try {
    // First, try to login as a judge (you'll need to replace with actual credentials)
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'judge@example.com', // Replace with actual judge email
        password: 'password123'      // Replace with actual password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please ensure you have a judge account set up.');
      console.log('   Create a judge account first or update the credentials in this test.');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test batch submission endpoint
    console.log('\n2. Testing batch submission endpoint...');
    
    const testSubmissions = [
      {
        competition_id: 1, // Replace with actual competition ID
        athlete_id: 1,     // Replace with actual athlete ID
        scores: {
          action_difficulty: 25.5,
          stage_artistry: 22.0,
          action_creativity: 18.5,
          action_fluency: 12.0,
          costume_styling: 8.5
        }
      },
      {
        competition_id: 1, // Replace with actual competition ID
        athlete_id: 2,     // Replace with actual athlete ID
        scores: {
          action_difficulty: 28.0,
          stage_artistry: 24.5,
          action_creativity: 19.0,
          action_fluency: 13.5,
          costume_styling: 9.0
        }
      }
    ];

    const batchResponse = await fetch(`${API_BASE}/api/scores/batch-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ submissions: testSubmissions })
    });

    const batchData = await batchResponse.json();
    
    if (batchResponse.ok) {
      console.log('✅ Batch submission successful!');
      console.log('📊 Response:', JSON.stringify(batchData, null, 2));
    } else {
      console.log('❌ Batch submission failed:');
      console.log('📊 Error:', JSON.stringify(batchData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
    console.log('   Run: npm start (in backend directory)');
  }
}

// Instructions
console.log('📋 Batch Submission API Test');
console.log('============================');
console.log('');
console.log('Before running this test:');
console.log('1. Start the backend server: npm start');
console.log('2. Ensure you have a judge account created');
console.log('3. Update the credentials and IDs in this script');
console.log('4. Make sure you have at least one active competition with athletes');
console.log('');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');

setTimeout(testBatchSubmission, 3000);