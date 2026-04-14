// backend/test-score-broadcasting.js
// Integration tests for real-time score broadcasting via WebSocket
// Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4

const db = require('./db');
const { redis } = require('./redis');
const io = require('socket.io-client');

/**
 * Test configuration
 */
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const WS_URL = process.env.WS_URL || 'http://localhost:5000';
let authToken = '';
let judgeId = null;
let competitionId = null;
let athleteId = null;
let socketClient = null;

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
 * Helper function to create WebSocket client
 */
function createSocketClient() {
  return io(WS_URL, {
    transports: ['websocket'],
    reconnection: false
  });
}

/**
 * Helper function to wait for event with timeout
 */
function waitForEvent(socket, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('\n📋 Setting up test data...');

  try {
    // 1. Create a test judge user
    const judgeEmail = `test_judge_broadcast_${Date.now()}@example.com`;
    const judgePassword = 'TestPassword123!';

    const registerResponse = await apiRequest('POST', '/api/auth/register', {
      username: `test_judge_broadcast_${Date.now()}`,
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

    // 3. Create a test competition
    const competitionResult = await db.query(
      `INSERT INTO competitions (name, competition_type, region, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')
       RETURNING id`,
      ['Test Broadcast Competition', 'individual', 'Test Region', 'active']
    );
    competitionId = competitionResult.rows[0].id;
    console.log(`✅ Test competition created (ID: ${competitionId})`);

    // 4. Create a test athlete
    const uniqueAthleteNumber = `BCAST${Date.now().toString().slice(-10)}`;
    const athleteResult = await db.query(
      `INSERT INTO athletes (name, athlete_number)
       VALUES ($1, $2)
       RETURNING id`,
      ['Test Broadcast Athlete', uniqueAthleteNumber]
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
    // Close socket connection if open
    if (socketClient && socketClient.connected) {
      socketClient.disconnect();
    }

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
      await redis.del(`ws_connections:competition:${competitionId}`);
    }

    console.log('✅ Test data cleaned up');
  } catch (err) {
    console.error('⚠️  Cleanup warning:', err.message);
  }
}

/**
 * Test 1: Score broadcast after submission
 * Requirements: 6.1, 6.2, 6.3
 */
async function testScoreBroadcastAfterSubmission() {
  console.log('\n🧪 Test 1: Score broadcast after submission');

  try {
    // 1. Create WebSocket client and connect
    socketClient = createSocketClient();

    await new Promise((resolve, reject) => {
      socketClient.on('connect', resolve);
      socketClient.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    console.log('   ✓ WebSocket client connected');

    // 2. Join competition room
    socketClient.emit('join-competition', competitionId);
    const joinedData = await waitForEvent(socketClient, 'joined-competition');
    console.log(`   ✓ Joined competition room (${joinedData.connection_count} connections)`);

    // 3. Set up listener for score-update event
    const scoreUpdatePromise = waitForEvent(socketClient, 'score-update', 10000);

    // 4. Submit a score via API
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

    const submitResponse = await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

    if (submitResponse.status !== 201) {
      throw new Error(`Score submission failed: ${JSON.stringify(submitResponse.data)}`);
    }

    console.log('   ✓ Score submitted successfully');

    // 5. Wait for broadcast (Requirement 6.3: must complete within 100ms)
    const startTime = Date.now();
    const broadcastData = await scoreUpdatePromise;
    const broadcastTime = Date.now() - startTime;

    console.log(`   ✓ Score broadcast received (${broadcastTime}ms)`);

    // 6. Verify broadcast data structure (Requirements 9.1, 9.2, 9.3, 9.4)
    if (!broadcastData || !broadcastData.data) {
      throw new Error('Broadcast data is missing');
    }

    const { data } = broadcastData;

    // Check all required fields are present
    const requiredFields = [
      'competition_id',
      'competition_name',
      'competition_type',
      'athlete_id',
      'athlete_name',
      'judge_id',
      'judge_name',
      'scores',
      'timestamp'
    ];

    const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('   ✓ All required fields present in broadcast');

    // Check score dimensions are present (Requirement 9.1, 9.2)
    const requiredScores = [
      'action_difficulty',
      'stage_artistry',
      'action_creativity',
      'action_fluency',
      'costume_styling'
    ];

    const missingScores = requiredScores.filter(field => 
      !data.scores.hasOwnProperty(field) || data.scores[field] === null
    );

    if (missingScores.length > 0) {
      throw new Error(`Missing score dimensions: ${missingScores.join(', ')}`);
    }

    console.log('   ✓ All score dimensions present in broadcast');

    // Verify values match submission
    if (data.competition_id !== competitionId) {
      throw new Error(`Competition ID mismatch: expected ${competitionId}, got ${data.competition_id}`);
    }

    if (data.athlete_id !== athleteId) {
      throw new Error(`Athlete ID mismatch: expected ${athleteId}, got ${data.athlete_id}`);
    }

    // Compare scores as numbers (handle both number and string representations)
    const expectedScore = 28.5;
    const actualScore = parseFloat(data.scores.action_difficulty);
    if (Math.abs(actualScore - expectedScore) > 0.01) {
      throw new Error(`Score mismatch: expected ${expectedScore}, got ${actualScore}`);
    }

    console.log('   ✓ Broadcast data matches submission');

    // Disconnect
    socketClient.disconnect();

    console.log('✅ PASS: Score broadcast after submission works correctly');
    return true;

  } catch (err) {
    console.log('❌ FAIL:', err.message);
    if (socketClient) {
      socketClient.disconnect();
    }
    return false;
  }
}

/**
 * Test 2: Only clients in correct room receive updates
 * Requirement: 6.3
 */
async function testRoomIsolation() {
  console.log('\n🧪 Test 2: Only clients in correct room receive updates');

  let client1 = null;
  let client2 = null;

  try {
    // Create second competition for isolation test
    const comp2Result = await db.query(
      `INSERT INTO competitions (name, competition_type, region, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')
       RETURNING id`,
      ['Test Competition 2', 'individual', 'Test Region', 'active']
    );
    const competition2Id = comp2Result.rows[0].id;

    // Create second athlete
    const athlete2Result = await db.query(
      `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
      ['Test Athlete 2', `BCAST2${Date.now().toString().slice(-10)}`]
    );
    const athlete2Id = athlete2Result.rows[0].id;

    await db.query(
      `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
      [competitionId, athlete2Id]
    );

    // 1. Create two WebSocket clients
    client1 = createSocketClient();
    client2 = createSocketClient();

    await Promise.all([
      new Promise((resolve, reject) => {
        client1.on('connect', resolve);
        client1.on('connect_error', reject);
        setTimeout(() => reject(new Error('Client 1 connection timeout')), 5000);
      }),
      new Promise((resolve, reject) => {
        client2.on('connect', resolve);
        client2.on('connect_error', reject);
        setTimeout(() => reject(new Error('Client 2 connection timeout')), 5000);
      })
    ]);

    console.log('   ✓ Both WebSocket clients connected');

    // 2. Client 1 joins competition 1, Client 2 joins competition 2
    client1.emit('join-competition', competitionId);
    client2.emit('join-competition', competition2Id);

    await Promise.all([
      waitForEvent(client1, 'joined-competition'),
      waitForEvent(client2, 'joined-competition')
    ]);

    console.log('   ✓ Clients joined different competition rooms');

    // 3. Set up listeners
    let client1Received = false;
    let client2Received = false;

    client1.on('score-update', () => {
      client1Received = true;
    });

    client2.on('score-update', () => {
      client2Received = true;
    });

    // 4. Submit score to competition 1
    const scoreData = {
      competition_id: competitionId,
      athlete_id: athlete2Id,
      scores: {
        action_difficulty: 25.0,
        stage_artistry: 20.0,
        action_creativity: 14.0,
        action_fluency: 16.0,
        costume_styling: 7.5
      }
    };

    await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

    // 5. Wait a bit to see if broadcasts arrive
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Verify only client 1 received the update
    if (client1Received && !client2Received) {
      console.log('   ✓ Only client in correct room received broadcast');
      console.log('✅ PASS: Room isolation works correctly');
      
      // Cleanup
      client1.disconnect();
      client2.disconnect();
      await db.query('DELETE FROM scores WHERE competition_id = $1', [competitionId]);
      await db.query('DELETE FROM competition_athletes WHERE competition_id = $1', [competition2Id]);
      await db.query('DELETE FROM competitions WHERE id = $1', [competition2Id]);
      await db.query('DELETE FROM athletes WHERE id = $1', [athlete2Id]);
      
      return true;
    } else if (!client1Received) {
      throw new Error('Client 1 did not receive broadcast (should have)');
    } else if (client2Received) {
      throw new Error('Client 2 received broadcast (should not have)');
    }

  } catch (err) {
    console.log('❌ FAIL:', err.message);
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    return false;
  }
}

/**
 * Test 3: Broadcast includes all required data
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
async function testBroadcastDataCompleteness() {
  console.log('\n🧪 Test 3: Broadcast includes all required data');

  try {
    // Create athlete for this test
    const athleteResult = await db.query(
      `INSERT INTO athletes (name, athlete_number) VALUES ($1, $2) RETURNING id`,
      ['Test Complete Data Athlete', `BCAST3${Date.now().toString().slice(-10)}`]
    );
    const testAthleteId = athleteResult.rows[0].id;

    await db.query(
      `INSERT INTO competition_athletes (competition_id, athlete_id) VALUES ($1, $2)`,
      [competitionId, testAthleteId]
    );

    // 1. Connect and join
    socketClient = createSocketClient();

    await new Promise((resolve, reject) => {
      socketClient.on('connect', resolve);
      socketClient.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    socketClient.emit('join-competition', competitionId);
    await waitForEvent(socketClient, 'joined-competition');

    console.log('   ✓ Connected and joined competition');

    // 2. Set up listener
    const scoreUpdatePromise = waitForEvent(socketClient, 'score-update', 10000);

    // 3. Submit score
    const scoreData = {
      competition_id: competitionId,
      athlete_id: testAthleteId,
      scores: {
        action_difficulty: 29.0,
        stage_artistry: 23.5,
        action_creativity: 16.0,
        action_fluency: 19.5,
        costume_styling: 9.0
      }
    };

    await apiRequest('POST', '/api/scores/submit', scoreData, authToken);

    // 4. Wait for broadcast
    const broadcastData = await scoreUpdatePromise;

    // 5. Verify data completeness (Requirements 9.1, 9.2, 9.3, 9.4)
    const { data } = broadcastData;

    // Check metadata fields
    const metadataChecks = [
      { field: 'competition_id', type: 'number' },
      { field: 'competition_name', type: 'string' },
      { field: 'competition_type', type: 'string' },
      { field: 'athlete_id', type: 'number' },
      { field: 'athlete_name', type: 'string' },
      { field: 'athlete_number', type: 'string' },
      { field: 'judge_id', type: 'number' },
      { field: 'judge_name', type: 'string' },
      { field: 'timestamp', type: 'string' }
    ];

    for (const check of metadataChecks) {
      if (!data.hasOwnProperty(check.field)) {
        throw new Error(`Missing field: ${check.field}`);
      }
      if (typeof data[check.field] !== check.type) {
        throw new Error(`Field ${check.field} has wrong type: expected ${check.type}, got ${typeof data[check.field]}`);
      }
    }

    console.log('   ✓ All metadata fields present with correct types');

    // Check score dimensions (Requirement 9.1, 9.2)
    const scoreChecks = [
      'action_difficulty',
      'stage_artistry',
      'action_creativity',
      'action_fluency',
      'costume_styling'
    ];

    for (const scoreField of scoreChecks) {
      if (!data.scores.hasOwnProperty(scoreField)) {
        throw new Error(`Missing score dimension: ${scoreField}`);
      }
      // Score can be number, string (from DB), or null
      const scoreValue = data.scores[scoreField];
      if (scoreValue !== null && typeof scoreValue !== 'number' && typeof scoreValue !== 'string') {
        throw new Error(`Score ${scoreField} has wrong type: ${typeof scoreValue}`);
      }
    }

    console.log('   ✓ All score dimensions present');

    // Verify competition type is included (Requirement 9.4)
    if (data.competition_type !== 'individual') {
      throw new Error(`Competition type mismatch: expected 'individual', got '${data.competition_type}'`);
    }

    console.log('   ✓ Competition type included in broadcast');

    // Cleanup
    socketClient.disconnect();
    await db.query('DELETE FROM scores WHERE athlete_id = $1', [testAthleteId]);
    await db.query('DELETE FROM athletes WHERE id = $1', [testAthleteId]);

    console.log('✅ PASS: Broadcast includes all required data');
    return true;

  } catch (err) {
    console.log('❌ FAIL:', err.message);
    if (socketClient) {
      socketClient.disconnect();
    }
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Score Broadcasting Integration Tests');
  console.log('='.repeat(60));

  const results = [];

  try {
    // Setup
    await setupTestData();

    // Run tests
    results.push({ 
      name: 'Score Broadcast After Submission', 
      passed: await testScoreBroadcastAfterSubmission() 
    });
    
    results.push({ 
      name: 'Room Isolation', 
      passed: await testRoomIsolation() 
    });
    
    results.push({ 
      name: 'Broadcast Data Completeness', 
      passed: await testBroadcastDataCompleteness() 
    });

  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
  } finally {
    // Cleanup
    await cleanupTestData();
    
    // Close database pool
    await db.pool.end();
    
    // Close Redis connection gracefully
    try {
      redis.disconnect();
    } catch (err) {
      // Ignore disconnect errors
    }
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
