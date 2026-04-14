// backend/test-realtime-display.js
// Manual test for real-time display functionality
// Tests WebSocket connection, score broadcasting, and rankings

const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000';
const TEST_COMPETITION_ID = 1; // Use an existing competition

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

function printResult(testName, passed, message = '') {
  if (passed) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (message) console.log(`  ${colors.red}Error: ${message}${colors.reset}`);
    testsFailed++;
  }
}

async function testRealtimeDisplay() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Real-time Display Functionality Tests${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}Testing Competition ID: ${TEST_COMPETITION_ID}${colors.reset}\n`);

  // Test 1: WebSocket Connection
  console.log(`${colors.cyan}Test 1: WebSocket Connection${colors.reset}`);
  const socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 5000
  });

  await new Promise((resolve) => {
    socket.on('connect', () => {
      printResult('WebSocket connects successfully', true);
      resolve();
    });

    socket.on('connect_error', (error) => {
      printResult('WebSocket connects successfully', false, error.message);
      resolve();
    });

    setTimeout(() => {
      if (!socket.connected) {
        printResult('WebSocket connects successfully', false, 'Connection timeout');
        resolve();
      }
    }, 5000);
  });

  if (!socket.connected) {
    console.log(`\n${colors.red}Cannot proceed without WebSocket connection${colors.reset}`);
    process.exit(1);
  }

  // Test 2: Join Competition Room
  console.log(`\n${colors.cyan}Test 2: Join Competition Room${colors.reset}`);
  await new Promise((resolve) => {
    socket.emit('join-competition', TEST_COMPETITION_ID);

    socket.on('joined-competition', (data) => {
      printResult(
        'Successfully joined competition room',
        data.competition_id === TEST_COMPETITION_ID,
        data.competition_id !== TEST_COMPETITION_ID ? 'Competition ID mismatch' : ''
      );
      printResult(
        'Connection count tracked',
        data.connection_count >= 1,
        `Connection count: ${data.connection_count}`
      );
      resolve();
    });

    socket.on('error', (error) => {
      printResult('Successfully joined competition room', false, error.message);
      resolve();
    });

    setTimeout(() => {
      printResult('Successfully joined competition room', false, 'Timeout waiting for joined-competition event');
      resolve();
    }, 5000);
  });

  // Test 3: Receive Score Updates
  console.log(`\n${colors.cyan}Test 3: Score Update Reception${colors.reset}`);
  let scoreReceived = false;

  socket.on('score-update', (event) => {
    if (!scoreReceived) {
      scoreReceived = true;
      printResult('Receives score-update event', true);
      printResult(
        'Score update has required data',
        event.data && event.data.athlete_name && event.data.scores,
        !event.data ? 'No data in event' : ''
      );
      printResult(
        'Score update has timestamp',
        event.timestamp !== undefined,
        ''
      );
      console.log(`  ${colors.yellow}Sample score data:${colors.reset}`);
      console.log(`    Athlete: ${event.data.athlete_name}`);
      console.log(`    Judge: ${event.data.judge_name}`);
      console.log(`    Timestamp: ${event.timestamp}`);
    }
  });

  console.log(`  ${colors.yellow}Waiting 5 seconds for score updates...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  if (!scoreReceived) {
    console.log(`  ${colors.yellow}Note: No score updates received (this is OK if no scores are being submitted)${colors.reset}`);
  }

  // Test 4: Rankings API
  console.log(`\n${colors.cyan}Test 4: Rankings API${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/scores/rankings/${TEST_COMPETITION_ID}`);
    printResult('Rankings API responds', response.status === 200);
    printResult('Rankings API returns data', response.data.success === true);
    
    if (response.data.data && response.data.data.length > 0) {
      const ranking = response.data.data[0];
      printResult(
        'Rankings have required fields',
        ranking.athlete_name && ranking.rank && ranking.average_scores,
        ''
      );
      console.log(`  ${colors.yellow}Sample ranking:${colors.reset}`);
      console.log(`    Rank: ${ranking.rank}`);
      console.log(`    Athlete: ${ranking.athlete_name}`);
      console.log(`    Judge Count: ${ranking.judge_count}`);
    } else {
      console.log(`  ${colors.yellow}Note: No rankings data (competition may have no scores yet)${colors.reset}`);
    }
  } catch (error) {
    printResult('Rankings API responds', false, error.message);
  }

  // Test 5: Latest Score API
  console.log(`\n${colors.cyan}Test 5: Latest Score API${colors.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/scores/latest/${TEST_COMPETITION_ID}`);
    printResult('Latest score API responds', response.status === 200);
    
    if (response.data.data) {
      printResult('Latest score has data', true);
      console.log(`  ${colors.yellow}Latest score:${colors.reset}`);
      console.log(`    Athlete: ${response.data.data.athlete_name}`);
      console.log(`    Judge: ${response.data.data.judge_name}`);
    } else {
      console.log(`  ${colors.yellow}Note: No latest score (competition may have no scores yet)${colors.reset}`);
    }
  } catch (error) {
    printResult('Latest score API responds', false, error.message);
  }

  // Test 6: Connection Status Tracking
  console.log(`\n${colors.cyan}Test 6: Connection Status${colors.reset}`);
  printResult('Socket is connected', socket.connected);
  printResult('Socket has ID', socket.id !== undefined, `Socket ID: ${socket.id}`);

  // Test 7: Leave Competition
  console.log(`\n${colors.cyan}Test 7: Leave Competition${colors.reset}`);
  await new Promise((resolve) => {
    socket.emit('leave-competition', TEST_COMPETITION_ID);

    socket.on('left-competition', (data) => {
      printResult(
        'Successfully left competition room',
        data.competition_id === TEST_COMPETITION_ID,
        ''
      );
      resolve();
    });

    setTimeout(() => {
      printResult('Successfully left competition room', false, 'Timeout');
      resolve();
    }, 5000);
  });

  // Cleanup
  socket.disconnect();

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}✓ All real-time display tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
testRealtimeDisplay().catch((error) => {
  console.error(`${colors.red}Test error: ${error.message}${colors.reset}`);
  process.exit(1);
});
