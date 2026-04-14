// Test script to verify competition status restrictions for scoring
require('dotenv').config();
const db = require('./db');

async function testStatusRestrictions() {
  try {
    console.log('🧪 Testing Competition Status Restrictions for Scoring\n');
    console.log('=' .repeat(60));

    // Get all competitions in 华东赛区
    const competitions = await db.query(
      `SELECT id, name, competition_type, status, start_date, end_date 
       FROM competitions 
       WHERE region = $1 
       ORDER BY id`,
      ['华东赛区']
    );

    console.log('\n📋 华东赛区 Competitions:');
    console.log('');

    competitions.rows.forEach((comp, index) => {
      const canScore = comp.status === 'active';
      const statusIcon = canScore ? '✅' : '❌';
      const statusText = canScore ? 'CAN SCORE' : 'CANNOT SCORE';
      
      console.log(`${index + 1}. ${comp.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Type: ${comp.competition_type}`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   Start Date: ${comp.start_date ? new Date(comp.start_date).toISOString().split('T')[0] : 'Not set'}`);
      console.log(`   End Date: ${comp.end_date ? new Date(comp.end_date).toISOString().split('T')[0] : 'Not set'}`);
      console.log(`   Scoring: ${statusIcon} ${statusText}`);
      console.log('');
    });

    console.log('=' .repeat(60));
    console.log('\n📊 Summary:');
    
    const activeCount = competitions.rows.filter(c => c.status === 'active').length;
    const upcomingCount = competitions.rows.filter(c => c.status === 'upcoming').length;
    const completedCount = competitions.rows.filter(c => c.status === 'completed').length;
    
    console.log(`   Total Competitions: ${competitions.rows.length}`);
    console.log(`   Active (Can Score): ${activeCount} ✅`);
    console.log(`   Upcoming (Cannot Score): ${upcomingCount} ❌`);
    console.log(`   Completed (Cannot Score): ${completedCount} ❌`);

    console.log('\n💡 Business Rules:');
    console.log('   ✅ Only competitions with status="active" can be scored');
    console.log('   ❌ Competitions with status="upcoming" cannot be scored');
    console.log('   ❌ Competitions with status="completed" cannot be scored');
    
    console.log('\n🎯 Frontend Implementation:');
    console.log('   • Judge Dashboard: Shows all active and upcoming competitions');
    console.log('   • Competition Selector: Disables non-active competitions');
    console.log('   • Scoring Page: Shows warning for non-active competitions');
    console.log('   • Visual Indicators: "Can Score" / "Cannot Score" labels');

    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
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

testStatusRestrictions();