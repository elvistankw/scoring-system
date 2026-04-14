// Verify current date and competition statuses
require('dotenv').config();
const db = require('./db');

async function verifyDateAndCompetitions() {
  try {
    // Check system date
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🕐 System Date Information:');
    console.log(`   Full timestamp: ${now.toISOString()}`);
    console.log(`   Today (midnight): ${today.toISOString().split('T')[0]}`);
    console.log(`   Local time: ${now.toLocaleString('zh-CN')}`);
    console.log('');
    
    // Check competitions in 华东赛区
    const result = await db.query(`
      SELECT id, name, competition_type, status, start_date, end_date, created_at
      FROM competitions 
      WHERE region = '华东赛区' 
      ORDER BY start_date, id
    `);
    
    console.log(`📋 Found ${result.rows.length} competitions in 华东赛区:`);
    console.log('');
    
    result.rows.forEach((comp, index) => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let dateStatus = '';
      
      if (daysDiff < 0) {
        dateStatus = `${Math.abs(daysDiff)} days ago (PAST)`;
      } else if (daysDiff === 0) {
        dateStatus = 'TODAY';
      } else {
        dateStatus = `in ${daysDiff} days (FUTURE)`;
      }
      
      const shouldBeActive = startDate.getTime() <= today.getTime();
      const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
      const statusCorrect = comp.status === expectedStatus;
      
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   Type: ${comp.competition_type}`);
      console.log(`   Start Date: ${comp.start_date.toISOString().split('T')[0]} (${dateStatus})`);
      console.log(`   Current Status: ${comp.status}`);
      console.log(`   Expected Status: ${expectedStatus}`);
      console.log(`   Status Correct: ${statusCorrect ? '✅' : '❌'}`);
      console.log(`   Created: ${comp.created_at.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Summary
    const incorrectStatuses = result.rows.filter(comp => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      const shouldBeActive = startDate.getTime() <= today.getTime();
      const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
      return comp.status !== expectedStatus;
    });
    
    console.log('📊 Summary:');
    console.log(`   Total competitions: ${result.rows.length}`);
    console.log(`   Correct status: ${result.rows.length - incorrectStatuses.length}`);
    console.log(`   Incorrect status: ${incorrectStatuses.length}`);
    
    if (incorrectStatuses.length > 0) {
      console.log('\n❌ Competitions with incorrect status:');
      incorrectStatuses.forEach(comp => {
        const startDate = new Date(comp.start_date);
        startDate.setHours(0, 0, 0, 0);
        const shouldBeActive = startDate.getTime() <= today.getTime();
        const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
        console.log(`   • ${comp.name} (ID: ${comp.id}): ${comp.status} → should be ${expectedStatus}`);
      });
    }
    
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

verifyDateAndCompetitions();