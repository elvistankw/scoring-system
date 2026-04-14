const db = require('./db');

async function checkCompetitions() {
  try {
    const result = await db.query(`
      SELECT id, name, status, start_date, end_date, region 
      FROM competitions 
      WHERE region = '华东赛区' 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log('East China Region Competitions:');
    console.log('ID | Name | Status | Start Date | End Date');
    console.log('---|------|--------|------------|----------');
    
    result.rows.forEach(comp => {
      const startDate = comp.start_date ? new Date(comp.start_date).toISOString().split('T')[0] : 'null';
      const endDate = comp.end_date ? new Date(comp.end_date).toISOString().split('T')[0] : 'null';
      console.log(`${comp.id} | ${comp.name} | ${comp.status} | ${startDate} | ${endDate}`);
    });
    
    // Check today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`\nToday's date (midnight): ${today.toISOString().split('T')[0]}`);
    
    // Check which competitions should be active based on date
    console.log('\nDate-based status analysis:');
    result.rows.forEach(comp => {
      if (comp.start_date) {
        const startDate = new Date(comp.start_date);
        startDate.setHours(0, 0, 0, 0);
        
        const shouldBeActive = startDate.getTime() <= today.getTime();
        const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
        const statusMatch = comp.status === expectedStatus;
        
        console.log(`ID ${comp.id}: start=${startDate.toISOString().split('T')[0]}, current=${comp.status}, expected=${expectedStatus}, match=${statusMatch}`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCompetitions();