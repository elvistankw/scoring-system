// Run migration 009: Fix scores judge_id foreign key
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigration() {
  const client = await db.getClient();
  
  try {
    console.log('🔄 Running migration 009: Fix scores judge_id foreign key...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '009_fix_scores_judge_fk.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query('BEGIN');
    
    console.log('📝 Executing SQL:');
    console.log(migrationSQL);
    console.log('');

    await client.query(migrationSQL);
    
    await client.query('COMMIT');

    console.log('✅ Migration 009 completed successfully!');
    console.log('✅ scores.judge_id now references judges table');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

runMigration();
