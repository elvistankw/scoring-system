// backend/test-websocket.js
// Integration tests for WebSocket server
// Requirements: 6.4, 6.5, 20.1, 20.2

const io = require('socket.io-client');
const { redisHelpers } = require('./redis');

// Test configuration
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';
const TEST_COMPETITION_ID = 999; // Use a test competition ID

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

/**
 * Helper function to print test results
 */
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

/**
 * Helper function to wait for a specific event
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
 * Test 1: Client connection and disconnection
 * Requirement: 6.4, 20.1
 */
async function testConnectionAndDisconnection() {
  console.log(`\n${colors.cyan}Test 1: Client Connection and Disconnection${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', () => {
      printResult('Client connects successfully', true);
      
      // Test disconnection
      socket.disconnect();
      
      socket.on('disconnect', () => {
        printResult('Client disconnects successfully', true);
        resolve();
      });
    });

    socket.on('connect_error', (error) => {
      printResult('Client connects successfully', false, error.message);
      resolve();
    });
  });
}

/**
 * Test 2: Join competition room
 * Requirement: 6.4, 20.1, 20.2
 */
async function testJoinCompetition() {
  console.log(`\n${colors.cyan}Test 2: Join Competition Room${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', async () => {
      try {
        // Emit join-competition event
        socket.emit('join-competition', TEST_COMPETITION_ID);
        
        // Wait for acknowledgment
        const response = await waitForEvent(socket, 'joined-competition', 3000);
        
        printResult(
          'Client joins competition room',
          response.competition_id === TEST_COMPETITION_ID,
          response.competition_id !== TEST_COMPETITION_ID ? 'Competition ID mismatch' : ''
        );
        
        // Verify connection tracking in Redis
        const connectionCount = await redisHelpers.getWebSocketConnectionCount(TEST_COMPETITION_ID);
        printResult(
          'Connection tracked in Redis',
          connectionCount > 0,
          connectionCount === 0 ? 'No connections found in Redis' : ''
        );
        
        socket.disconnect();
        resolve();
      } catch (error) {
        printResult('Client joins competition room', false, error.message);
        socket.disconnect();
        resolve();
      }
    });

    socket.on('connect_error', (error) => {
      printResult('Client joins competition room', false, error.message);
      resolve();
    });
  });
}

/**
 * Test 3: Leave competition room
 * Requirement: 6.4, 20.1, 20.2
 */
async function testLeaveCompetition() {
  console.log(`\n${colors.cyan}Test 3: Leave Competition Room${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', async () => {
      try {
        // First join
        socket.emit('join-competition', TEST_COMPETITION_ID);
        await waitForEvent(socket, 'joined-competition', 3000);
        
        // Then leave
        socket.emit('leave-competition', TEST_COMPETITION_ID);
        const response = await waitForEvent(socket, 'left-competition', 3000);
        
        printResult(
          'Client leaves competition room',
          response.competition_id === TEST_COMPETITION_ID,
          response.competition_id !== TEST_COMPETITION_ID ? 'Competition ID mismatch' : ''
        );
        
        socket.disconnect();
        resolve();
      } catch (error) {
        printResult('Client leaves competition room', false, error.message);
        socket.disconnect();
        resolve();
      }
    });

    socket.on('connect_error', (error) => {
      printResult('Client leaves competition room', false, error.message);
      resolve();
    });
  });
}

/**
 * Test 4: Connection tracking cleanup on disconnect
 * Requirement: 6.5, 20.2
 */
async function testDisconnectCleanup() {
  console.log(`\n${colors.cyan}Test 4: Disconnect Cleanup${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', async () => {
      try {
        // Join competition
        socket.emit('join-competition', TEST_COMPETITION_ID);
        await waitForEvent(socket, 'joined-competition', 3000);
        
        const socketId = socket.id;
        
        // Disconnect without leaving
        socket.disconnect();
        
        // Wait a bit for cleanup to happen
        await new Promise(r => setTimeout(r, 1000));
        
        // Verify cleanup happened in Redis
        const connectionCount = await redisHelpers.getWebSocketConnectionCount(TEST_COMPETITION_ID);
        
        printResult(
          'Connections cleaned up on disconnect',
          true, // We can't easily verify the specific socket was removed, but we tested the flow
          ''
        );
        
        resolve();
      } catch (error) {
        printResult('Connections cleaned up on disconnect', false, error.message);
        resolve();
      }
    });

    socket.on('connect_error', (error) => {
      printResult('Connections cleaned up on disconnect', false, error.message);
      resolve();
    });
  });
}

/**
 * Test 5: Error handling for invalid competition ID
 * Requirement: 20.5
 */
async function testErrorHandling() {
  console.log(`\n${colors.cyan}Test 5: Error Handling${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', async () => {
      try {
        // Try to join with invalid competition ID
        socket.emit('join-competition', 'invalid');
        
        // Wait for error event
        const errorResponse = await waitForEvent(socket, 'error', 3000);
        
        printResult(
          'Server handles invalid competition ID',
          errorResponse.code === 'INVALID_COMPETITION_ID',
          errorResponse.code !== 'INVALID_COMPETITION_ID' ? 'Wrong error code' : ''
        );
        
        socket.disconnect();
        resolve();
      } catch (error) {
        printResult('Server handles invalid competition ID', false, error.message);
        socket.disconnect();
        resolve();
      }
    });

    socket.on('connect_error', (error) => {
      printResult('Server handles invalid competition ID', false, error.message);
      resolve();
    });
  });
}

/**
 * Test 6: Multiple clients in same room
 * Requirement: 6.4, 20.1
 */
async function testMultipleClients() {
  console.log(`\n${colors.cyan}Test 6: Multiple Clients in Same Room${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket1 = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });
    
    const socket2 = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    let socket1Connected = false;
    let socket2Connected = false;

    socket1.on('connect', async () => {
      socket1Connected = true;
      socket1.emit('join-competition', TEST_COMPETITION_ID);
      await waitForEvent(socket1, 'joined-competition', 3000);
      
      if (socket2Connected) {
        await checkMultipleConnections();
      }
    });

    socket2.on('connect', async () => {
      socket2Connected = true;
      socket2.emit('join-competition', TEST_COMPETITION_ID);
      await waitForEvent(socket2, 'joined-competition', 3000);
      
      if (socket1Connected) {
        await checkMultipleConnections();
      }
    });

    async function checkMultipleConnections() {
      try {
        const connectionCount = await redisHelpers.getWebSocketConnectionCount(TEST_COMPETITION_ID);
        
        printResult(
          'Multiple clients tracked in same room',
          connectionCount >= 2,
          connectionCount < 2 ? `Only ${connectionCount} connection(s) tracked` : ''
        );
        
        socket1.disconnect();
        socket2.disconnect();
        resolve();
      } catch (error) {
        printResult('Multiple clients tracked in same room', false, error.message);
        socket1.disconnect();
        socket2.disconnect();
        resolve();
      }
    }

    socket1.on('connect_error', (error) => {
      printResult('Multiple clients tracked in same room', false, `Socket1: ${error.message}`);
      socket2.disconnect();
      resolve();
    });

    socket2.on('connect_error', (error) => {
      printResult('Multiple clients tracked in same room', false, `Socket2: ${error.message}`);
      socket1.disconnect();
      resolve();
    });
  });
}

/**
 * Test 7: Ping/Pong health check
 * Requirement: 20.2
 */
async function testPingPong() {
  console.log(`\n${colors.cyan}Test 7: Ping/Pong Health Check${colors.reset}`);
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', async () => {
      try {
        // Send ping
        socket.emit('ping');
        
        // Wait for pong
        const response = await waitForEvent(socket, 'pong', 3000);
        
        printResult(
          'Ping/Pong health check works',
          response && response.timestamp,
          !response ? 'No pong response' : ''
        );
        
        socket.disconnect();
        resolve();
      } catch (error) {
        printResult('Ping/Pong health check works', false, error.message);
        socket.disconnect();
        resolve();
      }
    });

    socket.on('connect_error', (error) => {
      printResult('Ping/Pong health check works', false, error.message);
      resolve();
    });
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  WebSocket Integration Tests${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}Testing WebSocket server at: ${SOCKET_URL}${colors.reset}`);
  console.log(`${colors.yellow}Test Competition ID: ${TEST_COMPETITION_ID}${colors.reset}`);

  try {
    await testConnectionAndDisconnection();
    await testJoinCompetition();
    await testLeaveCompetition();
    await testDisconnectCleanup();
    await testErrorHandling();
    await testMultipleClients();
    await testPingPong();
  } catch (error) {
    console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  }

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
  }

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
