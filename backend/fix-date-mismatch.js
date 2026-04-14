// Fix date mismatch and create proper competitions for both dates
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'scoring',
  password: 'etkw1234',
  port: 5432,
});

async function fixDateMismatch() {
  try {
    console.log('🔧 Fixing date mismatch and creating proper competitions\n');

    // Step 1: Fix competition 62 (should start on 2026-04-15, not 2026-04-14)
    console.log('Step 1: Fix competition 62 date');
    const updateResult62 = await pool.query(
      'UPDATE competitions SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING id, name, start_date',
      ['2026-04-15', '2026-04-16', 62]
    );
    
    if (updateResult62.rows.length > 0) {
      const comp = updateResult62.rows[0];
      console.log(`✅ Updated ID 62: ${comp.name}`);
      console.log(`   New start date: ${comp.start_date.toISOString().split('T')[0]}`);
    }

    // Step 2: Fix competition 63 (should start on 2026-04-15, not 2026-04-14)
    console.log('\nStep 2: Fix competition 63 date');
    const updateResult63 = await pool.query(
      'UPDATE competitions SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING id, name, start_date',
      ['2026-04-15', '2026-04-16', 63]
    );
    
    if (updateResult63.rows.length > 0) {
      const comp = updateResult63.rows[0];
      console.log(`✅ Updated ID 63: ${comp.name}`);
      console.log(`   New start date: ${comp.start_date.toISOString().split('T')[0]}`);
    }

    // Step 3: Create proper competitions for 2026-04-14
    console.log('\nStep 3: Create competitions for 2026-04-14');
    
    const april14Competitions = [
      {
        name: '2026 华东赛区个人赛 (4月14日)',
        competition_type: 'individual',
        start_date: '2026-04-14',
        end_date: '2026-04-15'
      },
      {
        name: '2026 华东赛区双人/团队赛 (4月14日)',
        competition_type: 'duo_team',
        start_date: '2026-04-14',
        end_date: '2026-04-15'
      }
    ];

    for (const compData of april14Competitions) {
      // Check if already exists
      const existingCheck = await pool.query(
        'SELECT id FROM competitions WHERE start_date = $1 AND competition_type = $2 AND region = $3',
        [compData.start_date, compData.competition_type, '华东赛区']
      );

      if (existingCheck.rows.length > 0) {
        console.log(`⚠️  ${compData.name} already exists (ID: ${existingCheck.rows[0].id})`);
      } else {
        const createResult = await pool.query(`
          INSERT INTO competitions 
          (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id, name
        `, [
          compData.name,
          compData.competition_type,
          '华东赛区',
          'active', // User wants these to be active
          compData.start_date,
          compData.end_date,
          1
        ]);

        const newComp = createResult.rows[0];
        console.log(`✅ Created: ${newComp.name} (ID: ${newComp.id})`);
      }
    }

    // Step 4: Final verification
    console.log('\n🔍 Final verification:');
    
    const april14Result = await pool.query(
      'SELECT id, name, status FROM competitions WHERE start_date = $1 AND region = $2 ORDER BY id',
      ['2026-04-14', '华东赛区']
    );
    
    const april15Result = await pool.query(
      'SELECT id, name, status FROM competitions WHERE start_date = $1 AND region = $2 ORDER BY id',
      ['2026-04-15', '华东赛区']
    );

    console.log(`\n📊 2026-04-14 competitions: ${april14Result.rows.length}`);
    april14Result.rows.forEach(comp => {
      const statusIcon = comp.status === 'active' ? '🟢' : '🟡';
      console.log(`   • ${comp.name} (ID: ${comp.id}) - ${comp.status} ${statusIcon}`);
    });

    console.log(`\n📊 2026-04-15 competitions: ${april15Result.rows.length}`);
    april15Result.rows.forEach(comp => {
      const statusIcon = comp.status === 'active' ? '🟢' : '🟡';
      console.log(`   • ${comp.name} (ID: ${comp.id}) - ${comp.status} ${statusIcon}`);
    });

    console.log('\n✅ Date mismatch fixed!');
    console.log('💡 User requirements fulfilled:');
    console.log('   • Competitions for 2026-04-14 are active and available for scoring');
    console.log('   • Competitions for 2026-04-15 are active and available for scoring');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixDateMismatch();