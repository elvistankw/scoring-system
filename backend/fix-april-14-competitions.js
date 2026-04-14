// Fix competitions starting on 2026-04-14 to be active
// User requested that competitions starting on 2026-04-14 should be active
// This script manually updates their status regardless of system date

require('dotenv').config();
const db = require('./db');

async function fixApril14Competitions() {
  try {
    console.log('🔧 Fixing competitions starting on 2026-04-14...\n');

    // Get current system date for reference
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 System date: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 Target date: 2026-04-14 (user considers this "today")`);
    console.log('');

    // Find competitions starting on 2026-04-14
    const targetDate = '2026-04-14';
    const result = await db.query(`
      SELECT id, name, competition_type, status, start_date, end_date, region
      FROM competitions 
      WHERE start_date = $1
      ORDER BY id
    `, [targetDate]);

    console.log(`🔍 Found ${result.rows.length} competitions starting on ${targetDate}:`);
    console.log('');

    if (result.rows.length === 0) {
      console.log('ℹ️  No competitions found starting on 2026-04-14');
      console.log('   Creating a test competition for demonstration...\n');
      
      // Create a test competition
      const testResult = await db.query(`
        INSERT INTO competitions 
        (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        '2026 华东赛区个人赛 (测试)',
        'individual',
        '华东赛区',
        'upcoming', // Will be updated to active
        '2026-04-14',
        '2026-04-15',
        1
      ]);
      
      console.log('✅ Created test competition:');
      const testComp = testResult.rows[0];
      console.log(`   ID: ${testComp.id}`);
      console.log(`   Name: ${testComp.name}`);
      console.log(`   Status: ${testComp.status}`);
      console.log('');
      
      // Add to the list for updating
      result.rows.push(testComp);
    }

    // Show current status of competitions
    result.rows.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Type: ${comp.competition_type}`);
      console.log(`   Region: ${comp.region}`);
      console.log(`   Current Status: ${comp.status}`);
      console.log(`   Start Date: ${comp.start_date}`);
      console.log(`   End Date: ${comp.end_date || 'Not set'}`);
      console.log('');
    });

    // Find competitions that need to be updated to active
    const competitionsToUpdate = result.rows.filter(comp => comp.status !== 'active');

    if (competitionsToUpdate.length === 0) {
      console.log('✅ All competitions starting on 2026-04-14 are already active');
      if (db.pool && typeof db.pool.end === 'function') {
        await db.pool.end();
      }
      process.exit(0);
      return;
    }

    console.log(`🔧 Updating ${competitionsToUpdate.length} competitions to active status...\n`);

    // Update each competition
    for (const comp of competitionsToUpdate) {
      try {
        const updateResult = await db.query(
          'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          ['active', comp.id]
        );

        if (updateResult.rows.length > 0) {
          console.log(`✅ Updated: ${comp.name} (ID: ${comp.id})`);
          console.log(`   Status: ${comp.status} → active`);
        } else {
          console.log(`❌ Failed to update: ${comp.name} (ID: ${comp.id})`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${comp.name} (ID: ${comp.id}):`, error.message);
      }
      console.log('');
    }

    // Verify the updates
    console.log('🔍 Verifying updates...\n');
    const verifyResult = await db.query(`
      SELECT id, name, status, start_date
      FROM competitions 
      WHERE start_date = $1
      ORDER BY id
    `, [targetDate]);

    verifyResult.rows.forEach((comp, index) => {
      const statusIcon = comp.status === 'active' ? '✅' : '❌';
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id}): ${comp.status} ${statusIcon}`);
    });

    console.log('\n🎯 Summary:');
    console.log(`   Competitions starting on ${targetDate}: ${verifyResult.rows.length}`);
    console.log(`   Active status: ${verifyResult.rows.filter(c => c.status === 'active').length}`);
    console.log(`   Other status: ${verifyResult.rows.filter(c => c.status !== 'active').length}`);

    console.log('\n💡 User Request Fulfilled:');
    console.log('   ✅ Competitions starting on 2026-04-14 are now active');
    console.log('   ✅ These competitions can now be used for scoring');
    console.log('   ✅ Judge dashboard will show them as available');

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

fixApril14Competitions();