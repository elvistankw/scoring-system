// Run migration 003: Split duo_team into duo and team
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 执行数据库迁移：拆分 duo_team 类型\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', '003_split_duo_team_type.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and filter out comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 找到 ${statements.length} 条SQL语句\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comment-only statements
      if (statement.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
        continue;
      }

      console.log(`${i + 1}. 执行: ${statement.substring(0, 60)}...`);
      
      try {
        const result = await db.query(statement);
        
        // If it's a SELECT statement, show results
        if (statement.trim().toUpperCase().startsWith('SELECT')) {
          console.log('   结果:');
          result.rows.forEach(row => {
            console.log(`   - ${row.competition_type}: ${row.count} 个`);
          });
        } else if (statement.trim().toUpperCase().startsWith('UPDATE')) {
          console.log(`   ✅ 更新了 ${result.rowCount} 行`);
        } else {
          console.log('   ✅ 执行成功');
        }
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log('   ⚠️  约束不存在，跳过');
        } else {
          throw err;
        }
      }
      console.log('');
    }

    console.log('✅ 迁移完成！\n');
    console.log('📊 当前比赛类型分布：');
    
    const typeCount = await db.query(`
      SELECT competition_type, COUNT(*) as count
      FROM competitions
      GROUP BY competition_type
      ORDER BY competition_type
    `);
    
    typeCount.rows.forEach(row => {
      const typeLabel = {
        'individual': '个人赛',
        'duo': '双人赛',
        'team': '团体赛',
        'challenge': '挑战赛'
      }[row.competition_type] || row.competition_type;
      
      console.log(`   ${typeLabel} (${row.competition_type}): ${row.count} 个`);
    });

    console.log('');
    console.log('💡 后续步骤：');
    console.log('   1. 清除Redis缓存: node backend/clear-competition-cache.js');
    console.log('   2. 刷新前端页面');

    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
