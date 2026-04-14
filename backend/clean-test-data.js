// backend/clean-test-data.js
// Script to clean up test data
// Run with: node backend/clean-test-data.js

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

// Create a new pool instance for this script
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: String(process.env.DB_PASSWORD || ''),
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function cleanTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 查找测试数据...\n');
    
    // Find test competitions
    const competitionsResult = await client.query(
      `SELECT id, name, region, status, 
              (SELECT COUNT(*) FROM competition_athletes WHERE competition_id = competitions.id) as athlete_count
       FROM competitions
       WHERE name LIKE '%测试%' OR region LIKE '%测试%'
       ORDER BY created_at DESC`
    );
    
    if (competitionsResult.rows.length === 0) {
      console.log('✅ 没有找到测试比赛数据');
      return;
    }
    
    console.log('📋 找到以下测试比赛:\n');
    competitionsResult.rows.forEach((comp, index) => {
      console.log(`  ${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`     赛区: ${comp.region}`);
      console.log(`     状态: ${comp.status}`);
      console.log(`     参赛选手: ${comp.athlete_count} 名\n`);
    });
    
    // Find test athletes
    const athletesResult = await client.query(
      `SELECT COUNT(*) as count
       FROM athletes
       WHERE athlete_number LIKE 'T%'`
    );
    
    console.log(`👥 找到 ${athletesResult.rows[0].count} 名测试选手 (编号以T开头)\n`);
    
    // Ask for confirmation
    const answer = await askQuestion('⚠️  确定要删除这些测试数据吗？(yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ 操作已取消');
      return;
    }
    
    await client.query('BEGIN');
    
    console.log('\n🗑️  开始清理测试数据...\n');
    
    // Delete test competitions (cascade will delete competition_athletes and scores)
    const deleteCompResult = await client.query(
      `DELETE FROM competitions
       WHERE name LIKE '%测试%' OR region LIKE '%测试%'
       RETURNING id, name`
    );
    
    console.log(`✅ 删除了 ${deleteCompResult.rows.length} 个测试比赛:`);
    deleteCompResult.rows.forEach(comp => {
      console.log(`   - ${comp.name} (ID: ${comp.id})`);
    });
    
    // Delete test athletes
    const deleteAthletesResult = await client.query(
      `DELETE FROM athletes
       WHERE athlete_number LIKE 'T%'
       RETURNING id, name, athlete_number`
    );
    
    console.log(`\n✅ 删除了 ${deleteAthletesResult.rows.length} 名测试选手`);
    
    await client.query('COMMIT');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ 测试数据清理完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 清理测试数据失败:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    rl.close();
  }
}

// Run the clean script
cleanTestData()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error.message);
    process.exit(1);
  });
