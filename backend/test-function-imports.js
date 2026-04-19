// Test script to check individual function imports
require('dotenv').config();

console.log('Testing individual function imports...');

try {
  // Test controller imports
  console.log('1. Testing controller imports...');
  const {
    getAvailableJudges,
    selectJudgeIdentity,
    getCurrentSession,
    endJudgeSession,
    switchJudgeIdentity,
    getAllJudges,
    createJudge,
    updateJudge,
    deleteJudge,
    toggleJudgeActive,
    getJudgeStats
  } = require('./controllers/judges.controller');

  console.log('Controller functions:');
  console.log('- getAvailableJudges:', typeof getAvailableJudges);
  console.log('- selectJudgeIdentity:', typeof selectJudgeIdentity);
  console.log('- getCurrentSession:', typeof getCurrentSession);
  console.log('- endJudgeSession:', typeof endJudgeSession);
  console.log('- switchJudgeIdentity:', typeof switchJudgeIdentity);
  console.log('- getAllJudges:', typeof getAllJudges);
  console.log('- createJudge:', typeof createJudge);
  console.log('- updateJudge:', typeof updateJudge);
  console.log('- deleteJudge:', typeof deleteJudge);
  console.log('- toggleJudgeActive:', typeof toggleJudgeActive);
  console.log('- getJudgeStats:', typeof getJudgeStats);

  // Test middleware imports
  console.log('\n2. Testing middleware imports...');
  const { authenticateToken, requireRole } = require('./middleware/auth');
  console.log('Middleware functions:');
  console.log('- authenticateToken:', typeof authenticateToken);
  console.log('- requireRole:', typeof requireRole);

  console.log('\n✅ All imports successful!');

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
}