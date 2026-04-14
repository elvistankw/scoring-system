// Simple competition status check using existing backend connection
// This script connects to the same database as the running backend

const { Pool } = require('pg');

// Use the same connection config as the backend
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function checkCompetitions() {
  try {
    console.log('🔍 Checking competitions in 华东赛区...\n');

    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
    console.log('');

    // Query competitions
    const result = await pool.query(`
      SELECT id, name, competition_type, status, start_date, end_date
      FROM competitions 
      WHERE region = '华东赛区'
      ORDER BY start_date, id
    `);

    console.log(`📋 Found ${result.rows.length} competitions:\n`);

    result.rows.forEach((comp, index) => {
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

      const shouldBeActive = startDate.getTime() <= today.getTime();
      const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
      const statusIcon = comp.status === 'active' ? '🟢' : 
                        comp.status === 'upcoming' ? '🟡' : '🔴';

      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Type: ${comp.competition_type}`);
      console.log(`   Start: ${comp.start_date.toISOString().split('T')[0]} (${dateStatus})`);
      console.log(`   Status: ${comp.status} ${statusIcon}`);
      console.log(`   Expected: ${expectedStatus} ${comp.status === expectedStatus ? '✅' : '❌'}`);
      console.log('');
    });

    // Show summary
    const activeCount = result.rows.filter(c => c.status === 'active').length;
    const upcomingCount = result.rows.filter(c => c.status === 'upcoming').length;
    
    console.log('📊 Summary:');
    console.log(`   🟢 Active: ${activeCount}`);
    console.log(`   🟡 Upcoming: ${upcomingCount}`);
    console.log(`   📝 Total: ${result.rows.length}`);

    // Check specific dates mentioned by user
    const april14Comps = result.rows.filter(c => c.start_date.toISOString().split('T')[0] === '2026-04-14');
    const april15Comps = result.rows.filter(c => c.start_date.toISOString().split('T')[0] === '2026-04-15');

    console.log('\n🎯 User-Requested Dates:');
    console.log(`   2026-04-14 competitions: ${april14Comps.length} (${april14Comps.filter(c => c.status === 'active').length} active)`);
    console.log(`   2026-04-15 competitions: ${april15Comps.length} (${april15Comps.filter(c => c.status === 'active').length} active)`);

    if (april14Comps.length > 0 || april15Comps.length > 0) {
      console.log('\n💡 User Request Analysis:');
      console.log('   User wants competitions starting 2026-04-14 to be active');
      console.log('   User wants competitions starting 2026-04-15 to be active');
      console.log(`   System date is ${today.toISOString().split('T')[0]}`);
      
      const needsUpdate = [
        ...april14Comps.filter(c => c.status !== 'active'),
        ...april15Comps.filter(c => c.status !== 'active')
      ];
      
      if (needsUpdate.length > 0) {
        console.log(`\n🔧 ${needsUpdate.length} competitions need status update to fulfill user request:`);
        needsUpdate.forEach(comp => {
          console.log(`   • ${comp.name} (ID: ${comp.id}): ${comp.status} → active`);
        });
      } else {
        console.log('\n✅ All requested competitions are already active');
      }
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkCompetitions();