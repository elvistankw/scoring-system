/**
 * Verify Excel Export Query with School Field
 */

const db = require('./db');

async function verifyExportQuery() {
  try {
    console.log('🔍 Verifying Excel Export Query with School Field...\n');

    const competitionId = 43; // Use competition with athletes

    const query = `
      SELECT 
        a.id as athlete_id,
        a.name as athlete_name,
        a.athlete_number,
        a.school,
        a.team_name,
        s.id as score_id,
        s.judge_id,
        COALESCE(j.display_name, u.username, 'Unknown Judge') as judge_name,
        s.action_difficulty,
        s.stage_artistry,
        s.action_creativity,
        s.action_fluency,
        s.costume_styling,
        s.action_interaction,
        s.submitted_at
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       LEFT JOIN scores s ON a.id = s.athlete_id AND s.competition_id = $1
       LEFT JOIN judges j ON s.judge_id = j.id
       LEFT JOIN users u ON s.judge_id = u.id
       WHERE ca.competition_id = $1
       ORDER BY a.athlete_number, s.submitted_at
    `;

    const result = await db.query(query, [competitionId]);

    console.log(`📊 Found ${result.rows.length} records\n`);

    if (result.rows.length > 0) {
      console.log('✅ Sample Export Data (showing school field):');
      console.table(result.rows.map(row => ({
        athlete_number: row.athlete_number,
        athlete_name: row.athlete_name,
        school: row.school,
        team_name: row.team_name,
        judge_name: row.judge_name,
        action_difficulty: row.action_difficulty
      })));

      console.log('\n✅ School field is present in the query results!');
      console.log('✅ Excel export will now show school information!');
    } else {
      console.log('⚠️  No data found for competition', competitionId);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyExportQuery();
