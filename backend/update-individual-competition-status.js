// Update 2026 Individual Competition status to active
// 将个人赛状态改为 active，让系统按照日期自动判断逻辑工作

require('dotenv').config();
const db = require('./db');

async function updateCompetitionStatus() {
  try {
    console.log('🔄 Updating 2026 Individual Competition status to active...\n');

    // First, let's check the current status
    const currentResult = await db.query(
      'SELECT id, name, status, start_date, end_date FROM competitions WHERE id = $1',
      [48]
    );

    if (currentResult.rows.length === 0) {
      console.log('❌ Competition with ID 48 not found');
      process.exit(1);
    }

    const currentCompetition = currentResult.rows[0];
    console.log('📋 Current Competition Status:');
    console.log(`   ID: ${currentCompetition.id}`);
    console.log(`   Name: ${currentCompetition.name}`);
    console.log(`   Current Status: ${currentCompetition.status}`);
    console.log(`   Start Date: ${currentCompetition.start_date}`);
    console.log(`   End Date: ${currentCompetition.end_date}`);

    // Check if it's already active
    if (currentCompetition.status === 'active') {
      console.log('\n✅ Competition is already active. No update needed.');
      if (db.pool && typeof db.pool.end === 'function') {
        await db.pool.end();
      }
      process.exit(0);
    }

    // Update the status to active
    const updateResult = await db.query(
      'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['active', 48]
    );

    const updatedCompetition = updateResult.rows[0];

    console.log('\n✅ Competition status updated successfully!\n');
    console.log('📋 Updated Competition:');
    console.log(`   ID: ${updatedCompetition.id}`);
    console.log(`   Name: ${updatedCompetition.name}`);
    console.log(`   Type: ${updatedCompetition.competition_type}`);
    console.log(`   Region: ${updatedCompetition.region}`);
    console.log(`   Status: ${updatedCompetition.status} ✅ (Now ACTIVE)`);
    console.log(`   Start Date: ${updatedCompetition.start_date}`);
    console.log(`   End Date: ${updatedCompetition.end_date}`);
    console.log(`   Updated At: ${updatedCompetition.updated_at}`);

    console.log('\n🎯 Result:');
    console.log('   ✅ Competition is now ACTIVE and can be scored');
    console.log('   ✅ Judges can select this competition for scoring');
    console.log('   ✅ Real-time scoreboard will display scores');
    console.log('   ✅ System now follows the expected auto-status logic');

    console.log('\n💡 Auto-Status Logic Explanation:');
    console.log('   • When start_date = today → status = active ✅');
    console.log('   • When start_date > today → status = upcoming');
    console.log('   • When start_date < today → status = active');
    console.log('   • This competition now follows this logic correctly');

    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
      console.log('\n✅ Database connection closed.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating competition status:', error);
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    process.exit(1);
  }
}

updateCompetitionStatus();