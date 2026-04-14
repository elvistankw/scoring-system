// Fix remaining competitions with incorrect status
require('dotenv').config();
const db = require('./db');

async function fixRemainingStatusIssues() {
  try {
    console.log('🔧 Fixing Remaining Competition Status Issues\n');
    console.log('=' .repeat(60));

    // Get today for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Controller "Today": ${today.toISOString().split('T')[0]}`);

    // Find competitions with incorrect status
    const allCompetitions = await db.query(
      `SELECT id, name, competition_type, status, start_date, end_date 
       FROM competitions 
       WHERE region = $1 
       ORDER BY id`,
      ['华东赛区']
    );

    console.log('\n🔍 Analyzing all competitions for status issues:\n');

    const competitionsToFix = [];

    allCompetitions.rows.forEach((comp, index) => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const shouldBeActive = startDate.getTime() <= today.getTime();
      const currentlyActive = comp.status === 'active';
      const needsFix = shouldBeActive && !currentlyActive;

      const daysDiff = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let dateRelation = '';
      
      if (daysDiff < 0) {
        dateRelation = `${Math.abs(daysDiff)} days ago`;
      } else if (daysDiff === 0) {
        dateRelation = 'TODAY';
      } else {
        dateRelation = `in ${daysDiff} days`;
      }

      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Start Date: ${comp.start_date.toISOString().split('T')[0]} (${dateRelation})`);
      console.log(`   Current Status: ${comp.status}`);
      console.log(`   Should Be Active: ${shouldBeActive ? 'YES' : 'NO'}`);
      console.log(`   Needs Fix: ${needsFix ? '🔧 YES' : '✅ NO'}`);

      if (needsFix) {
        competitionsToFix.push({
          id: comp.id,
          name: comp.name,
          currentStatus: comp.status,
          startDate: comp.start_date.toISOString().split('T')[0],
          dateRelation: dateRelation
        });
      }

      console.log('');
    });

    if (competitionsToFix.length === 0) {
      console.log('✅ All competitions have correct status! No fixes needed.');
      if (db.pool && typeof db.pool.end === 'function') {
        await db.pool.end();
      }
      process.exit(0);
      return;
    }

    console.log('🔧 Competitions that need status fixes:\n');
    competitionsToFix.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Date: ${comp.startDate} (${comp.dateRelation})`);
      console.log(`   Current: ${comp.currentStatus} → Should be: active`);
      console.log('');
    });

    console.log(`🚀 Fixing ${competitionsToFix.length} competitions...\n`);

    // Fix each competition
    let fixedCount = 0;
    for (const comp of competitionsToFix) {
      try {
        const result = await db.query(
          'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          ['active', comp.id]
        );

        if (result.rows.length > 0) {
          console.log(`✅ Fixed: ${comp.name} (ID: ${comp.id}) → status = 'active'`);
          fixedCount++;
        } else {
          console.log(`❌ Failed to fix: ${comp.name} (ID: ${comp.id})`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${comp.name} (ID: ${comp.id}):`, error.message);
      }
    }

    console.log('\n🎯 Fix Summary:');
    console.log(`   Competitions identified: ${competitionsToFix.length}`);
    console.log(`   Successfully fixed: ${fixedCount}`);
    console.log(`   Failed to fix: ${competitionsToFix.length - fixedCount}`);

    if (fixedCount > 0) {
      console.log('\n✅ Status fixes completed! Running verification...');
      
      // Verify the fixes
      const verifyResult = await db.query(
        `SELECT id, name, status, start_date 
         FROM competitions 
         WHERE region = $1 AND id = ANY($2)`,
        ['华东赛区', competitionsToFix.map(c => c.id)]
      );

      console.log('\n📊 Verification Results:');
      verifyResult.rows.forEach(comp => {
        console.log(`   ${comp.name} (ID: ${comp.id}): status = ${comp.status} ✅`);
      });
    }

    console.log('\n💡 Auto-Status Logic Summary:');
    console.log('   ✅ start_date < today → status = active');
    console.log('   ✅ start_date = today → status = active');
    console.log('   ✅ start_date > today → status = upcoming');
    console.log('\n   All competitions should now follow this logic correctly!');

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

fixRemainingStatusIssues();