// Migrate duo_team competitions to duo or team
const db = require('./db');

async function migrateDuoTeam() {
  console.log('🔄 开始迁移 duo_team 类型比赛...\n');

  try {
    // 1. 检查现有 duo_team 比赛
    const checkResult = await db.query(`
      SELECT c.id, c.name, c.region, 
             COUNT(ca.athlete_id) as athlete_count
      FROM competitions c
      LEFT JOIN competition_athletes ca ON c.id = ca.competition_id
      WHERE c.competition_type = 'duo_team'
      GROUP BY c.id, c.name, c.region
      ORDER BY c.id
    `);

    if (checkResult.rows.length === 0) {
      console.log('✅ 没有找到需要迁移的 duo_team 比赛');
      console.log('💡 所有比赛类型已经是最新的！');
      process.exit(0);
    }

    console.log(`📋 找到 ${checkResult.rows.length} 个 duo_team 比赛：\n`);
    
    checkResult.rows.forEach((comp, index) => {
      const suggestedType = comp.athlete_count <= 2 ? 'duo' : 'team';
      console.log(`${index + 1}. ${comp.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   赛区: ${comp.region}`);
      console.log(`   选手数量: ${comp.athlete_count} 人`);
      console.log(`   建议类型: ${suggestedType === 'duo' ? '双人赛 (duo)' : '团体赛 (team)'}`);
      console.log('');
    });

    // 2. 询问迁移策略
    console.log('📌 迁移策略：');
    console.log('   方案1: 全部迁移为 duo（双人赛）');
    console.log('   方案2: 根据选手数量自动判断（≤2人→duo, >2人→team）');
    console.log('   方案3: 全部迁移为 team（团体赛）');
    console.log('');
    console.log('💡 提示：duo 和 team 使用相同的评分标准，可以随时修改');
    console.log('');

    // 默认使用方案2（自动判断）
    console.log('🚀 执行方案2：根据选手数量自动判断...\n');

    // 3. 执行迁移
    let duoCount = 0;
    let teamCount = 0;

    for (const comp of checkResult.rows) {
      const newType = comp.athlete_count <= 2 ? 'duo' : 'team';
      
      await db.query(
        'UPDATE competitions SET competition_type = $1 WHERE id = $2',
        [newType, comp.id]
      );

      if (newType === 'duo') {
        duoCount++;
      } else {
        teamCount++;
      }

      console.log(`✅ ${comp.name}: duo_team → ${newType} (${comp.athlete_count}人)`);
    }

    console.log('');
    console.log('📊 迁移统计：');
    console.log(`   双人赛 (duo): ${duoCount} 个`);
    console.log(`   团体赛 (team): ${teamCount} 个`);
    console.log(`   总计: ${duoCount + teamCount} 个`);
    console.log('');
    console.log('✅ 迁移完成！');
    console.log('');
    console.log('💡 后续步骤：');
    console.log('   1. 清除Redis缓存: node backend/clear-competition-cache.js');
    console.log('   2. 重启后端服务');
    console.log('   3. 刷新前端页面');

    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateDuoTeam();
}

module.exports = { migrateDuoTeam };
