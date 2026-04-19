// 测试数据库连接
const { Pool } = require('pg');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    console.log('🔧 数据库连接配置:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'scoring'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);
    console.log('');

    console.log('🔍 正在测试数据库连接...');
    
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📅 当前时间:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL版本:', result.rows[0].pg_version);
    
    // 检查数据库是否存在表
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('\n📋 数据库中的表:');
    if (tablesResult.rows.length === 0) {
      console.log('   (没有找到表)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 解决方案:');
      console.log('   1. 检查 backend/.env 文件中的 DB_PASSWORD');
      console.log('   2. 确认PostgreSQL用户密码是否正确');
      console.log('   3. 尝试使用psql命令行测试连接:');
      console.log(`      psql -U ${process.env.DB_USER || 'postgres'} -h ${process.env.DB_HOST || 'localhost'} -d ${process.env.DB_NAME || 'scoring'}`);
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 解决方案:');
      console.log('   1. 创建数据库:');
      console.log(`      createdb -U ${process.env.DB_USER || 'postgres'} ${process.env.DB_NAME || 'scoring'}`);
      console.log('   2. 或者使用psql创建:');
      console.log(`      psql -U ${process.env.DB_USER || 'postgres'} -c "CREATE DATABASE ${process.env.DB_NAME || 'scoring'};"`);
    } else if (error.message.includes('connection refused')) {
      console.log('\n💡 解决方案:');
      console.log('   1. 确认PostgreSQL服务正在运行');
      console.log('   2. 检查连接地址和端口是否正确');
      console.log('   3. Windows上可以检查服务: services.msc -> PostgreSQL');
    }
  } finally {
    await pool.end();
  }
}

testConnection();