// Test script for Excel export API endpoint
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testExportEndpoint() {
  try {
    console.log('Testing Excel export API endpoint...');
    
    // First, try to login as a judge to get a token
    console.log('1. Attempting to login...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'judge@test.com',
      password: 'judge123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Get competitions list
    console.log('2. Fetching competitions...');
    const competitionsResponse = await axios.get(`${API_BASE}/competitions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const competitions = competitionsResponse.data.data.competitions;
    console.log(`✅ Found ${competitions.length} competitions`);
    
    if (competitions.length === 0) {
      console.log('❌ No competitions found to test export');
      return;
    }
    
    const testCompetition = competitions[0];
    console.log(`3. Testing export for competition: ${testCompetition.name} (ID: ${testCompetition.id})`);
    
    // Test download export
    const exportResponse = await axios.post(`${API_BASE}/competitions/${testCompetition.id}/export-excel`, {
      export_type: 'download'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Export API call successful');
    console.log('Response status:', exportResponse.data.status);
    console.log('File content length:', exportResponse.data.data.file_content?.length || 0);
    console.log('Filename:', exportResponse.data.data.filename);
    
    // Test Google Drive export
    console.log('4. Testing Google Drive export...');
    const driveResponse = await axios.post(`${API_BASE}/competitions/${testCompetition.id}/export-excel`, {
      export_type: 'google-drive',
      target_email: 'test@example.com'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Google Drive export successful');
    console.log('Drive file ID:', driveResponse.data.data.drive_file_id);
    
    // Test online Excel export
    console.log('5. Testing online Excel export...');
    const onlineResponse = await axios.post(`${API_BASE}/competitions/${testCompetition.id}/export-excel`, {
      export_type: 'online-excel'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Online Excel export successful');
    console.log('Excel URL:', onlineResponse.data.data.excel_url);
    
    console.log('\n🎉 All export tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have a judge user with email "judge@test.com" and password "judge123"');
    }
    
    if (error.response?.status === 404) {
      console.log('💡 Tip: Make sure you have at least one competition in the database');
    }
  }
}

testExportEndpoint();