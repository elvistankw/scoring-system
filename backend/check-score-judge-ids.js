// Check which judge_ids are in scores table and which tables they belong to
const db = require('./db');

async function checkJudgeIds() {
  try {
    console.log('🔍 Checking judge_ids in scores table...\n');

    // Get all unique judge_ids from scores
    const scoresResult = await db.query(`
      SELECT DISTINCT judge_id, COUNT(*) as score_count
      FROM scores
      GROUP BY judge_id
      ORDER BY judge_id
    `);

    console.log(`📊 Found ${scoresResult.rows.length} unique judge_ids in scores table:\n`);

    for (const row of scoresResult.rows) {
      const judgeId = row.judge_id;
      const scoreCount = row.score_count;

      // Check if exists in users table
      const userResult = await db.query('SELECT id, username, role FROM users WHERE id = $1', [judgeId]);
      const inUsers = userResult.rows.length > 0;

      // Check if exists in judges table
      const judgeResult = await db.query('SELECT id, name, code FROM judges WHERE id = $1', [judgeId]);
      const inJudges = judgeResult.rows.length > 0;

      console.log(`Judge ID ${judgeId}:`);
      console.log(`  - Scores: ${scoreCount}`);
      console.log(`  - In users table: ${inUsers ? '✅ YES' : '❌ NO'}`);
      if (inUsers) {
        console.log(`    → ${userResult.rows[0].username} (${userResult.rows[0].role})`);
      }
      console.log(`  - In judges table: ${inJudges ? '✅ YES' : '❌ NO'}`);
      if (inJudges) {
        console.log(`    → ${judgeResult.rows[0].name} (${judgeResult.rows[0].code})`);
      }
      console.log('');
    }

    console.log('\n📋 Summary:');
    console.log('This shows which judge_ids need to be migrated or cleaned up.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

checkJudgeIds();
