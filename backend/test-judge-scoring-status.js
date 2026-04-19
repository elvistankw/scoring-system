// Test script for judge-scoring-status endpoint
// This script tests the new endpoint to verify it returns correct data

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

async function testJudgeScoringStatus() {
  console.log('🧪 Testing Judge Scoring Status Endpoint\n');
  
  try {
    // First, get a judge session (you'll need to replace with actual judge_id and device_id)
    console.log('📝 Note: This test requires an active judge session');
    console.log('   You can get session info from the judge-landing page\n');
    
    // Test the endpoint with a mock session
    // In real usage, this would come from the judge's session
    const judge_id = 1; // Replace with actual judge ID
    const device_id = 'test-device-123'; // Replace with actual device ID
    
    console.log(`🔍 Testing with judge_id: ${judge_id}, device_id: ${device_id}\n`);
    
    // Make request to judge-scoring-status endpoint
    const response = await axios.get(
      `${API_BASE_URL}/api/competitions/judge-scoring-status`,
      {
        headers: {
          'X-Judge-ID': judge_id.toString(),
          'X-Device-ID': device_id
        }
      }
    );
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Analyze the results
    if (response.data.status === 'success') {
      const competitions = response.data.data.competitions;
      const competitionIds = Object.keys(competitions);
      
      console.log(`\n📈 Summary:`);
      console.log(`   Total competitions: ${competitionIds.length}`);
      
      competitionIds.forEach(id => {
        const comp = competitions[id];
        const status = comp.completed ? '✅ Completed' : '⏳ In Progress';
        console.log(`   Competition ${id}: ${status} (${comp.scored_count}/${comp.total_athletes})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⚠️  Rate limit exceeded. Please wait a few minutes and try again.');
    } else if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed. Make sure you have a valid judge session.');
    }
  }
}

// Run the test
testJudgeScoringStatus();
