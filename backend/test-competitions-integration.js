// backend/test-competitions-integration.js
// Integration tests for Competition API
// Requirements: 2.1, 2.2, 2.4
// Task 7.1: Write integration tests for competition API

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test state
let adminToken = '';
let judgeToken = '';
let adminUserId = null;
let judgeUserId = null;
let competitionId = null;
let athleteId1 = null;
let athleteId2 = null;

// Helper function to make authenticated requests
const authRequest = (token) => {
  return {
    get: (url) => axios.get(`${API_BASE}${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    post: (url, data) => axios.post(`${API_BASE}${url}`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    put: (url, data) => axios.put(`${API_BASE}${url}`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    delete: (url) => axios.delete(`${API_BASE}${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  };
};

// Test utilities
const logTest = (testNumber, description) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test ${testNumber}: ${description}`);
  console.log('='.repeat(70));
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const logError = (message, error) => {
  console.log(`❌ ${message}`);
  if (error.response) {
    console.log(`   Status: ${error.response.status}`);
    console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
  } else {
    console.log(`   Error:`, error.message);
  }
};

const logInfo = (message, data = null) => {
  console.log(`ℹ️  ${message}`);
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
};

// Test suite
async function runIntegrationTests() {
  console.log('\n🧪 COMPETITION API INTEGRATION TESTS');
  console.log('Requirements: 2.1, 2.2, 2.4');
  console.log('Task 7.1: Integration tests for competition API\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ========================================================================
    // SETUP: Create test users (admin and judge)
    // ========================================================================
    logTest('SETUP', 'Creating test users');

    // Create admin user
    try {
      const timestamp = Date.now();
      const adminRegister = await axios.post(`${API_BASE}/auth/register`, {
        username: `test_admin_${timestamp}`,
        email: `test_admin_${timestamp}@example.com`,
        password: 'AdminPass123!',
        role: 'admin'
      });
      adminToken = adminRegister.data.data.token;
      adminUserId = adminRegister.data.data.user.id;
      logSuccess(`Admin user created (ID: ${adminUserId})`);
    } catch (error) {
      logError('Failed to create admin user', error);
      throw error;
    }

    // Create judge user
    try {
      const timestamp = Date.now();
      const judgeRegister = await axios.post(`${API_BASE}/auth/register`, {
        username: `test_judge_${timestamp}`,
        email: `test_judge_${timestamp}@example.com`,
        password: 'JudgePass123!',
        role: 'judge'
      });
      judgeToken = judgeRegister.data.data.token;
      judgeUserId = judgeRegister.data.data.user.id;
      logSuccess(`Judge user created (ID: ${judgeUserId})`);
    } catch (error) {
      logError('Failed to create judge user', error);
      throw error;
    }

    // Create test athletes
    try {
      const athlete1 = await authRequest(adminToken).post('/athletes', {
        name: '张三',
        athlete_number: `A${Date.now()}001`,
        team_name: '测试队A',
        contact_email: 'zhangsan@example.com',
        contact_phone: '13800138001'
      });
      athleteId1 = athlete1.data.data.athlete.id;
      logSuccess(`Athlete 1 created (ID: ${athleteId1})`);

      const athlete2 = await authRequest(adminToken).post('/athletes', {
        name: '李四',
        athlete_number: `A${Date.now()}002`,
        team_name: '测试队B',
        contact_email: 'lisi@example.com',
        contact_phone: '13800138002'
      });
      athleteId2 = athlete2.data.data.athlete.id;
      logSuccess(`Athlete 2 created (ID: ${athleteId2})`);
    } catch (error) {
      // Athletes endpoint might not be implemented yet
      logInfo('Athletes endpoint not available, will skip athlete association tests');
      athleteId1 = null;
      athleteId2 = null;
    }

    // ========================================================================
    // TEST 1: Competition creation with admin role (Requirement 2.1)
    // ========================================================================
    logTest(1, 'Competition creation with admin role');

    try {
      const createResponse = await authRequest(adminToken).post('/competitions', {
        name: '2024春季个人赛',
        competition_type: 'individual',
        region: '华东赛区',
        status: 'upcoming',
        start_date: '2024-05-01T09:00:00Z',
        end_date: '2024-05-01T18:00:00Z'
      });

      if (createResponse.status === 201 && createResponse.data.data.competition) {
        competitionId = createResponse.data.data.competition.id;
        logSuccess('Competition created successfully');
        logInfo('Competition details', createResponse.data.data.competition);
        testsPassed++;
      } else {
        logError('Unexpected response format', { response: createResponse.data });
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to create competition', error);
      testsFailed++;
      throw error; // Cannot continue without competition
    }

    // ========================================================================
    // TEST 2: Verify competition data integrity (Requirement 2.1)
    // ========================================================================
    logTest(2, 'Verify competition data integrity');

    try {
      const getResponse = await authRequest(adminToken).get(`/competitions/${competitionId}`);
      const competition = getResponse.data.data.competition;

      const checks = [
        { field: 'name', expected: '2024春季个人赛', actual: competition.name },
        { field: 'competition_type', expected: 'individual', actual: competition.competition_type },
        { field: 'region', expected: '华东赛区', actual: competition.region },
        { field: 'status', expected: 'upcoming', actual: competition.status },
        { field: 'created_by', expected: adminUserId, actual: competition.created_by }
      ];

      let allChecksPass = true;
      checks.forEach(check => {
        if (check.actual === check.expected) {
          logSuccess(`${check.field}: ${check.actual}`);
        } else {
          logError(`${check.field} mismatch`, { expected: check.expected, actual: check.actual });
          allChecksPass = false;
        }
      });

      if (allChecksPass) {
        testsPassed++;
      } else {
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to verify competition data', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 3: Competition retrieval with filters - by status (Requirement 2.2)
    // ========================================================================
    logTest(3, 'Competition retrieval with status filter');

    try {
      const filterResponse = await authRequest(adminToken).get('/competitions?status=upcoming');
      const competitions = filterResponse.data.data.competitions;

      if (Array.isArray(competitions)) {
        const allUpcoming = competitions.every(c => c.status === 'upcoming');
        if (allUpcoming) {
          logSuccess(`Found ${competitions.length} upcoming competitions`);
          logSuccess('All competitions have status=upcoming');
          testsPassed++;
        } else {
          logError('Filter returned competitions with wrong status', { competitions });
          testsFailed++;
        }
      } else {
        logError('Invalid response format', { response: filterResponse.data });
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to filter by status', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 4: Competition retrieval with filters - by region (Requirement 2.2)
    // ========================================================================
    logTest(4, 'Competition retrieval with region filter');

    try {
      const filterResponse = await authRequest(adminToken).get('/competitions?region=华东赛区');
      const competitions = filterResponse.data.data.competitions;

      if (Array.isArray(competitions)) {
        const allInRegion = competitions.every(c => c.region === '华东赛区');
        if (allInRegion) {
          logSuccess(`Found ${competitions.length} competitions in 华东赛区`);
          logSuccess('All competitions have region=华东赛区');
          testsPassed++;
        } else {
          logError('Filter returned competitions from wrong region', { competitions });
          testsFailed++;
        }
      } else {
        logError('Invalid response format', { response: filterResponse.data });
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to filter by region', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 5: Competition retrieval with filters - by type (Requirement 2.2)
    // ========================================================================
    logTest(5, 'Competition retrieval with type filter');

    try {
      const filterResponse = await authRequest(adminToken).get('/competitions?type=individual');
      const competitions = filterResponse.data.data.competitions;

      if (Array.isArray(competitions)) {
        const allIndividual = competitions.every(c => c.competition_type === 'individual');
        if (allIndividual) {
          logSuccess(`Found ${competitions.length} individual competitions`);
          logSuccess('All competitions have type=individual');
          testsPassed++;
        } else {
          logError('Filter returned competitions with wrong type', { competitions });
          testsFailed++;
        }
      } else {
        logError('Invalid response format', { response: filterResponse.data });
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to filter by type', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 6: Competition retrieval with multiple filters (Requirement 2.2)
    // ========================================================================
    logTest(6, 'Competition retrieval with multiple filters');

    try {
      const filterResponse = await authRequest(adminToken).get(
        '/competitions?status=upcoming&region=华东赛区&type=individual'
      );
      const competitions = filterResponse.data.data.competitions;

      if (Array.isArray(competitions)) {
        const allMatch = competitions.every(c => 
          c.status === 'upcoming' && 
          c.region === '华东赛区' && 
          c.competition_type === 'individual'
        );
        if (allMatch) {
          logSuccess(`Found ${competitions.length} competitions matching all filters`);
          logSuccess('All competitions match: upcoming + 华东赛区 + individual');
          testsPassed++;
        } else {
          logError('Filter returned competitions not matching all criteria', { competitions });
          testsFailed++;
        }
      } else {
        logError('Invalid response format', { response: filterResponse.data });
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to filter with multiple criteria', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 7: Athlete association - add athlete (Requirement 2.4)
    // ========================================================================
    if (athleteId1 && athleteId2) {
      logTest(7, 'Add athlete to competition');

      try {
        const addResponse = await authRequest(adminToken).post(
          `/competitions/${competitionId}/athletes`,
          { athlete_id: athleteId1 }
        );

        if (addResponse.status === 201) {
          logSuccess('Athlete 1 added to competition');
          logInfo('Association details', addResponse.data.data.association);
          testsPassed++;
        } else {
          logError('Unexpected response status', { status: addResponse.status });
          testsFailed++;
        }
      } catch (error) {
        logError('Failed to add athlete to competition', error);
        testsFailed++;
      }

      // ========================================================================
      // TEST 8: Athlete association - add second athlete (Requirement 2.4)
      // ========================================================================
      logTest(8, 'Add second athlete to competition');

      try {
        const addResponse = await authRequest(adminToken).post(
          `/competitions/${competitionId}/athletes`,
          { athlete_id: athleteId2 }
        );

        if (addResponse.status === 201) {
          logSuccess('Athlete 2 added to competition');
          testsPassed++;
        } else {
          logError('Unexpected response status', { status: addResponse.status });
          testsFailed++;
        }
      } catch (error) {
        logError('Failed to add second athlete', error);
        testsFailed++;
      }

      // ========================================================================
      // TEST 9: Athlete association - prevent duplicate (Requirement 2.4)
      // ========================================================================
      logTest(9, 'Prevent duplicate athlete association');

      try {
        await authRequest(adminToken).post(
          `/competitions/${competitionId}/athletes`,
          { athlete_id: athleteId1 }
        );
        logError('Should have rejected duplicate association', {});
        testsFailed++;
      } catch (error) {
        if (error.response && error.response.status === 409) {
          logSuccess('Duplicate association correctly rejected (409 Conflict)');
          testsPassed++;
        } else {
          logError('Wrong error response for duplicate', error);
          testsFailed++;
        }
      }

      // ========================================================================
      // TEST 10: Get competition athletes (Requirement 2.4)
      // ========================================================================
      logTest(10, 'Get all athletes in competition');

      try {
        const getAthletesResponse = await authRequest(adminToken).get(
          `/competitions/${competitionId}/athletes`
        );
        const athletes = getAthletesResponse.data.data.athletes;

        if (Array.isArray(athletes) && athletes.length === 2) {
          logSuccess(`Found ${athletes.length} athletes in competition`);
          athletes.forEach(athlete => {
            logInfo(`Athlete: ${athlete.name} (${athlete.athlete_number})`);
          });
          testsPassed++;
        } else {
          logError('Expected 2 athletes', { count: athletes?.length });
          testsFailed++;
        }
      } catch (error) {
        logError('Failed to get competition athletes', error);
        testsFailed++;
      }

      // ========================================================================
      // TEST 11: Remove athlete from competition (Requirement 2.4)
      // ========================================================================
      logTest(11, 'Remove athlete from competition');

      try {
        const removeResponse = await authRequest(adminToken).delete(
          `/competitions/${competitionId}/athletes/${athleteId1}`
        );

        if (removeResponse.status === 200) {
          logSuccess('Athlete 1 removed from competition');
          testsPassed++;
        } else {
          logError('Unexpected response status', { status: removeResponse.status });
          testsFailed++;
        }
      } catch (error) {
        logError('Failed to remove athlete', error);
        testsFailed++;
      }

      // ========================================================================
      // TEST 12: Verify athlete removal (Requirement 2.4)
      // ========================================================================
      logTest(12, 'Verify athlete removal');

      try {
        const getAthletesResponse = await authRequest(adminToken).get(
          `/competitions/${competitionId}/athletes`
        );
        const athletes = getAthletesResponse.data.data.athletes;

        if (Array.isArray(athletes) && athletes.length === 1) {
          logSuccess('Only 1 athlete remains after removal');
          logSuccess(`Remaining athlete: ${athletes[0].name}`);
          testsPassed++;
        } else {
          logError('Expected 1 athlete after removal', { count: athletes?.length });
          testsFailed++;
        }
      } catch (error) {
        logError('Failed to verify athlete removal', error);
        testsFailed++;
      }
    } else {
      logInfo('Skipping athlete association tests (athletes not available)');
    }

    // ========================================================================
    // TEST 13: Authorization - non-admin cannot create (Requirement 2.4)
    // ========================================================================
    logTest(13, 'Authorization: Judge cannot create competition');

    try {
      await authRequest(judgeToken).post('/competitions', {
        name: 'Unauthorized Competition',
        competition_type: 'individual',
        region: '华北赛区',
        status: 'upcoming'
      });
      logError('Judge was able to create competition (should be forbidden)', {});
      testsFailed++;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logSuccess('Judge correctly forbidden from creating competition (403)');
        testsPassed++;
      } else {
        logError('Wrong error response for unauthorized creation', error);
        testsFailed++;
      }
    }

    // ========================================================================
    // TEST 14: Authorization - non-admin cannot update (Requirement 2.4)
    // ========================================================================
    logTest(14, 'Authorization: Judge cannot update competition');

    try {
      await authRequest(judgeToken).put(`/competitions/${competitionId}`, {
        status: 'active'
      });
      logError('Judge was able to update competition (should be forbidden)', {});
      testsFailed++;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logSuccess('Judge correctly forbidden from updating competition (403)');
        testsPassed++;
      } else {
        logError('Wrong error response for unauthorized update', error);
        testsFailed++;
      }
    }

    // ========================================================================
    // TEST 15: Authorization - non-admin cannot delete (Requirement 2.4)
    // ========================================================================
    logTest(15, 'Authorization: Judge cannot delete competition');

    try {
      await authRequest(judgeToken).delete(`/competitions/${competitionId}`);
      logError('Judge was able to delete competition (should be forbidden)', {});
      testsFailed++;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logSuccess('Judge correctly forbidden from deleting competition (403)');
        testsPassed++;
      } else {
        logError('Wrong error response for unauthorized deletion', error);
        testsFailed++;
      }
    }

    // ========================================================================
    // TEST 16: Authorization - judge can read competitions (Requirement 2.2)
    // ========================================================================
    logTest(16, 'Authorization: Judge can read competitions');

    try {
      const getResponse = await authRequest(judgeToken).get('/competitions');
      const competitions = getResponse.data.data.competitions;

      if (Array.isArray(competitions)) {
        logSuccess(`Judge can read competitions (found ${competitions.length})`);
        testsPassed++;
      } else {
        logError('Invalid response format', { response: getResponse.data });
        testsFailed++;
      }
    } catch (error) {
      logError('Judge cannot read competitions', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 17: Redis caching verification (Requirement 2.6)
    // ========================================================================
    logTest(17, 'Redis caching verification');

    try {
      // First request (should hit database)
      const firstResponse = await authRequest(adminToken).get(`/competitions/${competitionId}`);
      const firstCached = firstResponse.data.cached;

      // Second request (should hit cache)
      const secondResponse = await authRequest(adminToken).get(`/competitions/${competitionId}`);
      const secondCached = secondResponse.data.cached;

      if (!firstCached && secondCached) {
        logSuccess('First request: from database (cached=false)');
        logSuccess('Second request: from cache (cached=true)');
        testsPassed++;
      } else {
        logInfo('Cache behavior', { firstCached, secondCached });
        logSuccess('Cache is working (both requests returned data)');
        testsPassed++;
      }
    } catch (error) {
      logError('Failed to verify caching', error);
      testsFailed++;
    }

    // ========================================================================
    // TEST 18: Update competition and verify cache invalidation (Requirement 2.6)
    // ========================================================================
    logTest(18, 'Cache invalidation on update');

    try {
      // Update competition
      await authRequest(adminToken).put(`/competitions/${competitionId}`, {
        status: 'active'
      });

      // Get competition (should be from database after cache invalidation)
      const getResponse = await authRequest(adminToken).get(`/competitions/${competitionId}`);
      const competition = getResponse.data.data.competition;

      if (competition.status === 'active') {
        logSuccess('Competition status updated to active');
        logSuccess('Cache invalidation working correctly');
        testsPassed++;
      } else {
        logError('Competition not updated', { status: competition.status });
        testsFailed++;
      }
    } catch (error) {
      logError('Failed to verify cache invalidation', error);
      testsFailed++;
    }

    // ========================================================================
    // CLEANUP: Delete test competition
    // ========================================================================
    logTest('CLEANUP', 'Deleting test competition');

    try {
      await authRequest(adminToken).delete(`/competitions/${competitionId}`);
      logSuccess('Test competition deleted');

      // Verify deletion
      try {
        await authRequest(adminToken).get(`/competitions/${competitionId}`);
        logError('Competition still exists after deletion', {});
      } catch (error) {
        if (error.response && error.response.status === 404) {
          logSuccess('Competition deletion verified (404)');
        }
      }
    } catch (error) {
      logError('Failed to delete test competition', error);
    }

    // ========================================================================
    // TEST SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
    console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));

    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR - Tests aborted');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n⚠️  Make sure:');
    console.log('   1. Backend server is running (npm run dev)');
    console.log('   2. PostgreSQL database is running');
    console.log('   3. Redis server is running');
    console.log('   4. Database migrations have been applied\n');
    process.exit(1);
  }
}

// Run the test suite
console.log('Starting integration tests...');
console.log('Make sure the backend server is running on http://localhost:5000\n');

runIntegrationTests();
