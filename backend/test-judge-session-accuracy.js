// Test script to verify judge session accuracy
// Tests the enhanced getAllJudges endpoint with accurate session tracking

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testJudgeSessionAccuracy() {
  console.log('🧪 Testing Judge Session Accuracy\n');
  console.log('=' .repeat(60));

  try {
    // Note: This test requires admin authentication
    // For testing purposes, we'll call the endpoint directly
    // In production, you need to login first and get a token

    console.log('\n📋 Step 1: Fetching all judges with session data...');
    
    const response = await axios.get(`${API_BASE}/api/judges`, {
      headers: {
        // Add your admin token here if testing with authentication
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    const { judges, total } = response.data.data;

    console.log(`✅ Retrieved ${total} judges\n`);

    // Display judge information
    console.log('📊 Judge Session Status:\n');
    console.log('-'.repeat(120));
    console.log(
      'Code'.padEnd(8) + 
      'Name'.padEnd(20) + 
      'Active'.padEnd(10) + 
      'Currently Active'.padEnd(20) + 
      'Last Session'.padEnd(25) + 
      'Device ID'
    );
    console.log('-'.repeat(120));

    judges.forEach(judge => {
      const code = judge.code.padEnd(8);
      const name = judge.display_name.padEnd(20);
      const isActive = (judge.is_active ? '✅ Yes' : '❌ No').padEnd(10);
      const currentlyActive = (judge.is_currently_active ? '🟢 Active' : '⚪ Idle').padEnd(20);
      const lastSession = judge.last_session_start 
        ? new Date(judge.last_session_start).toLocaleString().padEnd(25)
        : 'Never'.padEnd(25);
      const deviceId = judge.current_device_id 
        ? judge.current_device_id.substring(0, 8) + '...'
        : '-';

      console.log(`${code}${name}${isActive}${currentlyActive}${lastSession}${deviceId}`);

      // Show additional details for currently active judges
      if (judge.is_currently_active) {
        console.log(`  └─ Last Activity: ${new Date(judge.current_session_last_activity).toLocaleString()}`);
        console.log(`  └─ Expires At: ${new Date(judge.current_session_expires_at).toLocaleString()}`);
      }
    });

    console.log('-'.repeat(120));

    // Statistics
    const activeJudges = judges.filter(j => j.is_active).length;
    const currentlyActiveJudges = judges.filter(j => j.is_currently_active).length;
    const judgesWithSessions = judges.filter(j => j.last_session_start).length;

    console.log('\n📈 Statistics:');
    console.log(`   Total Judges: ${total}`);
    console.log(`   Active (Enabled): ${activeJudges}`);
    console.log(`   Currently Active (In Use): ${currentlyActiveJudges}`);
    console.log(`   Judges with Session History: ${judgesWithSessions}`);

    // Verify data accuracy
    console.log('\n✅ Data Accuracy Checks:');
    
    let allChecksPass = true;

    // Check 1: All currently active judges should be active
    const invalidActiveStates = judges.filter(j => j.is_currently_active && !j.is_active);
    if (invalidActiveStates.length > 0) {
      console.log(`   ❌ Found ${invalidActiveStates.length} currently active judges that are not enabled`);
      allChecksPass = false;
    } else {
      console.log('   ✅ All currently active judges are properly enabled');
    }

    // Check 2: Currently active judges should have device IDs
    const missingDeviceIds = judges.filter(j => j.is_currently_active && !j.current_device_id);
    if (missingDeviceIds.length > 0) {
      console.log(`   ❌ Found ${missingDeviceIds.length} currently active judges without device IDs`);
      allChecksPass = false;
    } else {
      console.log('   ✅ All currently active judges have device IDs');
    }

    // Check 3: Currently active judges should have last activity
    const missingActivity = judges.filter(j => j.is_currently_active && !j.current_session_last_activity);
    if (missingActivity.length > 0) {
      console.log(`   ❌ Found ${missingActivity.length} currently active judges without last activity`);
      allChecksPass = false;
    } else {
      console.log('   ✅ All currently active judges have last activity timestamps');
    }

    // Check 4: Judges with last_session_start should have valid dates
    const invalidDates = judges.filter(j => {
      if (!j.last_session_start) return false;
      const date = new Date(j.last_session_start);
      return isNaN(date.getTime());
    });
    if (invalidDates.length > 0) {
      console.log(`   ❌ Found ${invalidDates.length} judges with invalid last session dates`);
      allChecksPass = false;
    } else {
      console.log('   ✅ All last session dates are valid');
    }

    console.log('\n' + '='.repeat(60));
    
    if (allChecksPass) {
      console.log('✅ All accuracy checks passed!');
      console.log('✅ Judge session tracking is working correctly');
    } else {
      console.log('⚠️  Some accuracy checks failed - please review the data');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    if (error.response?.status === 401) {
      console.log('\n💡 Note: This endpoint requires admin authentication.');
      console.log('   To test with authentication:');
      console.log('   1. Login as admin to get a token');
      console.log('   2. Add the token to the Authorization header in this script');
    }
  }
}

// Run the test
testJudgeSessionAccuracy();
