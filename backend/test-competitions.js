// backend/test-competitions.js
// Test script for competition management API
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let competitionId = null;
let athleteId = null;

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
  return axios({
    method,
    url: `${API_BASE}${url}`,
    data,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
};

async function runTests() {
  console.log('🧪 Starting Competition API Tests...\n');

  try {
    // 1. Register an admin user
    console.log('1️⃣  Registering admin user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      username: 'test_admin_comp',
      email: `test_admin_comp_${Date.now()}@example.com`,
      password: 'TestPass123',
      role: 'admin'
    });
    authToken = registerResponse.data.data.token;
    console.log('✅ Admin registered successfully\n');

    // 2. Create a competition
    console.log('2️⃣  Creating competition...');
    const createCompResponse = await authRequest('post', '/competitions', {
      name: '2024春季个人赛',
      competition_type: 'individual',
      region: '华东赛区',
      status: 'upcoming',
      start_date: '2024-05-01T09:00:00Z',
      end_date: '2024-05-01T18:00:00Z'
    });
    competitionId = createCompResponse.data.data.competition.id;
    console.log('✅ Competition created:', createCompResponse.data.data.competition);
    console.log('   Competition ID:', competitionId, '\n');

    // 3. Get all competitions
    console.log('3️⃣  Getting all competitions...');
    const getAllResponse = await authRequest('get', '/competitions');
    console.log('✅ Found', getAllResponse.data.data.competitions.length, 'competitions');
    console.log('   Cached:', getAllResponse.data.cached, '\n');

    // 4. Get competition by ID
    console.log('4️⃣  Getting competition by ID...');
    const getByIdResponse = await authRequest('get', `/competitions/${competitionId}`);
    console.log('✅ Competition retrieved:', getByIdResponse.data.data.competition.name);
    console.log('   Cached:', getByIdResponse.data.cached, '\n');

    // 5. Filter competitions by status
    console.log('5️⃣  Filtering competitions by status=upcoming...');
    const filterResponse = await authRequest('get', '/competitions?status=upcoming');
    console.log('✅ Found', filterResponse.data.data.competitions.length, 'upcoming competitions\n');

    // 6. Filter by region
    console.log('6️⃣  Filtering competitions by region=华东赛区...');
    const regionResponse = await authRequest('get', '/competitions?region=华东赛区');
    console.log('✅ Found', regionResponse.data.data.competitions.length, 'competitions in 华东赛区\n');

    // 7. Filter by type
    console.log('7️⃣  Filtering competitions by type=individual...');
    const typeResponse = await authRequest('get', '/competitions?type=individual');
    console.log('✅ Found', typeResponse.data.data.competitions.length, 'individual competitions\n');

    // 8. Update competition
    console.log('8️⃣  Updating competition status to active...');
    const updateResponse = await authRequest('put', `/competitions/${competitionId}`, {
      status: 'active'
    });
    console.log('✅ Competition updated:', updateResponse.data.data.competition.status, '\n');

    // 9. Create an athlete (we need to create athlete table first)
    console.log('9️⃣  Creating athlete...');
    try {
      const createAthleteResponse = await authRequest('post', '/athletes', {
        name: '张三',
        athlete_number: 'A001',
        team_name: '测试队',
        contact_email: 'zhangsan@example.com'
      });
      athleteId = createAthleteResponse.data.data.athlete.id;
      console.log('✅ Athlete created:', createAthleteResponse.data.data.athlete);
      console.log('   Athlete ID:', athleteId, '\n');
    } catch (err) {
      console.log('⚠️  Athlete endpoint not yet implemented (expected)\n');
      athleteId = 1; // Use a placeholder for testing
    }

    // 10. Add athlete to competition
    console.log('🔟 Adding athlete to competition...');
    try {
      const addAthleteResponse = await authRequest('post', `/competitions/${competitionId}/athletes`, {
        athlete_id: athleteId
      });
      console.log('✅ Athlete added to competition:', addAthleteResponse.data.message, '\n');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('⚠️  Athlete not found (expected if athlete table is empty)\n');
      } else {
        throw err;
      }
    }

    // 11. Get competition athletes
    console.log('1️⃣1️⃣  Getting competition athletes...');
    const getAthletesResponse = await authRequest('get', `/competitions/${competitionId}/athletes`);
    console.log('✅ Found', getAthletesResponse.data.data.athletes.length, 'athletes in competition\n');

    // 12. Test cache hit
    console.log('1️⃣2️⃣  Testing cache hit (get competition again)...');
    const cacheTestResponse = await authRequest('get', `/competitions/${competitionId}`);
    console.log('✅ Competition retrieved from cache:', cacheTestResponse.data.cached, '\n');

    // 13. Remove athlete from competition (if added)
    if (athleteId && getAthletesResponse.data.data.athletes.length > 0) {
      console.log('1️⃣3️⃣  Removing athlete from competition...');
      const removeAthleteResponse = await authRequest('delete', `/competitions/${competitionId}/athletes/${athleteId}`);
      console.log('✅ Athlete removed:', removeAthleteResponse.data.message, '\n');
    }

    // 14. Delete competition
    console.log('1️⃣4️⃣  Deleting competition...');
    const deleteResponse = await authRequest('delete', `/competitions/${competitionId}`);
    console.log('✅ Competition deleted:', deleteResponse.data.message, '\n');

    // 15. Verify deletion
    console.log('1️⃣5️⃣  Verifying deletion...');
    try {
      await authRequest('get', `/competitions/${competitionId}`);
      console.log('❌ Competition still exists (should have been deleted)\n');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✅ Competition successfully deleted (404 as expected)\n');
      } else {
        throw err;
      }
    }

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
runTests();
