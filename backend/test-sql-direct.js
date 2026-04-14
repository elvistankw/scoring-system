// Test SQL query directly
const db = require('./db');

async function testSQL() {
  console.log('🧪 直接测试SQL查询\n');

  try {
    const query = `
      SELECT c.*, 
             COALESCE((SELECT COUNT(*) FROM competition_athletes ca WHERE ca.competition_id = c.id), 0) as athlete_count
      FROM competitions c 
      WHERE 1=1
      ORDER BY c.created_at DESC
      LIMIT 5
    `;

    console.log('📝 执行查询...\n');
    const result = await db.query(query);

    console.log(`✅ 查询成功，返回 ${result.rows.length} 条记录\n`);

    result.rows.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   选手数量: ${comp.athlete_count}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSQL();
