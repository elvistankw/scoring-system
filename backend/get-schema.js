// 获取数据库Schema的Node.js脚本
// 使用方法: node get-schema.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 数据库连接配置
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scoring',
  password: process.env.DB_PASSWORD || 'etkw1234',
  port: process.env.DB_PORT || 5432,
});

console.log('🔧 数据库连接配置:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Database: ${process.env.DB_NAME || 'scoring'}`);
console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
console.log(`   Port: ${process.env.DB_PORT || 5432}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);
console.log('');

// 格式化输出
const formatResults = (results, title) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(60)}`);
  
  if (results.length === 0) {
    console.log('No data found.');
    return;
  }
  
  // 打印表头
  const headers = Object.keys(results[0]);
  console.log(headers.join(' | '));
  console.log(headers.map(h => '-'.repeat(h.length)).join('-|-'));
  
  // 打印数据行
  results.forEach(row => {
    console.log(headers.map(h => (row[h] || '').toString()).join(' | '));
  });
};

// 主要查询函数
async function getSchema() {
  try {
    console.log('🔍 正在获取数据库Schema信息...\n');

    // 1. 获取所有表信息
    const tablesQuery = `
      SELECT 
          tablename as "表名",
          tableowner as "所有者",
          pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS "大小"
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    const tables = await pool.query(tablesQuery);
    formatResults(tables.rows, '📋 数据库表列表');

    // 2. 获取表结构
    const columnsQuery = `
      SELECT 
          table_name as "表名",
          column_name as "列名",
          CASE 
              WHEN character_maximum_length IS NOT NULL 
              THEN data_type || '(' || character_maximum_length || ')'
              WHEN numeric_precision IS NOT NULL 
              THEN data_type || '(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
              ELSE data_type
          END as "数据类型",
          is_nullable as "可空",
          column_default as "默认值"
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    const columns = await pool.query(columnsQuery);
    formatResults(columns.rows, '🏗️  表结构详情');

    // 3. 获取主键
    const primaryKeysQuery = `
      SELECT 
          tc.table_name as "表名",
          string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as "主键列"
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      GROUP BY tc.table_name
      ORDER BY tc.table_name;
    `;
    const primaryKeys = await pool.query(primaryKeysQuery);
    formatResults(primaryKeys.rows, '🔑 主键约束');

    // 4. 获取外键关系
    const foreignKeysQuery = `
      SELECT 
          tc.table_name as "源表",
          ku.column_name as "源列",
          ccu.table_name as "目标表",
          ccu.column_name as "目标列",
          rc.delete_rule as "删除规则",
          rc.update_rule as "更新规则"
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    const foreignKeys = await pool.query(foreignKeysQuery);
    formatResults(foreignKeys.rows, '🔗 外键关系');

    // 5. 获取索引
    const indexesQuery = `
      SELECT 
          tablename as "表名",
          indexname as "索引名",
          indexdef as "索引定义"
      FROM pg_indexes 
      WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname;
    `;
    const indexes = await pool.query(indexesQuery);
    formatResults(indexes.rows, '📊 索引信息');

    // 6. 获取检查约束
    const checkConstraintsQuery = `
      SELECT 
          tc.table_name as "表名",
          tc.constraint_name as "约束名",
          cc.check_clause as "检查条件"
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
          AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    const checkConstraints = await pool.query(checkConstraintsQuery);
    formatResults(checkConstraints.rows, '✅ 检查约束');

    // 7. 获取表统计信息
    const statsQuery = `
      SELECT 
          tablename as "表名",
          n_live_tup as "行数",
          n_tup_ins as "插入数",
          n_tup_upd as "更新数",
          n_tup_del as "删除数",
          last_vacuum as "最后清理",
          last_analyze as "最后分析"
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC;
    `;
    const stats = await pool.query(statsQuery);
    formatResults(stats.rows, '📈 表统计信息');

    // 8. 生成CREATE TABLE语句
    console.log(`\n${'='.repeat(60)}`);
    console.log('🛠️  CREATE TABLE 语句');
    console.log(`${'='.repeat(60)}`);
    
    for (const table of tables.rows) {
      const tableName = table['表名'];
      
      const createQuery = `
        SELECT 
            'CREATE TABLE ' || table_name || ' (' || chr(10) ||
            string_agg(
                '    ' || column_name || ' ' || 
                CASE 
                    WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
                    WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
                    WHEN data_type = 'numeric' THEN 'DECIMAL(' || numeric_precision || ',' || numeric_scale || ')'
                    WHEN data_type = 'integer' THEN 'INTEGER'
                    WHEN data_type = 'bigint' THEN 'BIGINT'
                    WHEN data_type = 'smallint' THEN 'SMALLINT'
                    WHEN data_type = 'boolean' THEN 'BOOLEAN'
                    WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
                    WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
                    WHEN data_type = 'date' THEN 'DATE'
                    WHEN data_type = 'time without time zone' THEN 'TIME'
                    WHEN data_type = 'text' THEN 'TEXT'
                    WHEN data_type = 'inet' THEN 'INET'
                    ELSE UPPER(data_type)
                END ||
                CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
                CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
                ',' || chr(10)
                ORDER BY ordinal_position
            ) || chr(10) || ');' as create_statement
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        GROUP BY table_name;
      `;
      
      const createResult = await pool.query(createQuery, [tableName]);
      if (createResult.rows.length > 0) {
        console.log(`\n-- ${tableName} 表`);
        console.log(createResult.rows[0].create_statement);
      }
    }

    console.log('\n✅ Schema信息获取完成！');

  } catch (error) {
    console.error('❌ 获取Schema时出错:', error.message);
  } finally {
    await pool.end();
  }
}

// 保存到文件的函数
async function saveSchemaToFile() {
  try {
    console.log('💾 正在保存Schema到文件...');
    
    // 重定向console.log到文件
    const originalLog = console.log;
    let output = '';
    
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };
    
    await getSchema();
    
    // 恢复console.log
    console.log = originalLog;
    
    // 保存到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-schema-${timestamp}.txt`;
    
    fs.writeFileSync(filename, output);
    console.log(`✅ Schema已保存到文件: ${filename}`);
    
  } catch (error) {
    console.error('❌ 保存文件时出错:', error.message);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--save') || args.includes('-s')) {
    await saveSchemaToFile();
  } else {
    await getSchema();
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getSchema, saveSchemaToFile };