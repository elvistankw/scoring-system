// backend/verify-indexes.js
// Script to verify all database indexes are created
// Requirements: 10.4, 10.5

const db = require('./db');

async function verifyIndexes() {
  console.log('🔍 Verifying database indexes...\n');
  
  try {
    // Query to get all indexes in the database
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const result = await db.query(query);
    
    // Expected indexes based on schema
    const expectedIndexes = {
      users: ['idx_users_email', 'idx_users_role', 'idx_users_username'],
      competitions: ['idx_competitions_type', 'idx_competitions_region', 'idx_competitions_status', 'idx_competitions_created_by', 'idx_competitions_start_date'],
      athletes: ['idx_athletes_number', 'idx_athletes_name', 'idx_athletes_team_name'],
      competition_athletes: ['idx_comp_athletes_comp', 'idx_comp_athletes_athlete', 'idx_comp_athletes_reg_date'],
      scores: ['idx_scores_competition', 'idx_scores_athlete', 'idx_scores_judge', 'idx_scores_submitted', 'idx_scores_comp_athlete']
    };
    
    // Group indexes by table
    const indexesByTable = {};
    result.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    // Verify each table has expected indexes
    let allIndexesPresent = true;
    
    for (const [tableName, expectedIndexList] of Object.entries(expectedIndexes)) {
      console.log(`📊 Table: ${tableName}`);
      
      const actualIndexes = indexesByTable[tableName] || [];
      
      for (const expectedIndex of expectedIndexList) {
        const isPresent = actualIndexes.includes(expectedIndex);
        const status = isPresent ? '✅' : '❌';
        console.log(`  ${status} ${expectedIndex}`);
        
        if (!isPresent) {
          allIndexesPresent = false;
        }
      }
      
      console.log('');
    }
    
    // Display all indexes found
    console.log('📋 All indexes in database:');
    for (const [tableName, indexes] of Object.entries(indexesByTable)) {
      console.log(`\n  ${tableName}:`);
      indexes.forEach(idx => {
        console.log(`    - ${idx}`);
      });
    }
    
    if (allIndexesPresent) {
      console.log('\n✅ All expected indexes are present!');
    } else {
      console.log('\n⚠️  Some indexes are missing. Run migrations to create them.');
    }
    
    return allIndexesPresent;
    
  } catch (err) {
    console.error('❌ Error verifying indexes:', err);
    throw err;
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyIndexes()
    .then(() => {
      console.log('\n✅ Index verification complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Index verification failed:', err);
      process.exit(1);
    });
}

module.exports = { verifyIndexes };
