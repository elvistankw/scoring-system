// Fix competitions with past start dates that should be active
// 修复开始日期在过去但状态仍为upcoming的比赛

require('dotenv').config();
const db = require('./db');

async function fixPastDateCompetitions() {
  try {
    console.log('🔍 Checking competitions with past start dates...\n');

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today's date: ${today.toISOString().split('T')[0]}`);

    // Find all competitions in 华东赛区
    const allCompetitions = await db.query(
      `SELECT id, name, competition_type, status, start_date, end_date 
       FROM competitions 
       WHERE region = $1 
       ORDER BY id`,
      ['华东赛区']
    );

    console.log(`\n📋 Found ${allCompetitions.rows.length} competitions in 华东赛区:\n`);

    const competitionsToFix = [];

    allCompetitions.rows.forEach((comp, index) => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let dateStatus = '';
      
      if (daysDiff < 0) {
        dateStatus = `${Math.abs(daysDiff)} days ago (PAST)`;
      } else if (daysDiff === 0) {
        dateStatus = 'TODAY';
      } else {
        dateStatus = `in ${daysDiff} days (FUTURE)`;
      }

      const shouldBeActive = startDate.getTime() <= today.getTime();
      const needsFix = shouldBeActive && comp.status === 'upcoming';

      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Type: ${comp.competition_type}`);
      console.log(`   Current Status: ${comp.status}`);
      console.log(`   Start Date: ${comp.start_date.toISOString().split('T')[0]} (${dateStatus})`);
      console.log(`   Should be Active: ${shouldBeActive ? 'YES' : 'NO'}`);
      console.log(`   Needs Fix: ${needsFix ? '🔧 YES' : '✅ NO'}`);
      console.log('');

      if (needsFix) {
        competitionsToFix.push({
          id: comp.id,
          name: comp.name,
          currentStatus: comp.status,
          startDate: comp.start_date
        });
      }
    });

    if (competitionsToFix.length === 0) {
      console.log('✅ All competitions have correct status based on their start dates.');
      if (db.pool && typeof db.pool.end === 'function') {
        await db.pool.end();
      }
      process.exit(0);
      return;
    }

    console.log('🔧 Competitions that need to be fixed:\n');
    competitionsToFix.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Current: ${comp.currentStatus} → Should be: active`);
    });

    console.log(`\n❓ Do you want to fix ${competitionsToFix.length} competitions? (This will update their status to 'active')`);
    console.log('   This script will proceed automatically in 3 seconds...\n');

    // Wait 3 seconds then proceed
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🚀 Proceeding with fixes...\n');

    // Fix each competition
    for (const comp of competitionsToFix) {
      try {
        const result = await db.query(
          'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          ['active', comp.id]
        );

        if (result.rows.length > 0) {
          console.log(`✅ Fixed: ${comp.name} (ID: ${comp.id}) → status = 'active'`);
        } else {
          console.log(`❌ Failed to fix: ${comp.name} (ID: ${comp.id})`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${comp.name} (ID: ${comp.id}):`, error.message);
      }
    }

    console.log('\n🎯 Summary:');
    console.log(`   Total competitions checked: ${allCompetitions.rows.length}`);
    console.log(`   Competitions fixed: ${competitionsToFix.length}`);
    console.log('   All past-date competitions should now be active');

    console.log('\n💡 Auto-Status Logic:');
    console.log('   • start_date < today → status = active ✅');
    console.log('   • start_date = today → status = active ✅');
    console.log('   • start_date > today → status = upcoming ✅');

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

fixPastDateCompetitions();