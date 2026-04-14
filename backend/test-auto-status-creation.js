// 测试自动状态逻辑 - 创建今天和昨天的比赛
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function testAutoStatusCreation() {
  try {
    console.log('🧪 测试自动状态逻辑 - 创建比赛\n');

    // 获取今天和昨天的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log(`📅 今天: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 昨天: ${yesterday.toISOString().split('T')[0]}\n`);

    // 测试数据
    const testCompetitions = [
      {
        name: '测试比赛 - 昨天开始',
        competition_type: 'individual',
        region: '测试赛区',
        start_date: yesterday.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        expected_status: 'active'
      },
      {
        name: '测试比赛 - 今天开始',
        competition_type: 'duo_team',
        region: '测试赛区',
        start_date: today.toISOString().split('T')[0],
        end_date: new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0],
        expected_status: 'active'
      },
      {
        name: '测试比赛 - 明天开始',
        competition_type: 'challenge',
        region: '测试赛区',
        start_date: new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0],
        end_date: new Date(today.getTime() + 48*60*60*1000).toISOString().split('T')[0],
        expected_status: 'upcoming'
      }
    ];

    console.log('🔧 创建测试比赛...\n');

    for (const comp of testCompetitions) {
      console.log(`创建: ${comp.name}`);
      console.log(`  开始日期: ${comp.start_date}`);
      console.log(`  预期状态: ${comp.expected_status}`);

      try {
        // 不提供 status 参数，让系统自动判断
        const result = await pool.query(`
          INSERT INTO competitions 
          (name, competition_type, region, start_date, end_date, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id, name, status, start_date
        `, [
          comp.name,
          comp.competition_type,
          comp.region,
          comp.start_date,
          comp.end_date,
          1 // admin user id
        ]);

        const newComp = result.rows[0];
        const statusCorrect = newComp.status === comp.expected_status;
        const statusIcon = statusCorrect ? '✅' : '❌';

        console.log(`  实际状态: ${newComp.status} ${statusIcon}`);
        console.log(`  比赛ID: ${newComp.id}`);
        
        if (!statusCorrect) {
          console.log(`  ⚠️  状态不正确！应该是 ${comp.expected_status}`);
        }
        
      } catch (error) {
        console.log(`  ❌ 创建失败: ${error.message}`);
      }
      console.log('');
    }

    // 检查创建的比赛
    console.log('🔍 检查创建的测试比赛:');
    const checkResult = await pool.query(`
      SELECT id, name, status, start_date, created_at
      FROM competitions 
      WHERE region = '测试赛区'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    checkResult.rows.forEach((comp, index) => {
      const startDate = new Date(comp.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let dateStatus = '';
      
      if (daysDiff < 0) {
        dateStatus = `${Math.abs(daysDiff)} 天前`;
      } else if (daysDiff === 0) {
        dateStatus = '今天';
      } else {
        dateStatus = `${daysDiff} 天后`;
      }

      const shouldBeActive = startDate.getTime() <= today.getTime();
      const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
      const statusCorrect = comp.status === expectedStatus;

      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   开始: ${comp.start_date.toISOString().split('T')[0]} (${dateStatus})`);
      console.log(`   状态: ${comp.status} ${statusCorrect ? '✅' : '❌'}`);
      console.log(`   预期: ${expectedStatus}`);
      console.log('');
    });

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    const deleteResult = await pool.query(
      'DELETE FROM competitions WHERE region = $1',
      ['测试赛区']
    );
    console.log(`✅ 删除了 ${deleteResult.rowCount} 个测试比赛\n`);

    console.log('💡 结论:');
    console.log('如果看到 ❌，说明自动状态逻辑有问题');
    console.log('如果都是 ✅，说明逻辑正常工作');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testAutoStatusCreation();