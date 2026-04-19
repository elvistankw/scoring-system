// Clean XSS malicious data from database
// This script removes any HTML/script tags from judge names

const db = require('./db');

async function cleanXSSData() {
  console.log('🧹 Starting XSS data cleanup...\n');
  
  try {
    // Clean judge_sessions table
    console.log('1️⃣ Cleaning judge_sessions table...');
    const judgeSessionsResult = await db.query(`
      UPDATE judge_sessions
      SET judge_name = regexp_replace(judge_name, '<[^>]*>', '', 'g')
      WHERE judge_name ~ '<[^>]*>'
      RETURNING judge_id, judge_name
    `);
    
    if (judgeSessionsResult.rows.length > 0) {
      console.log(`   ✅ Cleaned ${judgeSessionsResult.rows.length} judge sessions:`);
      judgeSessionsResult.rows.forEach(row => {
        console.log(`      - Judge ID ${row.judge_id}: ${row.judge_name}`);
      });
    } else {
      console.log('   ✅ No malicious data found in judge_sessions');
    }
    
    // Clean users table
    console.log('\n2️⃣ Cleaning users table...');
    const usersResult = await db.query(`
      UPDATE users
      SET username = regexp_replace(username, '<[^>]*>', '', 'g')
      WHERE username ~ '<[^>]*>'
      RETURNING id, username
    `);
    
    if (usersResult.rows.length > 0) {
      console.log(`   ✅ Cleaned ${usersResult.rows.length} users:`);
      usersResult.rows.forEach(row => {
        console.log(`      - User ID ${row.id}: ${row.username}`);
      });
    } else {
      console.log('   ✅ No malicious data found in users');
    }
    
    // Clean athletes table
    console.log('\n3️⃣ Cleaning athletes table...');
    const athletesResult = await db.query(`
      UPDATE athletes
      SET name = regexp_replace(name, '<[^>]*>', '', 'g')
      WHERE name ~ '<[^>]*>'
      RETURNING id, name
    `);
    
    if (athletesResult.rows.length > 0) {
      console.log(`   ✅ Cleaned ${athletesResult.rows.length} athletes:`);
      athletesResult.rows.forEach(row => {
        console.log(`      - Athlete ID ${row.id}: ${row.name}`);
      });
    } else {
      console.log('   ✅ No malicious data found in athletes');
    }
    
    console.log('\n✅ XSS data cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning XSS data:', error);
    throw error;
  } finally {
    // Connection pool will be closed automatically
    process.exit(0);
  }
}

// Run cleanup
cleanXSSData();
