// Comprehensive diagnostic for database update issue
// Run with: node diagnose-database-update.js

const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function diagnose() {
  console.log('🔍 Diagnosing Database Update Issue\n');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Connect to database
    console.log('\n📡 Step 1: Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    console.log(`   Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);

    // Check division column
    console.log('\n📋 Step 2: Checking division column...');
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'competitions' AND column_name = 'division'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Division column exists');
      console.log(`   Type: ${columnCheck.rows[0].data_type}`);
      console.log(`   Nullable: ${columnCheck.rows[0].is_nullable}`);
    } else {
      console.log('❌ Division column DOES NOT exist!');
      console.log('\n💡 Fix: Run this in Supabase SQL Editor:');
      console.log('   ALTER TABLE competitions ADD COLUMN division VARCHAR(50) NOT NULL CHECK (division IN (\'小学组\', \'公开组\'));');
      process.exit(1);
    }

    // Get a test competition
    console.log('\n🏆 Step 3: Getting test competition...');
    const compResult = await client.query(`
      SELECT id, name, division, status, updated_at
      FROM competitions
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (compResult.rows.length === 0) {
      console.log('❌ No competitions found');
      process.exit(1);
    }

    const testComp = compResult.rows[0];
    console.log('✅ Found competition:');
    console.log(`   ID: ${testComp.id}`);
    console.log(`   Name: ${testComp.name}`);
    console.log(`   Division: ${testComp.division || '(null)'}`);
    console.log(`   Updated At: ${testComp.updated_at}`);

    // Test update with exact same logic as controller
    const newDivision = testComp.division === '小学组' ? '公开组' : '小学组';
    console.log(`\n✏️  Step 4: Testing update to: ${newDivision}`);

    // Build query exactly like controller
    const updates = [];
    const params = [];
    let paramCount = 0;

    paramCount++;
    updates.push(`division = $${paramCount}`);
    params.push(newDivision);

    updates.push('updated_at = CURRENT_TIMESTAMP');

    paramCount++;
    params.push(testComp.id);

    const query = `UPDATE competitions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    console.log('   SQL Query:', query);
    console.log('   Parameters:', params);

    // Execute update
    console.log('\n⚡ Step 5: Executing update...');
    const updateResult = await client.query(query, params);

    if (updateResult.rowCount > 0) {
      console.log(`✅ Update executed (${updateResult.rowCount} row affected)`);
      console.log(`   Returned division: ${updateResult.rows[0].division}`);
      console.log(`   Returned updated_at: ${updateResult.rows[0].updated_at}`);
    } else {
      console.log('❌ Update executed but no rows affected');
    }

    // Verify in database
    console.log('\n🔍 Step 6: Verifying in database...');
    const verifyResult = await client.query(
      'SELECT id, name, division, updated_at FROM competitions WHERE id = $1',
      [testComp.id]
    );

    const verified = verifyResult.rows[0];
    console.log('Current state in database:');
    console.log(`   Division: ${verified.division}`);
    console.log(`   Updated At: ${verified.updated_at}`);

    // Check if update was successful
    if (verified.division === newDivision) {
      console.log('\n' + '='.repeat(60));
      console.log('✅✅✅ SUCCESS! Database update is working!');
      console.log('='.repeat(60));
      console.log('\n💡 If API returns success but database doesn\'t update:');
      console.log('   1. Check if backend is using the same DATABASE_URL');
      console.log('   2. Check if there are multiple database instances');
      console.log('   3. Check backend console logs for errors');
      console.log('   4. Clear Redis cache: node backend/clear-competition-cache.js');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌❌❌ FAILED! Database update did not work!');
      console.log('='.repeat(60));
      console.log(`   Expected: ${newDivision}`);
      console.log(`   Got: ${verified.division}`);
      console.log('\n💡 Possible issues:');
      console.log('   1. Database transaction not committing');
      console.log('   2. Database permissions issue');
      console.log('   3. CHECK constraint preventing update');
    }

    // Restore original value
    console.log('\n🔄 Step 7: Restoring original value...');
    await client.query(
      'UPDATE competitions SET division = $1 WHERE id = $2',
      [testComp.division || '小学组', testComp.id]
    );
    console.log('✅ Original value restored');

    // Additional checks
    console.log('\n📊 Step 8: Additional checks...');
    
    // Check for triggers
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'competitions'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log(`⚠️  Found ${triggerCheck.rows.length} trigger(s) on competitions table:`);
      triggerCheck.rows.forEach(t => {
        console.log(`   - ${t.trigger_name} (${t.event_manipulation})`);
      });
    } else {
      console.log('✅ No triggers on competitions table');
    }

    // Check for constraints
    const constraintCheck = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'competitions' AND constraint_type = 'CHECK'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log(`✅ Found ${constraintCheck.rows.length} CHECK constraint(s):`);
      constraintCheck.rows.forEach(c => {
        console.log(`   - ${c.constraint_name}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    if (error.hint) {
      console.error('   Hint:', error.hint);
    }
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

diagnose();
