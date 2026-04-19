// Check what scores are saved in the database
const pool = require('./db');

async function checkScores() {
  try {
    console.log('🔍 Checking saved scores...\n');
    
    // Get all scores for competition 103
    const scoresResult = await pool.query(`
      SELECT 
        s.id,
        s.competition_id,
        s.athlete_id,
        s.judge_id,
        s.action_difficulty,
        s.stage_artistry,
        s.action_creativity,
        s.action_fluency,
        s.costume_styling,
        s.action_interaction,
        a.name as athlete_name,
        a.athlete_number,
        j.name as judge_name
      FROM scores s
      LEFT JOIN athletes a ON s.athlete_id = a.id
      LEFT JOIN judges j ON s.judge_id = j.id
      WHERE s.competition_id = 103
      ORDER BY s.athlete_id, s.judge_id
    `);
    
    console.log(`📊 Found ${scoresResult.rows.length} score records:\n`);
    
    scoresResult.rows.forEach(score => {
      console.log(`Score ID: ${score.id}`);
      console.log(`  Athlete: ID=${score.athlete_id}, Name="${score.athlete_name}", Number=${score.athlete_number}`);
      console.log(`  Judge: ID=${score.judge_id}, Name="${score.judge_name}"`);
      console.log(`  Scores: difficulty=${score.action_difficulty}, artistry=${score.stage_artistry}, creativity=${score.action_creativity}, fluency=${score.action_fluency}, styling=${score.costume_styling}, interaction=${score.action_interaction}`);
      console.log('');
    });
    
    // Get all athletes for competition 103
    console.log('\n📋 Athletes in competition 103:\n');
    const athletesResult = await pool.query(`
      SELECT 
        a.id,
        a.name,
        a.athlete_number,
        a.team_name
      FROM athletes a
      WHERE a.competition_id = 103
      ORDER BY a.id
    `);
    
    athletesResult.rows.forEach(athlete => {
      console.log(`Athlete ID: ${athlete.id}, Name: "${athlete.name}", Number: ${athlete.athlete_number}, Team: ${athlete.team_name || 'N/A'}`);
    });
    
    // Check for judge session
    console.log('\n👨‍⚖️ Judge sessions:\n');
    const sessionsResult = await pool.query(`
      SELECT 
        js.id as session_id,
        js.judge_id,
        js.device_id,
        j.name as judge_name
      FROM judge_sessions js
      LEFT JOIN judges j ON js.judge_id = j.id
      WHERE js.is_active = true
      ORDER BY js.created_at DESC
      LIMIT 5
    `);
    
    sessionsResult.rows.forEach(session => {
      console.log(`Session ID: ${session.session_id}, Judge ID: ${session.judge_id}, Judge Name: "${session.judge_name}", Device: ${session.device_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkScores();
