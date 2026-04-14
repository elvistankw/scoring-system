const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'scoring',
  password: 'etkw1234',
  port: 5432
});

async function finalDateFix() {
  try {
    console.log('🔧 Final date fix for competitions 62 and 63\n');
    
    // Fix competition 62 to start on 2026-04-15
    const result62 = await pool.query(
      'UPDATE competitions SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING id, name, start_date',
      ['2026-04-15', '2026-04-16', 62]
    );
    
    if (result62.rows.length > 0) {
      const comp = result62.rows[0];
      console.log(`✅ Fixed ID 62: ${comp.name}`);
      console.log(`   Start date: ${comp.start_date.toISOString().split('T')[0]}`);
    }
    
    // Fix competition 63 to start on 2026-04-15
    const result63 = await pool.query(
      'UPDATE competitions SET start_date = $1, end_date = $2 WHERE id = $3 RETURNING id, name, start_date',
      ['2026-04-15', '2026-04-16', 63]
    );
    
    if (result63.rows.length > 0) {
      const comp = result63.rows[0];
      console.log(`✅ Fixed ID 63: ${comp.name}`);
      console.log(`   Start date: ${comp.start_date.toISOString().split('T')[0]}`);
    }
    
    // Verify final state
    console.log('\n🔍 Final verification:');
    
    const april15Comps = await pool.query(
      'SELECT id, name, start_date FROM competitions WHERE start_date = $1 AND region = $2 ORDER BY id',
      ['2026-04-15', '华东赛区']
    );
    
    console.log(`\n📊 Competitions starting 2026-04-15: ${april15Comps.rows.length}`);
    april15Comps.rows.forEach(comp => {
      console.log(`   • ID ${comp.id}: ${comp.name} - ${comp.start_date.toISOString().split('T')[0]}`);
    });
    
    console.log('\n✅ All dates are now correct!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

finalDateFix();