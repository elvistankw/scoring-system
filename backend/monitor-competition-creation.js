// 实时监控比赛创建过程
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function monitorCompetitionCreation() {
  try {
    console.log('👀 实时监控比赛创建过程');
    console.log('📅 当前服务器时间:', new Date().toLocaleString());
    console.log('');
    console.log('等待新比赛创建...');
    console.log('(按 Ctrl+C 停止监控)');
    console.log('');

    let lastCompetitionId = 0;
    
    // 获取当前最大ID
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM competitions');
    if (maxIdResult.rows[0].max_id) {
      lastCompetitionId = maxIdResult.rows[0].max_id;
    }
    
    console.log(`📊 当前最大比赛ID: ${lastCompetitionId}`);
    console.log('');

    // 每秒检查一次新比赛
    const checkInterval = setInterval(async () => {
      try {
        const result = await pool.query(`
          SELECT id, name, competition_type, region, status, start_date, end_date, created_at
          FROM competitions 
          WHERE id > $1 
          ORDER BY id DESC 
          LIMIT 5
        `, [lastCompetitionId]);

        if (result.rows.length > 0) {
          for (const comp of result.rows) {
            console.log(`🆕 新比赛创建！`);
            console.log(`   ID: ${comp.id}`);
            console.log(`   名称: ${comp.name}`);
            console.log(`   类型: ${comp.competition_type}`);
            console.log(`   赛区: ${comp.region}`);
            console.log(`   状态: ${comp.status}`);
            console.log(`   开始日期: ${comp.start_date ? comp.start_date.toISOString().split('T')[0] : 'null'}`);
            console.log(`   结束日期: ${comp.end_date ? comp.end_date.toISOString().split('T')[0] : 'null'}`);
            console.log(`   创建时间: ${comp.created_at.toLocaleString()}`);
            
            // 分析状态是否正确
            if (comp.start_date) {
              const today = new Date();
              const todayStr = today.getFullYear() + '-' + 
                              String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(today.getDate()).padStart(2, '0');
              
              const startDateObj = new Date(comp.start_date);
              const startStr = startDateObj.getFullYear() + '-' + 
                              String(startDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(startDateObj.getDate()).padStart(2, '0');
              
              const shouldBeActive = startStr <= todayStr;
              const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
              const statusCorrect = comp.status === expectedStatus;
              
              console.log(`   📊 状态分析:`);
              console.log(`      今天: ${todayStr}`);
              console.log(`      开始: ${startStr}`);
              console.log(`      应该是: ${expectedStatus}`);
              console.log(`      实际是: ${comp.status}`);
              console.log(`      正确: ${statusCorrect ? '✅' : '❌'}`);
              
              if (!statusCorrect) {
                console.log(`   ⚠️  状态不正确！`);
                console.log(`      可能原因:`);
                console.log(`      1. 自动状态逻辑被绕过`);
                console.log(`      2. 数据库默认值覆盖了应用逻辑`);
                console.log(`      3. 明确指定了错误的状态`);
              }
            } else {
              console.log(`   📊 状态分析: 无开始日期，状态应该是 'upcoming'`);
              console.log(`      实际状态: ${comp.status}`);
              console.log(`      正确: ${comp.status === 'upcoming' ? '✅' : '❌'}`);
            }
            
            console.log('');
            lastCompetitionId = Math.max(lastCompetitionId, comp.id);
          }
        }
      } catch (error) {
        console.error('❌ 监控错误:', error.message);
      }
    }, 1000);

    // 优雅退出
    process.on('SIGINT', async () => {
      console.log('\n👋 停止监控...');
      clearInterval(checkInterval);
      await pool.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 监控启动失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

monitorCompetitionCreation();