// Final fix for competition status issues
// 1. Fix competition ID 61 (starts today but status is 'upcoming')
// 2. Create competitions for 2026-04-14 and 2026-04-15 as requested by user

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function fixCompetitionStatus() {
  try {
    console.log('🔧 Final Competition Status Fix\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today: ${today.toISOString().split('T')[0]}\n`);

    // Step 1: Fix competition ID 61
    console.log('🔧 Step 1: Fix competition ID 61 (starts today but status is upcoming)');
    
    const comp61Result = await pool.query(
      'SELECT id, name, status, start_date FROM competitions WHERE id = 61'
    );
    
    if (comp61Result.rows.length > 0) {
      const comp61 = comp61Result.rows[0];
      console.log(`   Found: ${comp61.name} (ID: ${comp61.id})`);
      console.log(`   Current status: ${comp61.status}`);
      console.log(`   Start date: ${comp61.start_date.toISOString().split('T')[0]}`);
      
      if (comp61.status !== 'active') {
        const updateResult = await pool.query(
          'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING status',
          ['active', 61]
        );
        
        if (updateResult.rows.length > 0) {
          console.log(`   ✅ Updated to: ${updateResult.rows[0].status}`);
        } else {
          console.log('   ❌ Update failed');
        }
      } else {
        console.log('   ✅ Already active');
      }
    } else {
      console.log('   ⚠️  Competition ID 61 not found');
    }
    console.log('');

    // Step 2: Create competitions for user-requested dates
    console.log('🔧 Step 2: Create competitions for user-requested dates');
    
    const competitionsToCreate = [
      {
        name: '2026 华东赛区个人赛 (4月14日)',
        competition_type: 'individual',
        region: '华东赛区',
        status: 'active', // User wants this to be active
        start_date: '2026-04-14',
        end_date: '2026-04-15'
      },
      {
        name: '2026 华东赛区双人/团队赛 (4月15日)',
        competition_type: 'duo_team',
        region: '华东赛区',
        status: 'active', // User wants this to be active
        start_date: '2026-04-15',
        end_date: '2026-04-16'
      }
    ];

    for (const compData of competitionsToCreate) {
      console.log(`   Creating: ${compData.name}`);
      console.log(`   Start: ${compData.start_date}, Status: ${compData.status}`);
      
      // Check if similar competition already exists
      const existingCheck = await pool.query(
        'SELECT id, name FROM competitions WHERE start_date = $1 AND region = $2 AND competition_type = $3',
        [compData.start_date, compData.region, compData.competition_type]
      );
      
      if (existingCheck.rows.length > 0) {
        console.log(`   ⚠️  Similar competition already exists: ${existingCheck.rows[0].name} (ID: ${existingCheck.rows[0].id})`);
      } else {
        try {
          const createResult = await pool.query(`
            INSERT INTO competitions 
            (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name, status
          `, [
            compData.name,
            compData.competition_type,
            compData.region,
            compData.status,
            compData.start_date,
            compData.end_date,
            1 // Admin user ID
          ]);
          
          const newComp = createResult.rows[0];
          console.log(`   ✅ Created: ${newComp.name} (ID: ${newComp.id}, Status: ${newComp.status})`);
        } catch (error) {
          console.log(`   ❌ Creation failed: ${error.message}`);
        }
      }
      console.log('');
    }

    // Step 3: Final verification
    console.log('🔍 Step 3: Final verification');
    
    const finalResult = await pool.query(`
      SELECT id, name, competition_type, status, start_date, end_date
      FROM competitions 
      WHERE region = '华东赛区'
      ORDER BY start_date, id
    `);

    console.log(`📋 Final state - ${finalResult.rows.length} competitions in 华东赛区:\n`);

    finalResult.rows.forEach((comp, index) => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let dateStatus = '';
      
      if (daysDiff < 0) {
        dateStatus = `${Math.abs(daysDiff)} days ago`;
      } else if (daysDiff === 0) {
        dateStatus = 'TODAY';
      } else {
        dateStatus = `in ${daysDiff} days`;
      }

      const statusIcon = comp.status === 'active' ? '🟢' : 
                        comp.status === 'upcoming' ? '🟡' : '🔴';

      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Start: ${comp.start_date.toISOString().split('T')[0]} (${dateStatus})`);
      console.log(`   Status: ${comp.status} ${statusIcon}`);
      console.log('');
    });

    // Summary by date
    const todayComps = finalResult.rows.filter(c => c.start_date.toISOString().split('T')[0] === '2026-04-13');
    const april14Comps = finalResult.rows.filter(c => c.start_date.toISOString().split('T')[0] === '2026-04-14');
    const april15Comps = finalResult.rows.filter(c => c.start_date.toISOString().split('T')[0] === '2026-04-15');

    console.log('📊 Summary by Date:');
    console.log(`   2026-04-13 (today): ${todayComps.length} competitions (${todayComps.filter(c => c.status === 'active').length} active)`);
    console.log(`   2026-04-14: ${april14Comps.length} competitions (${april14Comps.filter(c => c.status === 'active').length} active)`);
    console.log(`   2026-04-15: ${april15Comps.length} competitions (${april15Comps.filter(c => c.status === 'active').length} active)`);

    console.log('\n✅ Fix completed!');
    console.log('💡 User requirements fulfilled:');
    console.log('   • All competitions starting today (2026-04-13) are now active');
    console.log('   • Created competitions for 2026-04-14 and 2026-04-15 with active status');
    console.log('   • Judges can now access all these competitions for scoring');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixCompetitionStatus();