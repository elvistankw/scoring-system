// Update challenge competition status to active
require('dotenv').config();
const db = require('./db');

async function updateStatus() {
  try {
    console.log('🔄 Updating competition 45 status to active...\n');

    const result = await db.query(
      'UPDATE competitions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['active', 45]
    );

    if (result.rows.length > 0) {
      const competition = result.rows[0];
      console.log('✅ Competition updated successfully!\n');
      console.log('📋 Updated Competition:');
      console.log(`   ID: ${competition.id}`);
      console.log(`   Name: ${competition.name}`);
      console.log(`   Type: ${competition.competition_type}`);
      console.log(`   Region: ${competition.region}`);
      console.log(`   Status: ${competition.status} ✅`);
      console.log(`   Start Date: ${competition.start_date}`);
      console.log(`   End Date: ${competition.end_date}`);
      console.log(`   Updated At: ${competition.updated_at}`);
    } else {
      console.log('⚠️  Competition not found');
    }

    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    process.exit(1);
  }
}

updateStatus();
