// backend/seed-test-data.js
// Script to seed test competition with 30 athletes
// Run with: node backend/seed-test-data.js

require('dotenv').config();
const { Pool } = require('pg');

// Debug: Check environment variables
console.log('🔍 数据库配置检查:');
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '未设置');
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('');

// Create a new pool instance for this script
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: String(process.env.DB_PASSWORD || ''),
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Test data configuration
const TEST_COMPETITION = {
  name: '2024春季测试赛',
  competition_type: 'individual',
  region: '测试赛区',
  status: 'active',
  start_date: new Date(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
};

// Generate 30 test athletes with varied names
const ATHLETE_NAMES = [
  '张伟', '李娜', '王芳', '刘洋', '陈静',
  '杨帆', '赵敏', '黄磊', '周杰', '吴倩',
  '徐强', '孙丽', '马超', '朱婷', '胡军',
  '郭敬明', '林志玲', '何炅', '谢娜', '邓超',
  '范冰冰', '李冰冰', '章子怡', '赵薇', '周迅',
  '刘德华', '张学友', '郭富城', '黎明', '陈奕迅'
];

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 开始生成测试数据...\n');
    
    // 1. Create test competition
    console.log('📋 创建测试比赛...');
    const competitionResult = await client.query(
      `INSERT INTO competitions (name, competition_type, region, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name`,
      [
        TEST_COMPETITION.name,
        TEST_COMPETITION.competition_type,
        TEST_COMPETITION.region,
        TEST_COMPETITION.status,
        TEST_COMPETITION.start_date,
        TEST_COMPETITION.end_date
      ]
    );
    
    const competitionId = competitionResult.rows[0].id;
    const competitionName = competitionResult.rows[0].name;
    console.log(`✅ 比赛创建成功: ${competitionName} (ID: ${competitionId})\n`);
    
    // 2. Create 30 test athletes
    console.log('👥 创建30名测试选手...');
    const athleteIds = [];
    
    for (let i = 0; i < 30; i++) {
      const athleteNumber = `T${String(i + 1).padStart(3, '0')}`; // T001, T002, ..., T030
      const name = ATHLETE_NAMES[i];
      const teamName = i % 3 === 0 ? `团队${Math.floor(i / 3) + 1}` : null; // Every 3rd athlete has a team
      
      try {
        const athleteResult = await client.query(
          `INSERT INTO athletes (name, athlete_number, team_name)
           VALUES ($1, $2, $3)
           RETURNING id, name, athlete_number`,
          [name, athleteNumber, teamName]
        );
        
        const athleteId = athleteResult.rows[0].id;
        athleteIds.push(athleteId);
        
        console.log(`  ✓ ${athleteNumber} - ${name}${teamName ? ` (${teamName})` : ''}`);
      } catch (err) {
        if (err.code === '23505') { // Unique violation
          console.log(`  ⚠️  ${athleteNumber} - ${name} 已存在，跳过`);
          // Get existing athlete ID
          const existingAthlete = await client.query(
            'SELECT id FROM athletes WHERE athlete_number = $1',
            [athleteNumber]
          );
          if (existingAthlete.rows.length > 0) {
            athleteIds.push(existingAthlete.rows[0].id);
          }
        } else {
          throw err;
        }
      }
    }
    
    console.log(`\n✅ 成功创建/找到 ${athleteIds.length} 名选手\n`);
    
    // 3. Associate athletes with competition
    console.log('🔗 将选手添加到比赛...');
    let addedCount = 0;
    
    for (const athleteId of athleteIds) {
      try {
        await client.query(
          `INSERT INTO competition_athletes (competition_id, athlete_id)
           VALUES ($1, $2)`,
          [competitionId, athleteId]
        );
        addedCount++;
      } catch (err) {
        if (err.code === '23505') { // Already exists
          console.log(`  ⚠️  选手 ID ${athleteId} 已在比赛中`);
        } else {
          throw err;
        }
      }
    }
    
    console.log(`✅ 成功添加 ${addedCount} 名选手到比赛\n`);
    
    await client.query('COMMIT');
    
    // 4. Display summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ 测试数据生成完成！\n');
    console.log('📊 数据摘要:');
    console.log(`   比赛名称: ${competitionName}`);
    console.log(`   比赛ID: ${competitionId}`);
    console.log(`   比赛类型: ${TEST_COMPETITION.competition_type}`);
    console.log(`   赛区: ${TEST_COMPETITION.region}`);
    console.log(`   状态: ${TEST_COMPETITION.status}`);
    console.log(`   参赛选手: ${athleteIds.length} 名`);
    console.log(`   选手编号范围: T001 - T030`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 5. Verify data
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count
       FROM competition_athletes
       WHERE competition_id = $1`,
      [competitionId]
    );
    
    console.log(`✅ 验证: 比赛中有 ${verifyResult.rows[0].count} 名选手\n`);
    console.log('🎉 可以开始测试排序功能了！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 生成测试数据失败:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed script
seedTestData()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error.message);
    process.exit(1);
  });
