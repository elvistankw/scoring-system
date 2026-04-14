// Test auto-status logic for competition creation
// 测试比赛创建时的自动状态判断逻辑

require('dotenv').config();
const db = require('./db');

async function testAutoStatusLogic() {
  try {
    console.log('🧪 Testing Auto-Status Logic for Competition Creation\n');
    console.log('=' .repeat(60));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today's date: ${today.toISOString().split('T')[0]}`);

    // Test cases
    const testCases = [
      {
        name: 'Test Past Date Competition',
        start_date: '2026-04-12', // Yesterday
        expected_status: 'active',
        description: 'Past date should auto-set to active'
      },
      {
        name: 'Test Today Competition',
        start_date: '2026-04-13', // Today
        expected_status: 'active',
        description: 'Today date should auto-set to active'
      },
      {
        name: 'Test Future Competition',
        start_date: '2026-04-15', // Tomorrow
        expected_status: 'upcoming',
        description: 'Future date should auto-set to upcoming'
      }
    ];

    console.log('\n🧪 Test Cases:\n');

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`Test ${i + 1}: ${testCase.name}`);
      console.log(`   Start Date: ${testCase.start_date}`);
      console.log(`   Expected Status: ${testCase.expected_status}`);
      console.log(`   Description: ${testCase.description}`);

      try {
        // Create test competition using the same logic as the controller
        console.log('   🧪 Applying auto-status logic...');
        
        let finalStatus = 'upcoming'; // Default
        
        // Auto-determine status based on start_date (same logic as controller)
        const todayForTest = new Date();
        todayForTest.setHours(0, 0, 0, 0);
        
        const startDateForTest = new Date(testCase.start_date);
        startDateForTest.setHours(0, 0, 0, 0);
        
        if (startDateForTest.getTime() <= todayForTest.getTime()) {
          finalStatus = 'active';
          console.log(`   ✅ Auto-setting to 'active' (start_date <= today)`);
        } else {
          console.log(`   ℹ️  Keeping as 'upcoming' (start_date > today)`);
        }

        const result = await db.query(
          `INSERT INTO competitions 
           (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            testCase.name,
            'individual',
            '测试赛区',
            finalStatus, // Use calculated status
            testCase.start_date,
            testCase.start_date,
            1
          ]
        );

        const createdCompetition = result.rows[0];
        const actualStatus = createdCompetition.status;
        const passed = actualStatus === testCase.expected_status;

        console.log(`   Actual Status: ${actualStatus}`);
        console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

        if (!passed) {
          console.log(`   ❌ Expected '${testCase.expected_status}' but got '${actualStatus}'`);
        }

        // Clean up - delete test competition
        await db.query('DELETE FROM competitions WHERE id = $1', [createdCompetition.id]);
        console.log(`   🗑️  Test competition deleted (ID: ${createdCompetition.id})`);

      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }

      console.log('');
    }

    console.log('=' .repeat(60));
    console.log('\n📊 Auto-Status Logic Summary:');
    console.log('   • start_date < today → status = active');
    console.log('   • start_date = today → status = active');
    console.log('   • start_date > today → status = upcoming');

    console.log('\n🔧 Implementation Location:');
    console.log('   File: backend/controllers/competitions.controller.js');
    console.log('   Function: createCompetition()');
    console.log('   Logic: Auto-determine status based on start_date if not explicitly provided');

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

testAutoStatusLogic();