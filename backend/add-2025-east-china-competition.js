// Script to add 2025 East China Region Duo/Team Competition
// 2025 比赛即将开始双人/团队赛区：华东赛区
// 日期：2026/4/13 - 2026/4/14

require('dotenv').config();
const db = require('./db');

async function addCompetition() {
  try {
    console.log('🚀 Adding 2025 East China Region Duo/Team Competition...\n');

    // Competition details
    const competitionData = {
      name: '2025 华东赛区双人/团队赛',
      competition_type: 'duo_team',
      region: '华东赛区',
      status: 'active', // Since start date is today (2026/4/13)
      start_date: '2026-04-13',
      end_date: '2026-04-14',
      created_by: 1 // Assuming admin user ID is 1
    };

    // Check if competition already exists
    const existingCheck = await db.query(
      `SELECT id, name FROM competitions 
       WHERE name = $1 AND region = $2 AND start_date = $3`,
      [competitionData.name, competitionData.region, competitionData.start_date]
    );

    if (existingCheck.rows.length > 0) {
      console.log('⚠️  Competition already exists:');
      console.log(`   ID: ${existingCheck.rows[0].id}`);
      console.log(`   Name: ${existingCheck.rows[0].name}`);
      console.log('\n✅ No action needed - competition is already in the database.');
      await db.end();
      return;
    }

    // Insert competition
    const result = await db.query(
      `INSERT INTO competitions 
       (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        competitionData.name,
        competitionData.competition_type,
        competitionData.region,
        competitionData.status,
        competitionData.start_date,
        competitionData.end_date,
        competitionData.created_by
      ]
    );

    const newCompetition = result.rows[0];

    console.log('✅ Competition created successfully!\n');
    console.log('📋 Competition Details:');
    console.log(`   ID: ${newCompetition.id}`);
    console.log(`   Name: ${newCompetition.name}`);
    console.log(`   Type: ${newCompetition.competition_type}`);
    console.log(`   Region: ${newCompetition.region}`);
    console.log(`   Status: ${newCompetition.status}`);
    console.log(`   Start Date: ${newCompetition.start_date}`);
    console.log(`   End Date: ${newCompetition.end_date}`);
    console.log(`   Created At: ${newCompetition.created_at}`);
    console.log('\n🎯 Next Steps:');
    console.log('   1. Add athletes to this competition via Admin Dashboard');
    console.log('   2. Assign judges to score the competition');
    console.log('   3. Monitor real-time scores on the Scoreboard');

    // Close the pool properly
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
      console.log('\n✅ Database connection closed.');
    } else {
      console.log('\n✅ Script completed.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding competition:', error);
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    process.exit(1);
  }
}

// Run the script
addCompetition();
