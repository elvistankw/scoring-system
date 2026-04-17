// Comprehensive diagnostic script for division update issue
// Run with: node diagnose-division-issue.js

const http = require('http');
const { Client } = require('pg');

console.log('🔍 Starting Division Update Diagnostics...\n');
console.log('=' .repeat(60));

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const results = {
  backendRunning: false,
  databaseConnected: false,
  divisionColumnExists: false,
  testCompetitionExists: false,
  canUpdateDivision: false
};

// Test 1: Check if backend is running
async function checkBackend() {
  console.log('\n📡 Test 1: Checking if backend is running...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/competitions',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      console.log('   ✅ Backend is RUNNING on port 5000');
      console.log(`   Status Code: ${res.statusCode}`);
      results.backendRunning = true;
      resolve(true);
    });

    req.on('error', (error) => {
      console.log('   ❌ Backend is NOT running');
      console.log(`   Error: ${error.message}`);
      console.log('   💡 Start backend with: node backend/index.js');
      results.backendRunning = false;
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('   ⏱️  Backend request timed out');
      req.destroy();
      results.backendRunning = false;
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Check database connection
async function checkDatabase() {
  console.log('\n🗄️  Test 2: Checking database connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('   ✅ Database connection successful');
    results.databaseConnected = true;
    return client;
  } catch (error) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    results.databaseConnected = false;
    return null;
  }
}

// Test 3: Check if division column exists
async function checkDivisionColumn(client) {
  console.log('\n📋 Test 3: Checking if division column exists...');
  
  if (!client) {
    console.log('   ⏭️  Skipped (no database connection)');
    return false;
  }

  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'competitions' AND column_name = 'division'
    `);

    if (result.rows.length > 0) {
      console.log('   ✅ Division column EXISTS');
      console.log(`   Type: ${result.rows[0].data_type}`);
      console.log(`   Nullable: ${result.rows[0].is_nullable}`);
      results.divisionColumnExists = true;
      return true;
    } else {
      console.log('   ❌ Division column DOES NOT EXIST');
      console.log('   💡 Run this SQL in Supabase:');
      console.log('   ALTER TABLE competitions ADD COLUMN division VARCHAR(50) NOT NULL CHECK (division IN (\'小学组\', \'公开组\'));');
      results.divisionColumnExists = false;
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error checking column');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Check if test competition exists
async function checkTestCompetition(client) {
  console.log('\n🏆 Test 4: Checking for test competition...');
  
  if (!client) {
    console.log('   ⏭️  Skipped (no database connection)');
    return null;
  }

  try {
    const result = await client.query(`
      SELECT id, name, division, status
      FROM competitions
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const comp = result.rows[0];
      console.log('   ✅ Found competition:');
      console.log(`   ID: ${comp.id}`);
      console.log(`   Name: ${comp.name}`);
      console.log(`   Division: ${comp.division || '(null)'}`);
      console.log(`   Status: ${comp.status}`);
      results.testCompetitionExists = true;
      return comp.id;
    } else {
      console.log('   ⚠️  No competitions found in database');
      console.log('   💡 Create a competition first through the admin dashboard');
      results.testCompetitionExists = false;
      return null;
    }
  } catch (error) {
    console.log('   ❌ Error querying competitions');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

// Test 5: Try to update division
async function testDivisionUpdate(client, competitionId) {
  console.log('\n✏️  Test 5: Testing division update...');
  
  if (!client || !competitionId) {
    console.log('   ⏭️  Skipped (no database connection or competition)');
    return false;
  }

  try {
    // Try to update division
    const updateResult = await client.query(`
      UPDATE competitions 
      SET division = '小学组', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, division, updated_at
    `, [competitionId]);

    if (updateResult.rows.length > 0) {
      const updated = updateResult.rows[0];
      console.log('   ✅ Division update SUCCESSFUL');
      console.log(`   ID: ${updated.id}`);
      console.log(`   Name: ${updated.name}`);
      console.log(`   New Division: ${updated.division}`);
      console.log(`   Updated At: ${updated.updated_at}`);
      results.canUpdateDivision = true;
      
      // Revert back to original
      await client.query(`
        UPDATE competitions 
        SET division = '公开组'
        WHERE id = $1
      `, [competitionId]);
      console.log('   ℹ️  Reverted division back to 公开组');
      
      return true;
    } else {
      console.log('   ❌ Update returned no rows');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Division update FAILED');
    console.log(`   Error: ${error.message}`);
    results.canUpdateDivision = false;
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  try {
    // Run all tests
    await checkBackend();
    const client = await checkDatabase();
    await checkDivisionColumn(client);
    const competitionId = await checkTestCompetition(client);
    await testDivisionUpdate(client, competitionId);

    // Close database connection
    if (client) {
      await client.end();
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Backend Running:        ${results.backendRunning ? '✅ YES' : '❌ NO'}`);
    console.log(`Database Connected:     ${results.databaseConnected ? '✅ YES' : '❌ NO'}`);
    console.log(`Division Column Exists: ${results.divisionColumnExists ? '✅ YES' : '❌ NO'}`);
    console.log(`Test Competition Found: ${results.testCompetitionExists ? '✅ YES' : '❌ NO'}`);
    console.log(`Can Update Division:    ${results.canUpdateDivision ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(60));

    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!results.backendRunning) {
      console.log('   1. START THE BACKEND: node backend/index.js');
    }
    
    if (!results.databaseConnected) {
      console.log('   2. CHECK DATABASE_URL in backend/.env');
    }
    
    if (!results.divisionColumnExists) {
      console.log('   3. ADD DIVISION COLUMN: Run supabase-fix-division.sql in Supabase SQL Editor');
    }
    
    if (!results.testCompetitionExists) {
      console.log('   4. CREATE A TEST COMPETITION through the admin dashboard');
    }
    
    if (results.backendRunning && results.databaseConnected && results.divisionColumnExists && results.canUpdateDivision) {
      console.log('   ✅ All systems operational!');
      console.log('   ✅ Division update should work from the frontend');
      console.log('\n   Next steps:');
      console.log('   1. Open browser console (F12)');
      console.log('   2. Go to admin dashboard and edit a competition');
      console.log('   3. Change the division and save');
      console.log('   4. Check backend console for debug logs');
    }

    console.log('\n📖 For detailed troubleshooting, see: DIVISION_UPDATE_TROUBLESHOOTING.md');
    
  } catch (error) {
    console.error('\n❌ Diagnostic script error:', error);
  }
}

// Run diagnostics
runDiagnostics();
