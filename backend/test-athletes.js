// backend/test-athletes.js
// Integration tests for Athlete Management API
// Requirements: 2.2, 2.4

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let testAthleteId = null;
let testCompetitionId = null;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}🧪 Test: ${testName}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'yellow');
}

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test 1: Setup - Login as admin
async function testLogin() {
  logTest('Admin Login');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (response.data && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      logSuccess('Admin login successful');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login response missing token');
      logInfo(`Response structure: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 2: Create a test competition (needed for athlete-competition relationship tests)
async function testCreateCompetition() {
  logTest('Create Test Competition');
  
  try {
    const response = await authRequest('post', '/competitions', {
      name: '测试比赛 - 选手管理',
      competition_type: 'individual',
      region: '测试赛区',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    testCompetitionId = response.data.data.competition.id;
    logSuccess(`Competition created with ID: ${testCompetitionId}`);
    logInfo(`Competition: ${response.data.data.competition.name}`);
    return true;
  } catch (error) {
    logError(`Competition creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 3: Create athlete
async function testCreateAthlete() {
  logTest('Create Athlete');
  
  try {
    const response = await authRequest('post', '/athletes', {
      name: '张三',
      athlete_number: 'A001',
      team_name: '测试队伍',
      contact_email: 'zhangsan@example.com',
      contact_phone: '13800138000'
    });
    
    testAthleteId = response.data.data.athlete.id;
    logSuccess(`Athlete created with ID: ${testAthleteId}`);
    logInfo(`Name: ${response.data.data.athlete.name}`);
    logInfo(`Number: ${response.data.data.athlete.athlete_number}`);
    return true;
  } catch (error) {
    logError(`Athlete creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 4: Create athlete without optional fields
async function testCreateAthleteMinimal() {
  logTest('Create Athlete (Minimal Fields)');
  
  try {
    const response = await authRequest('post', '/athletes', {
      name: '李四'
    });
    
    logSuccess(`Athlete created with ID: ${response.data.data.athlete.id}`);
    logInfo(`Name: ${response.data.data.athlete.name}`);
    logInfo(`Athlete number: ${response.data.data.athlete.athlete_number || 'null'}`);
    return true;
  } catch (error) {
    logError(`Athlete creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 5: Create athlete with duplicate athlete_number (should fail)
async function testCreateDuplicateAthleteNumber() {
  logTest('Create Athlete with Duplicate Number (Should Fail)');
  
  try {
    await authRequest('post', '/athletes', {
      name: '王五',
      athlete_number: 'A001' // Same as first athlete
    });
    
    logError('Test failed: Duplicate athlete number was accepted');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      logSuccess('Duplicate athlete number correctly rejected');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Test 6: Get all athletes
async function testGetAllAthletes() {
  logTest('Get All Athletes');
  
  try {
    const response = await authRequest('get', '/athletes');
    
    logSuccess(`Retrieved ${response.data.data.count} athletes`);
    logInfo(`Athletes: ${response.data.data.athletes.map(a => a.name).join(', ')}`);
    return true;
  } catch (error) {
    logError(`Get athletes failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Get athlete by ID
async function testGetAthleteById() {
  logTest('Get Athlete by ID');
  
  try {
    const response = await authRequest('get', `/athletes/${testAthleteId}`);
    
    logSuccess(`Retrieved athlete: ${response.data.data.athlete.name}`);
    logInfo(`ID: ${response.data.data.athlete.id}`);
    logInfo(`Number: ${response.data.data.athlete.athlete_number}`);
    logInfo(`Team: ${response.data.data.athlete.team_name || 'N/A'}`);
    return true;
  } catch (error) {
    logError(`Get athlete failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 8: Search athletes by name
async function testSearchAthletesByName() {
  logTest('Search Athletes by Name');
  
  try {
    const response = await authRequest('get', '/athletes/search?q=张');
    
    logSuccess(`Found ${response.data.data.count} athletes matching "张"`);
    logInfo(`Results: ${response.data.data.athletes.map(a => a.name).join(', ')}`);
    return true;
  } catch (error) {
    logError(`Search failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 9: Search athletes by athlete_number
async function testSearchAthletesByNumber() {
  logTest('Search Athletes by Number');
  
  try {
    const response = await authRequest('get', '/athletes/search?q=A001');
    
    logSuccess(`Found ${response.data.data.count} athletes matching "A001"`);
    if (response.data.data.count > 0) {
      logInfo(`Result: ${response.data.data.athletes[0].name} (${response.data.data.athletes[0].athlete_number})`);
    }
    return true;
  } catch (error) {
    logError(`Search failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 10: Filter athletes by competition
async function testFilterAthletesByCompetition() {
  logTest('Filter Athletes by Competition');
  
  try {
    // First, add athlete to competition
    await authRequest('post', `/competitions/${testCompetitionId}/athletes`, {
      athlete_id: testAthleteId
    });
    logInfo('Athlete added to competition');
    
    // Now filter athletes by competition
    const response = await authRequest('get', `/athletes?competition_id=${testCompetitionId}`);
    
    logSuccess(`Found ${response.data.data.count} athletes in competition ${testCompetitionId}`);
    logInfo(`Athletes: ${response.data.data.athletes.map(a => a.name).join(', ')}`);
    return true;
  } catch (error) {
    logError(`Filter failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 11: Get athlete with competitions
async function testGetAthleteCompetitions() {
  logTest('Get Athlete with Competitions');
  
  try {
    const response = await authRequest('get', `/athletes/${testAthleteId}/competitions`);
    
    logSuccess(`Athlete ${response.data.data.athlete.name} is in ${response.data.data.competition_count} competition(s)`);
    if (response.data.data.competitions.length > 0) {
      response.data.data.competitions.forEach(comp => {
        logInfo(`- ${comp.name} (${comp.competition_type}, ${comp.region})`);
      });
    }
    return true;
  } catch (error) {
    logError(`Get athlete competitions failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 12: Update athlete
async function testUpdateAthlete() {
  logTest('Update Athlete');
  
  try {
    const response = await authRequest('put', `/athletes/${testAthleteId}`, {
      name: '张三（更新）',
      team_name: '新队伍',
      contact_phone: '13900139000'
    });
    
    logSuccess('Athlete updated successfully');
    logInfo(`New name: ${response.data.data.athlete.name}`);
    logInfo(`New team: ${response.data.data.athlete.team_name}`);
    logInfo(`New phone: ${response.data.data.athlete.contact_phone}`);
    return true;
  } catch (error) {
    logError(`Update failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 13: Update athlete with duplicate athlete_number (should fail)
async function testUpdateAthleteWithDuplicateNumber() {
  logTest('Update Athlete with Duplicate Number (Should Fail)');
  
  try {
    // Create another athlete first
    const createResponse = await authRequest('post', '/athletes', {
      name: '赵六',
      athlete_number: 'A002'
    });
    const newAthleteId = createResponse.data.data.athlete.id;
    
    // Try to update with existing number
    await authRequest('put', `/athletes/${newAthleteId}`, {
      athlete_number: 'A001' // Already exists
    });
    
    logError('Test failed: Duplicate athlete number was accepted');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      logSuccess('Duplicate athlete number correctly rejected during update');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Test 14: Delete athlete
async function testDeleteAthlete() {
  logTest('Delete Athlete');
  
  try {
    // Create a temporary athlete to delete
    const createResponse = await authRequest('post', '/athletes', {
      name: '临时选手',
      athlete_number: 'TEMP001'
    });
    const tempAthleteId = createResponse.data.data.athlete.id;
    
    // Delete the athlete
    const response = await authRequest('delete', `/athletes/${tempAthleteId}`);
    
    logSuccess('Athlete deleted successfully');
    logInfo(`Message: ${response.data.message}`);
    
    // Verify deletion
    try {
      await authRequest('get', `/athletes/${tempAthleteId}`);
      logError('Test failed: Deleted athlete still exists');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Deletion verified: Athlete not found');
        return true;
      }
    }
  } catch (error) {
    logError(`Delete failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 15: Get non-existent athlete (should fail)
async function testGetNonExistentAthlete() {
  logTest('Get Non-Existent Athlete (Should Fail)');
  
  try {
    await authRequest('get', '/athletes/99999');
    
    logError('Test failed: Non-existent athlete was found');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      logSuccess('Non-existent athlete correctly returned 404');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Test 16: Search with empty query (should fail)
async function testSearchWithEmptyQuery() {
  logTest('Search with Empty Query (Should Fail)');
  
  try {
    await authRequest('get', '/athletes/search?q=');
    
    logError('Test failed: Empty search query was accepted');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Empty search query correctly rejected');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Athlete Management API Integration Tests              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');
  
  const tests = [
    { name: 'Admin Login', fn: testLogin },
    { name: 'Create Test Competition', fn: testCreateCompetition },
    { name: 'Create Athlete', fn: testCreateAthlete },
    { name: 'Create Athlete (Minimal)', fn: testCreateAthleteMinimal },
    { name: 'Create Duplicate Athlete Number', fn: testCreateDuplicateAthleteNumber },
    { name: 'Get All Athletes', fn: testGetAllAthletes },
    { name: 'Get Athlete by ID', fn: testGetAthleteById },
    { name: 'Search Athletes by Name', fn: testSearchAthletesByName },
    { name: 'Search Athletes by Number', fn: testSearchAthletesByNumber },
    { name: 'Filter Athletes by Competition', fn: testFilterAthletesByCompetition },
    { name: 'Get Athlete Competitions', fn: testGetAthleteCompetitions },
    { name: 'Update Athlete', fn: testUpdateAthlete },
    { name: 'Update with Duplicate Number', fn: testUpdateAthleteWithDuplicateNumber },
    { name: 'Delete Athlete', fn: testDeleteAthlete },
    { name: 'Get Non-Existent Athlete', fn: testGetNonExistentAthlete },
    { name: 'Search with Empty Query', fn: testSearchWithEmptyQuery }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      Test Summary                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');
  log(`Total Tests: ${tests.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, 'red');
  log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`, 'yellow');
  console.log('\n');
  
  if (failed === 0) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'red');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  logError(`Test runner error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
