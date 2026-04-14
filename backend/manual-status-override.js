// Manual status override for specific competitions
// This script allows manual override of competition status regardless of auto-logic
// Use this when you need to force specific competitions to be active for testing

require('dotenv').config();
const db = require('./db');

async function manualStatusOverride() {
  try {
    console.log('🔧 Manual Competition Status Override Tool\n');

    // Define competitions to override (can be modified as needed)
    const overrides = [
      {
        criteria: { start_date: '2026-04-14' },
        new_status: 'active',
        reason: 'User requested: competitions starting 2026-04-14 should be active'
      },
      {
        criteria: { start_date: '2026-04-15' },
        new_status: 'active', 
        reason: 'User requested: competitions starting 2026-04-15 should be active'
      }
    ];

    console.log('📋 Override Configuration:');
    overrides.forEach((override, index) => {
      console.log(`${index + 1}. Criteria: ${JSON.stringify(override.criteria)}`);
      console.log(`   New Status: ${override.new_status}`);
      console.log(`   Reason: ${override.reason}`);
      console.log('');
    });

    // Process each override
    for (const override of overrides) {
      console.log(`🔍 Processing override: ${JSON.stringify(override.criteria)}`);
      
      // Build query based on criteria
      let query = 'SELECT id, name, competition_type, status, start_date, region FROM competitions WHERE ';
      const params = [];
      const conditions = [];
      let paramCount = 0;

      Object.entries(override.criteria).forEach(([key, value]) => {
        paramCount++;
        conditions.push(`${key} = $${paramCount}`);
        params.push(value);
      });

      query += conditions.join(' AND ');

      // Find matching competitions
      const result = await db.query(query, params);
      
      console.log(`   Found ${result.rows.length} matching competitions:`);
      
      if (result.rows.length === 0) {
        console.log('   No competitions found matching criteria');
        console.log('');
        continue;
      }

      // Show competitions and update them
      for (const comp of result.rows) {
        console.log(`   • ${comp.name} (ID: ${comp.id})`);
        console.log(`     Current: ${comp.status} → Target: ${override.new_status}`);
        
        if (comp.status === override.new_status) {
          console.log(`     ✅ Already ${override.new_status} - no change needed`);
        } else {
          try {
            const updateResult = await db.query(
              'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING status',
              [override.new_status, comp.id]
            );
            
            if (updateResult.rows.length > 0) {
              console.log(`     ✅ Updated to ${updateResult.rows[0].status}`);
            } else {
              console.log(`     ❌ Update failed`);
            }
          } catch (error) {
            console.log(`     ❌ Update error: ${error.message}`);
          }
        }
      }
      console.log('');
    }

    // Final verification - show all competitions in 华东赛区
    console.log('🔍 Final Status Verification (华东赛区):');
    const finalResult = await db.query(`
      SELECT id, name, competition_type, status, start_date, end_date
      FROM competitions 
      WHERE region = '华东赛区'
      ORDER BY start_date, id
    `);

    console.log(`Found ${finalResult.rows.length} competitions in 华东赛区:\n`);
    
    finalResult.rows.forEach((comp, index) => {
      const statusIcon = comp.status === 'active' ? '🟢' : 
                        comp.status === 'upcoming' ? '🟡' : '🔴';
      
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Status: ${comp.status} ${statusIcon}`);
      console.log(`   Type: ${comp.competition_type}`);
      console.log(`   Start: ${comp.start_date}`);
      console.log(`   End: ${comp.end_date || 'Not set'}`);
      console.log('');
    });

    // Summary
    const activeCount = finalResult.rows.filter(c => c.status === 'active').length;
    const upcomingCount = finalResult.rows.filter(c => c.status === 'upcoming').length;
    const completedCount = finalResult.rows.filter(c => c.status === 'completed').length;

    console.log('📊 Status Summary:');
    console.log(`   🟢 Active: ${activeCount}`);
    console.log(`   🟡 Upcoming: ${upcomingCount}`);
    console.log(`   🔴 Completed: ${completedCount}`);
    console.log(`   📝 Total: ${finalResult.rows.length}`);

    console.log('\n✅ Manual status override completed!');
    console.log('💡 Judges can now access active competitions for scoring.');

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

manualStatusOverride();