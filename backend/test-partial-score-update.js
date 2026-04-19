// Test script for partial score update
const db = require('./db');

async function testPartialScoreUpdate() {
  const client = await db.getClient();
  
  try {
    console.log('\n🔍 Testing Partial Score Update...\n');
    
    // Test data
    const testData = {
      competition_id: 103,
      athlete_id: 100,
      judge_id: 30,
      field: 'action_difficulty',
      value: 1
    };
    
    console.log('Test Data:', testData);
    
    // 1. Check if competition exists
    console.log('\n1️⃣ Checking competition...');
    const compResult = await client.query(
      'SELECT id, competition_type, name, status FROM competitions WHERE id = $1',
      [testData.competition_id]
    );
    
    if (compResult.rows.length === 0) {
      console.log('❌ Competition not found');
      return;
    }
    console.log('✅ Competition found:', compResult.rows[0]);
    
    // 2. Check if athlete exists and is registered
    console.log('\n2️⃣ Checking athlete...');
    const athleteResult = await client.query(
      `SELECT a.id, a.name, a.athlete_number 
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       WHERE a.id = $1 AND ca.competition_id = $2`,
      [testData.athlete_id, testData.competition_id]
    );
    
    if (athleteResult.rows.length === 0) {
      console.log('❌ Athlete not found or not registered');
      return;
    }
    console.log('✅ Athlete found:', athleteResult.rows[0]);
    
    // 3. Check if judge exists (in judges table, not users table)
    console.log('\n3️⃣ Checking judge...');
    const judgeResult = await client.query(
      'SELECT id, name, code FROM judges WHERE id = $1',
      [testData.judge_id]
    );
    
    if (judgeResult.rows.length === 0) {
      console.log('❌ Judge not found in judges table');
      
      // Check if it's in users table instead
      const userResult = await client.query(
        'SELECT id, username FROM users WHERE id = $1',
        [testData.judge_id]
      );
      
      if (userResult.rows.length > 0) {
        console.log('⚠️  Found in users table (admin):', userResult.rows[0]);
        console.log('⚠️  This is an admin user, not a judge!');
      }
      return;
    }
    console.log('✅ Judge found:', judgeResult.rows[0]);
    
    // 4. Check if score record exists
    console.log('\n4️⃣ Checking existing score...');
    const existingScore = await client.query(
      'SELECT * FROM scores WHERE competition_id = $1 AND athlete_id = $2 AND judge_id = $3',
      [testData.competition_id, testData.athlete_id, testData.judge_id]
    );
    
    if (existingScore.rows.length > 0) {
      console.log('✅ Existing score found:', existingScore.rows[0]);
      
      // Try to update
      console.log('\n5️⃣ Attempting UPDATE...');
      const updateQuery = `
        UPDATE scores 
        SET ${testData.field} = $1, updated_at = NOW()
        WHERE competition_id = $2 AND athlete_id = $3 AND judge_id = $4
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        testData.value,
        testData.competition_id,
        testData.athlete_id,
        testData.judge_id
      ]);
      
      console.log('✅ UPDATE successful:', updateResult.rows[0]);
    } else {
      console.log('⚠️  No existing score found');
      
      // Try to insert
      console.log('\n5️⃣ Attempting INSERT...');
      const insertQuery = `
        INSERT INTO scores (
          competition_id,
          athlete_id,
          judge_id,
          action_difficulty,
          stage_artistry,
          action_creativity,
          action_fluency,
          costume_styling,
          action_interaction,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;
      
      const fieldValues = {
        action_difficulty: null,
        stage_artistry: null,
        action_creativity: null,
        action_fluency: null,
        costume_styling: null,
        action_interaction: null
      };
      fieldValues[testData.field] = testData.value;
      
      const insertResult = await client.query(insertQuery, [
        testData.competition_id,
        testData.athlete_id,
        testData.judge_id,
        fieldValues.action_difficulty,
        fieldValues.stage_artistry,
        fieldValues.action_creativity,
        fieldValues.action_fluency,
        fieldValues.costume_styling,
        fieldValues.action_interaction
      ]);
      
      console.log('✅ INSERT successful:', insertResult.rows[0]);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testPartialScoreUpdate();
