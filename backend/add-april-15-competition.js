// Add competition for 2026-04-15 as specifically requested by user
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function addApril15Competition() {
  try {
    console.log('🔧 Adding competition for 2026-04-15 as requested by user\n');

    const competitionData = {
      name: '2026 华东赛区个人赛 (4月15日)',
      competition_type: 'individual',
      region: '华东赛区',
      status: 'active', // User wants this to be active
      start_date: '2026-04-15',
      end_date: '2026-04-16'
    };

    console.log(`Creating: ${competitionData.name}`);
    console.log(`Start: ${competitionData.start_date}, Status: ${competitionData.status}`);

    // Check if similar competition already exists
    const existingCheck = await pool.query(
      'SELECT id, name FROM competitions WHERE start_date = $1 AND region = $2 AND competition_type = $3',
      [competitionData.start_date, competitionData.region, competitionData.competition_type]
    );

    if (existingCheck.rows.length > 0) {
      console.log(`⚠️  Similar competition already exists: ${existingCheck.rows[0].name} (ID: ${existingCheck.rows[0].id})`);
    } else {
      const createResult = await pool.query(`
        INSERT INTO competitions 
        (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, status
      `, [
        competitionData.name,
        competitionData.competition_type,
        competitionData.region,
        competitionData.status,
        competitionData.start_date,
        competitionData.end_date,
        1 // Admin user ID
      ]);

      const newComp = createResult.rows[0];
      console.log(`✅ Created: ${newComp.name} (ID: ${newComp.id}, Status: ${newComp.status})`);
    }

    // Final check
    const april15Comps = await pool.query(
      'SELECT id, name, status FROM competitions WHERE start_date = $1 AND region = $2',
      ['2026-04-15', '华东赛区']
    );

    console.log(`\n📊 Competitions on 2026-04-15 in 华东赛区: ${april15Comps.rows.length}`);
    april15Comps.rows.forEach(comp => {
      const statusIcon = comp.status === 'active' ? '🟢' : '🟡';
      console.log(`   • ${comp.name} (ID: ${comp.id}) - ${comp.status} ${statusIcon}`);
    });

    console.log('\n✅ User request fulfilled: Competition for 2026-04-15 is ready!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addApril15Competition();