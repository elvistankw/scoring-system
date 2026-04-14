// 检查 competitions 表结构，特别是 status 字段的默认值
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

async function checkTableStructure() {
  try {
    console.log('🔍 检查 competitions 表结构\n');

    // 查询表结构
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'competitions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('📋 competitions 表字段:');
    console.log('字段名 | 数据类型 | 可空 | 默认值');
    console.log('------|---------|-----|-------');
    
    result.rows.forEach(col => {
      console.log(`${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'}`);
    });

    // 特别检查 status 字段
    const statusField = result.rows.find(col => col.column_name === 'status');
    if (statusField) {
      console.log('\n🎯 status 字段详情:');
      console.log(`  数据类型: ${statusField.data_type}`);
      console.log(`  可空: ${statusField.is_nullable}`);
      console.log(`  默认值: ${statusField.column_default || 'NULL'}`);
      
      if (statusField.column_default) {
        console.log('\n⚠️  发现问题！status 字段有默认值，这可能会覆盖应用程序的逻辑');
      } else {
        console.log('\n✅ status 字段没有默认值，应用程序逻辑应该正常工作');
      }
    }

    // 检查是否有触发器或约束
    console.log('\n🔍 检查相关约束和触发器:');
    
    const constraintsResult = await pool.query(`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'competitions' 
      AND table_schema = 'public'
    `);

    if (constraintsResult.rows.length > 0) {
      console.log('约束:');
      constraintsResult.rows.forEach(constraint => {
        console.log(`  ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    } else {
      console.log('  无特殊约束');
    }

    // 检查触发器
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'competitions'
    `);

    if (triggersResult.rows.length > 0) {
      console.log('触发器:');
      triggersResult.rows.forEach(trigger => {
        console.log(`  ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
    } else {
      console.log('  无触发器');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTableStructure();