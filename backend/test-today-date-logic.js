// Test today's date auto-status logic specifically
// 专门测试今天日期的自动状态判断逻辑

require('dotenv').config();
const db = require('./db');

async function testTodayDateLogic() {
  try {
    console.log('🧪 Testing Today Date Auto-Status Logic\n');
    console.log('=' .repeat(60));

    // Get current system time and date info
    const now = new Date();
    console.log('🕐 System Time Information:');
    console.log(`   Current Time: ${now.toISOString()}`);
    console.log(`   Local Time: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}`);
    console.log(`   Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

    // Test today's date in different formats
    const todayFormats = [
      '2026-04-14', // ISO format
      '2026/04/14', // Slash format
      new Date().toISOString().split('T')[0], // Dynamic today
    ];

    console.log('\n📅 Testing Different Today Date Formats:\n');

    for (let i = 0; i < todayFormats.length; i++) {
      const todayFormat = todayFormats[i];
      console.log(`Test ${i + 1}: Using date format "${todayFormat}"`);

      try {
        // Simulate the exact logic from createCompetition
        const start_date = todayFormat;
        const status = undefined; // Not provided

        console.log('   🧪 Applying controller logic:');
        
        let finalStatus = status || 'upcoming';
        console.log(`   Initial finalStatus: ${finalStatus}`);
        
        if (!status && start_date) {
          console.log('   ✅ Conditions met: !status && start_date');
          
          // Get today's date at midnight (exact same logic as controller)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          console.log(`   Today (midnight): ${today.toISOString()}`);
          
          // Get start date at midnight (exact same logic as controller)
          const startDate = new Date(start_date);
          startDate.setHours(0, 0, 0, 0);
          console.log(`   Start Date (midnight): ${startDate.toISOString()}`);
          
          // Compare timestamps
          const todayTime = today.getTime();
          const startTime = startDate.getTime();
          const comparison = startTime <= todayTime;
          
          console.log(`   Comparison: ${startTime} <= ${todayTime} = ${comparison}`);
          console.log(`   Date Diff: ${(startTime - todayTime) / (1000 * 60 * 60 * 24)} days`);
          
          if (comparison) {
            finalStatus = 'active';
            console.log(`   ✅ Setting finalStatus to 'active'`);
          } else {
            console.log(`   ❌ Keeping finalStatus as 'upcoming'`);
          }
        }

        console.log(`   🎯 Final Status: ${finalStatus}`);
        
        // Test with actual database insertion
        console.log('   🚀 Testing database insertion...');
        
        const result = await db.query(
          `INSERT INTO competitions 
           (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            `Test Today ${i + 1}`,
            'individual',
            '测试赛区',
            finalStatus,
            start_date,
            start_date,
            1
          ]
        );

        const createdCompetition = result.rows[0];
        console.log(`   ✅ Created: ID ${createdCompetition.id}, Status: ${createdCompetition.status}`);
        
        // Verify result
        const expectedStatus = 'active';
        const actualStatus = createdCompetition.status;
        const success = actualStatus === expectedStatus;
        
        console.log(`   📊 Expected: ${expectedStatus}, Actual: ${actualStatus}`);
        console.log(`   Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
        
        // Clean up
        await db.query('DELETE FROM competitions WHERE id = $1', [createdCompetition.id]);
        console.log(`   🗑️  Cleaned up test competition`);

      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }

      console.log('');
    }

    // Test with actual API call simulation
    console.log('🌐 Testing via API Controller Logic:');
    console.log('   (Simulating POST /api/competitions without status parameter)');
    
    const testApiData = {
      name: 'API Test Today Competition',
      competition_type: 'individual',
      region: '测试赛区',
      start_date: '2026-04-14', // Today
      end_date: '2026-04-14',
      // status: undefined (not provided)
    };

    console.log(`   Request Body: ${JSON.stringify(testApiData, null, 2)}`);
    
    // Simulate the createCompetition controller logic
    const { name, competition_type, region, status, start_date, end_date } = testApiData;
    
    let finalStatus = status || 'upcoming';
    
    if (!status && start_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate.getTime() <= today.getTime()) {
        finalStatus = 'active';
        console.log(`   ✅ Controller would set status to 'active'`);
      } else {
        console.log(`   ❌ Controller would keep status as 'upcoming'`);
      }
    }

    console.log(`   🎯 Final API Status: ${finalStatus}`);
    console.log(`   Expected: active, Actual: ${finalStatus}`);
    console.log(`   API Test: ${finalStatus === 'active' ? '✅ PASS' : '❌ FAIL'}`);

    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
      console.log('\n✅ Database connection closed.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    process.exit(1);
  }
}

testTodayDateLogic();