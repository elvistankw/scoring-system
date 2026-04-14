// backend/test-scores.js
// Integration tests for score submission API
// Requirements: 3.3, 4.3, 5.3, 6.1

const db = require('./db');
const { redis } = require('./redis');

/**
 * Test configuration
 */
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
let authToken = '';
let judgeId = null;
let competitionId = null;
let athleteId = null;

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    data
  };
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('\n📋 Setting up test data...');

  try {
    // 1. Create a test judge user
    const judgeEmail = `test_judge_${Date.now()}@example.com`;
    const judgePassword = 'TestPassword123!';

    const registerResponse = await apiRequest('POST', '/api/auth/register', {
      username: `test_judge_${Date.now()}`,
      email: judgeEmail,
      password: judgePassword,
      role: 'judge'
    });

    if (registerResponse.status !== 201) {
      throw new Error(`Failed to create judge: ${JSON.stringify(registerResponse.data)}`);
    }

    console.log('✅ Test judge created');

    // 2. Login to get auth token
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: judgeEmail,
      password: judgePassword
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login: ${JSON.stringify(loginResponse.data)}`);
    }

    authToken = loginResponse.data.data.token;
    judgeId = loginResponse.data.data.user.id;
    console.log('✅ Judge logged in, token obtained');

    // 3. Create a test competition (need admin for this, so use direct DB)
    const competitionResult = await db.query(
      `INSERT INTO competitions (name, competition_type, region, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')
       RETURNING id`,
      ['Test Competition', 'individual', 'Test Region', 'active']
    );
    competitionId = competitionResult.rows[0].id;
    console.log(`✅ Test competition created (ID: ${competitionId})`);

    // 4. Create a test athlete with unique number
    const uniqueAthleteNumber = `TEST${Date.now().toString().slice(-10)}`;
    const athleteResult = await db.query(
      `INSERT INTO athletes (name, athlete_number)
       VALUES ($1, $2)
       RETURNING id`,
      ['Test Athlete', uniqueAthleteNumber]
    );
    athleteId = athleteResult.rows[0].id;
    console.log(`✅ Test athlete created (ID: ${athleteId})`);

    // 5. Register athlete for competition
    await db.query(
      `INSERT INTO competition_athletes (competition_id, athlete_id)
       VALUES ($1, $2)`,
      [competitionId, athleteId]
    );
    console.log('✅ Athlete registered for competition');

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    throw err;
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete in reverse order of foreign key dependencies
    if (competitionId) {
      await db.query('DELETE FROM scores WHERE competition_id = $1', [competitionId]);
      await db.query('DELETE FROM competition_athletes WHERE competition_id = $1', [competitionId]);
      await db.query('DELETE FROM competitions WHERE id = $1', [competitionId]);
    }

    if (athleteId) {
      await db.query('DELETE FROM athletes WHERE id = $1', [athleteId]);
    }

    if (judgeId) {
      await db.query('DELETE FROM users WHERE id = $1', [judgeId]);
    }

    // Clear Redis cache
    if (competitionId) {
      await redis.del(`latest_score:competition:${competitionId}`);
    }

    console.log('✅ Test data cleaned up');
  } catch (err) {
    console.error('⚠️  Cleanup warning:', err.message);
  }
}

/**
 * Test 1: Submit valid individual competition score
 * Requirement: 3.1, 3.2, 3.3, 3.4, 3.5
 */
async function testSubmitIndividualScore() {
  console.log('\n🧪 Test 1: Submit valid individual competition score');

  const scoreData = {
    competition_id: competitionId,
    athlete_id: athleteId,
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5
    }
  };

  const response = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  if (response.status === 201 && response.data.success) {
    console.log('✅ PASS: Individual score submitted successfully');
    console.log(`   Score ID: ${response.data.data.score_id}`);
    return true;
  } else {
    console.log('❌ FAIL: Expected 201 status and success=true');
    console.log(`   Got: ${response.status}`, response.data);
    return false;
  }
}

/**
 * Test 2: Submit score with missing required fields
 * Requirement: 3.3
 */
async function testMissingFields() {
  console.log('\n🧪 Test 2: Submit score with missing required fields');

  // Create another athlete for this test
  const athleteResult = await db.query(
    `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
    ['Test Athlete 2', `TEST${Date.now().toString().slice(-10)}`]
  );
  const testAthleteId = athleteResult.rows[0].id;

  await db.query(
    `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
    [competitionId, testAthleteId]
  );

  const scoreData = {
    competition_id: competitionId,
    athlete_id: testAthleteId,
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0
      // Missing: action_creativity, action_fluency, costume_styling
    }
  };

  const response = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  // Cleanup
  await db.query('DELETE FROM athletes WHERE id = $1', [testAthleteId]);

  if (response.status === 400 && response.data.message.includes('validation failed')) {
    console.log('✅ PASS: Missing fields rejected with 400 error');
    return true;
  } else {
    console.log('❌ FAIL: Expected 400 status with validation error');
    console.log(`   Got: ${response.status}`, response.data);
    return false;
  }
}

/**
 * Test 3: Submit score with value > 30
 * Requirement: 3.3
 */
async function testScoreRangeValidation() {
  console.log('\n🧪 Test 3: Submit score with value > 30');

  // Create another athlete for this test
  const athleteResult = await db.query(
    `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
    ['Test Athlete 3', `TEST${Date.now().toString().slice(-10)}`]
  );
  const testAthleteId = athleteResult.rows[0].id;

  await db.query(
    `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
    [competitionId, testAthleteId]
  );

  const scoreData = {
    competition_id: competitionId,
    athlete_id: testAthleteId,
    scores: {
      action_difficulty: 35.0, // Invalid: > 30
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5
    }
  };

  const response = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  // Cleanup
  await db.query('DELETE FROM athletes WHERE id = $1', [testAthleteId]);

  if (response.status === 400 && response.data.message.includes('range validation failed')) {
    console.log('✅ PASS: Score > 30 rejected with 400 error');
    return true;
  } else {
    console.log('❌ FAIL: Expected 400 status with range validation error');
    console.log(`   Got: ${response.status}`, response.data);
    return false;
  }
}

/**
 * Test 4: Submit duplicate score (same judge, athlete, competition)
 * Requirement: 6.1
 */
async function testDuplicateScorePrevention() {
  console.log('\n🧪 Test 4: Submit duplicate score');

  // Create another athlete for this test
  const athleteResult = await db.query(
    `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
    ['Test Athlete 4', `TEST${Date.now().toString().slice(-10)}`]
  );
  const testAthleteId = athleteResult.rows[0].id;

  await db.query(
    `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
    [competitionId, testAthleteId]
  );

  const scoreData = {
    competition_id: competitionId,
    athlete_id: testAthleteId,
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5
    }
  };

  // First submission should succeed
  const response1 = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  if (response1.status !== 201) {
    console.log('❌ FAIL: First submission failed');
    await db.query('DELETE FROM athletes WHERE id = $1', [testAthleteId]);
    return false;
  }

  // Second submission should fail (duplicate)
  const response2 = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  // Cleanup
  await db.query('DELETE FROM scores WHERE athlete_id = $1', [testAthleteId]);
  await db.query('DELETE FROM athletes WHERE id = $1', [testAthleteId]);

  if (response2.status === 409 && response2.data.message.includes('already submitted')) {
    console.log('✅ PASS: Duplicate score rejected with 409 error');
    return true;
  } else {
    console.log('❌ FAIL: Expected 409 status with duplicate error');
    console.log(`   Got: ${response2.status}`, response2.data);
    return false;
  }
}

/**
 * Test 5: Submit score without authentication
 * Requirement: 6.1
 */
async function testAuthorizationRequired() {
  console.log('\n🧪 Test 5: Submit score without authentication');

  const scoreData = {
    competition_id: competitionId,
    athlete_id: athleteId,
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5
    }
  };

  // Submit without token
  const response = await apiRequest('POST', '/api/scores/submit', scoreData, null);

  if (response.status === 401) {
    console.log('✅ PASS: Unauthenticated request rejected with 401 error');
    return true;
  } else {
    console.log('❌ FAIL: Expected 401 status');
    console.log(`   Got: ${response.status}`, response.data);
    return false;
  }
}

/**
 * Test 6: Submit duo/team competition score
 * Requirement: 4.1, 4.2, 4.3
 */
async function testDuoTeamScore() {
  console.log('\n🧪 Test 6: Submit duo/team competition score');

  // Create duo/team competition
  const compResult = await db.query(
    `INSERT INTO competitions (name, competition_type, region, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')
     RETURNING id`,
    ['Test Duo Competition', 'duo_team', 'Test Region', 'active']
  );
  const duoCompId = compResult.rows[0].id;

  // Create athlete
  const athleteResult = await db.query(
    `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
    ['Test Duo Team', 'DUO001']
  );
  const duoAthleteId = athleteResult.rows[0].id;

  // Register athlete
  await db.query(
    `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
    [duoCompId, duoAthleteId]
  );

  const scoreData = {
    competition_id: duoCompId,
    athlete_id: duoAthleteId,
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_interaction: 19.5, // Duo/team specific field
      action_creativity: 15.5,
      costume_styling: 8.5
    }
  };

  const response = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  // Cleanup
  await db.query('DELETE FROM scores WHERE competition_id = $1', [duoCompId]);
  await db.query('DELETE FROM competition_athletes WHERE competition_id = $1', [duoCompId]);
  await db.query('DELETE FROM competitions WHERE id = $1', [duoCompId]);
  await db.query('DELETE FROM athletes WHERE id = $1', [duoAthleteId]);

  if (response.status === 201 && response.data.success) {
    console.log('✅ PASS: Duo/team score submitted successfully');
    return true;
  } else {
    console.log('❌ FAIL: Expected 201 status and success=true');
    console.log(`   Got: ${response.status}`, response.data);
    return false;
  }
}

/**
 * Test 7: Submit challenge competition score
 * Requirement: 5.1, 5.2, 5.3
 */
async function testChallengeScore() {
  console.log('\n🧪 Test 7: Submit challenge competition score');

  // Create challenge competition
  const compResult = await db.query(
    `INSERT INTO competitions (name, competition_type, region, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')
     RETURNING id`,
    ['Test Challenge Competition', 'challenge', 'Test Region', 'active']
  );
  const challengeCompId = compResult.rows[0].id;

  // Create athlete
  const athleteResult = await db.query(
    `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
    ['Test Challenger', 'CHL001']
  );
  const challengeAthleteId = athleteResult.rows[0].id;

  // Register athlete
  await db.query(
    `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
    [challengeCompId, challengeAthleteId]
  );

  const scoreData = {
    competition_id: challengeCompId,
    athlete_id: challengeAthleteId,
    scores: {
      action_difficulty: 28.5,
      action_creativity: 15.5,
      action_fluency: 18.0
      // Only 3 fields for challenge type
    }
  };

  const response = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

  // Cleanup
  await db.query('DELETE FROM scores WHERE competition_id = $1', [challengeCompId]);
  await db.query('DELETE FROM competition_athletes WHERE competition_id = $1', [challengeCompId]);
  await db.query('DELETE FROM competitions WHERE id = $1', [challengeCompId]);
  await db.query('DELETE FROM athletes WHERE id = $1', [challengeAthleteId]);

  if (response.status === 201 && response.data.success) {
    console.log('✅ PASS: Challenge score submitted successfully');
    return true;
  } else {
    console.log('❌ FAIL: Expected 201 status and success=true');
    console.log(`   Got: ${response.status}`, response.data);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Score Submission API Integration Tests');
  console.log('='.repeat(60));

  const results = [];

  try {
    // Setup
    await setupTestData();

    // Run tests
    results.push({ name: 'Submit Individual Score', passed: await testSubmitIndividualScore() });
    results.push({ name: 'Missing Fields Validation', passed: await testMissingFields() });
    results.push({ name: 'Score Range Validation', passed: await testScoreRangeValidation() });
    results.push({ name: 'Duplicate Score Prevention', passed: await testDuplicateScorePrevention() });
    results.push({ name: 'Authorization Required', passed: await testAuthorizationRequired() });
    results.push({ name: 'Duo/Team Score Submission', passed: await testDuoTeamScore() });
    results.push({ name: 'Challenge Score Submission', passed: await testChallengeScore() });

  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
  } finally {
    // Cleanup
    await cleanupTestData();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
