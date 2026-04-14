// Check current competitions and their dates relative to "today"
require('dotenv').config();
const db = require('./db');

async function checkCurrentDateCompetitions() {
  try {
    console.log('🔍 Checking Current Date vs Competition Dates\n');
    console.log('=' .repeat(60));

    // Get system time info
    const now = new Date();
    console.log('🕐 System Time Information:');
    console.log(`   UTC Time: ${now.toISOString()}`);
    console.log(`   Local Time: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}`);
    
    // Get "today" as used by the controller
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`   Controller "Today": ${today.toISOString()}`);
    console.log(`   Controller "Today" Date: ${today.toISOString().split('T')[0]}`);

    // Get all competitions
    const competitions = await db.query(
      `SELECT id, name, competition_type, status, start_date, end_date 
       FROM competitions 
       WHERE region = $1 
       ORDER BY start_date, id`,
      ['华东赛区']
    );

    console.log(`\n📋 华东赛区 Competitions Analysis:\n`);

    competitions.rows.forEach((comp, index) => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let dateRelation = '';
      let shouldBeActive = false;
      
      if (daysDiff < 0) {
        dateRelation = `${Math.abs(daysDiff)} days ago (PAST)`;
        shouldBeActive = true;
      } else if (daysDiff === 0) {
        dateRelation = 'TODAY';
        shouldBeActive = true;
      } else {
        dateRelation = `in ${daysDiff} days (FUTURE)`;
        shouldBeActive = false;
      }

      const statusCorrect = shouldBeActive ? comp.status === 'active' : comp.status === 'upcoming';

      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Start Date: ${comp.start_date.toISOString().split('T')[0]} (${dateRelation})`);
      console.log(`   Current Status: ${comp.status}`);
      console.log(`   Should Be: ${shouldBeActive ? 'active' : 'upcoming'}`);
      console.log(`   Status Correct: ${statusCorrect ? '✅ YES' : '❌ NO'}`);
      
      if (daysDiff === 0) {
        console.log(`   🎯 THIS IS TODAY'S COMPETITION!`);
      }
      
      console.log('');
    });

    // Find competitions that are "today"
    const todayCompetitions = competitions.rows.filter(comp => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      return startDate.getTime() === today.getTime();
    });

    console.log('🎯 Today\'s Competitions Summary:');
    console.log(`   Total competitions today: ${todayCompetitions.length}`);
    
    if (todayCompetitions.length > 0) {
      todayCompetitions.forEach(comp => {
        console.log(`   - ${comp.name} (ID: ${comp.id}): status = ${comp.status}`);
      });
      
      const activeToday = todayCompetitions.filter(c => c.status === 'active').length;
      const upcomingToday = todayCompetitions.filter(c => c.status === 'upcoming').length;
      
      console.log(`   Active today: ${activeToday} ✅`);
      console.log(`   Upcoming today: ${upcomingToday} ${upcomingToday > 0 ? '❌ (Should be active!)' : '✅'}`);
    } else {
      console.log('   No competitions found for today.');
    }

    // Check what date would be considered "today" for new competitions
    console.log('\n📅 Date Testing for New Competitions:');
    const testDates = [
      '2026-04-13', // UTC today
      '2026-04-14', // Local today
    ];

    testDates.forEach(testDate => {
      const testStartDate = new Date(testDate);
      testStartDate.setHours(0, 0, 0, 0);
      
      const wouldBeActive = testStartDate.getTime() <= today.getTime();
      console.log(`   ${testDate}: would be ${wouldBeActive ? 'active' : 'upcoming'}`);
    });

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

checkCurrentDateCompetitions();