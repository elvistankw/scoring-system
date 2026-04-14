const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'scoring',
  password: 'etkw1234',
  port: 5432,
});

async function checkDates() {
  const result = await pool.query('SELECT id, name, start_date FROM competitions WHERE id IN (62, 63) ORDER BY id');
  console.log('Competition Date Check:');
  result.rows.forEach(comp => {
    console.log(`ID ${comp.id}: ${comp.name}`);
    console.log(`   Start: ${comp.start_date.toISOString().split('T')[0]}`);
  });
  await pool.end();
}
checkDates();