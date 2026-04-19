const db = require('./db');

(async () => {
  try {
    const result = await db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'scores' 
      AND column_name IN ('submitted_at', 'updated_at') 
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ Scores table timestamp columns:');
    console.table(result.rows);
    
    // Check if updated_at exists
    const hasUpdatedAt = result.rows.some(row => row.column_name === 'updated_at');
    if (hasUpdatedAt) {
      console.log('\n✅ updated_at column exists in scores table');
    } else {
      console.log('\n❌ updated_at column NOT found in scores table');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
