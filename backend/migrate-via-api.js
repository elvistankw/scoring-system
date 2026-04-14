// Execute migration via running backend server
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function migrate() {
  console.log('🔄 通过API执行数据库迁移\n');

  try {
    // 1. Login as admin
    console.log('🔐 登录为管理员...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功\n');

    // 2. Execute migration SQL via a custom endpoint
    // Since we don't have a migration endpoint, we'll use psql directly
    console.log('💡 请手动执行以下SQL命令：\n');
    console.log('-----------------------------------');
    console.log('-- 1. 删除旧约束');
    console.log('ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;');
    console.log('');
    console.log('-- 2. 添加新约束');
    console.log("ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));");
    console.log('');
    console.log('-- 3. 迁移现有数据');
    console.log("UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';");
    console.log('-----------------------------------\n');
    
    console.log('📝 执行方式：');
    console.log('   方法1: 使用 pgAdmin 或其他数据库工具');
    console.log('   方法2: 使用 psql 命令行');
    console.log('   方法3: 直接在数据库管理界面执行');
    console.log('');
    console.log('⚠️  注意：执行前请备份数据库！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

migrate();
