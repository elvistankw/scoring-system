// 调试比赛创建过程，查看实际传递的参数
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function debugCreateCompetition() {
  try {
    console.log('🐛 调试比赛创建过程\n');

    // 模拟创建比赛的逻辑
    const testData = {
      name: '调试测试比赛',
      competition_type: 'individual',
      region: '调试赛区',
      status: undefined, // 不提供 status，让系统自动判断
      start_date: '2026-04-13', // 今天
      end_date: '2026-04-14'
    };

    console.log('📝 输入数据:');
    console.log(`  name: ${testData.name}`);
    console.log(`  competition_type: ${testData.competition_type}`);
    console.log(`  region: ${testData.region}`);
    console.log(`  status: ${testData.status} (undefined = 让系统自动判断)`);
    console.log(`  start_date: ${testData.start_date}`);
    console.log(`  end_date: ${testData.end_date}\n`);

    // 复制控制器中的逻辑
    const { name, competition_type, region, status, start_date, end_date } = testData;

    // Auto-determine status based on start_date if not explicitly provided
    let finalStatus = status || 'upcoming';
    
    console.log('🔧 自动状态判断逻辑:');
    console.log(`  初始 finalStatus: ${finalStatus}`);
    console.log(`  status 是否为空: ${!status}`);
    console.log(`  start_date 是否存在: ${!!start_date}`);

    if (!status && start_date) {
      console.log('  进入自动判断逻辑...');
      
      // Get today's date at midnight (00:00:00) for pure date comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get start date at midnight (00:00:00) for pure date comparison
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      
      console.log(`  今天 (midnight): ${today.toISOString()}`);
      console.log(`  开始日期 (midnight): ${startDate.toISOString()}`);
      console.log(`  开始日期时间戳: ${startDate.getTime()}`);
      console.log(`  今天时间戳: ${today.getTime()}`);
      console.log(`  开始日期 <= 今天: ${startDate.getTime() <= today.getTime()}`);
      
      // Compare dates only (not time)
      // If start date is today or in the past, set status to active
      if (startDate.getTime() <= today.getTime()) {
        finalStatus = 'active';
        console.log(`  ✅ 设置状态为 'active' 因为开始日期 (${start_date}) 是今天或过去`);
      } else {
        console.log(`  ℹ️  状态保持 'upcoming' 因为开始日期 (${start_date}) 是未来`);
      }
    } else {
      console.log('  跳过自动判断逻辑');
    }

    console.log(`\n🎯 最终状态: ${finalStatus}\n`);

    // 准备 INSERT 参数
    const insertParams = [
      name,
      competition_type,
      region,
      finalStatus,
      start_date || null,
      end_date || null,
      1 // created_by
    ];

    console.log('📤 INSERT 参数:');
    insertParams.forEach((param, index) => {
      console.log(`  $${index + 1}: ${param} (${typeof param})`);
    });

    // 执行 INSERT
    console.log('\n🚀 执行 INSERT...');
    const result = await pool.query(
      `INSERT INTO competitions 
       (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      insertParams
    );

    const newCompetition = result.rows[0];
    console.log('\n✅ 创建成功！');
    console.log('📋 返回的比赛数据:');
    console.log(`  ID: ${newCompetition.id}`);
    console.log(`  名称: ${newCompetition.name}`);
    console.log(`  状态: ${newCompetition.status}`);
    console.log(`  开始日期: ${newCompetition.start_date}`);
    console.log(`  创建时间: ${newCompetition.created_at}`);

    // 验证结果
    const expectedStatus = 'active'; // 因为是今天
    const statusCorrect = newCompetition.status === expectedStatus;
    
    console.log('\n🔍 结果验证:');
    console.log(`  预期状态: ${expectedStatus}`);
    console.log(`  实际状态: ${newCompetition.status}`);
    console.log(`  状态正确: ${statusCorrect ? '✅' : '❌'}`);

    if (!statusCorrect) {
      console.log('\n❌ 问题分析:');
      console.log('  1. 应用程序逻辑计算正确，但数据库可能有问题');
      console.log('  2. 数据库默认值可能覆盖了应用程序的值');
      console.log('  3. 可能有触发器或约束影响了插入');
    }

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await pool.query('DELETE FROM competitions WHERE region = $1', ['调试赛区']);
    console.log('✅ 清理完成');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细错误:', error);
    await pool.end();
    process.exit(1);
  }
}

debugCreateCompetition();