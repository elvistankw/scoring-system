-- 快速数据库Schema查询 - 简化版本
-- 用于快速了解数据库结构

-- =====================================================
-- 1. 所有表列表及大小
-- =====================================================
\echo '=== 数据库表列表 ==='
SELECT 
    tablename as "表名",
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS "大小"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. 每个表的列信息
-- =====================================================
\echo '\n=== 表结构详情 ==='
SELECT 
    table_name as "表名",
    column_name as "列名",
    data_type as "数据类型",
    CASE 
        WHEN character_maximum_length IS NOT NULL 
        THEN data_type || '(' || character_maximum_length || ')'
        WHEN numeric_precision IS NOT NULL 
        THEN data_type || '(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
        ELSE data_type
    END as "完整类型",
    is_nullable as "可空",
    column_default as "默认值"
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 3. 主键信息
-- =====================================================
\echo '\n=== 主键约束 ==='
SELECT 
    tc.table_name as "表名",
    string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as "主键列"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY tc.table_name;

-- =====================================================
-- 4. 外键关系
-- =====================================================
\echo '\n=== 外键关系 ==='
SELECT 
    tc.table_name as "源表",
    ku.column_name as "源列",
    ccu.table_name as "目标表",
    ccu.column_name as "目标列",
    rc.delete_rule as "删除规则"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 5. 索引信息
-- =====================================================
\echo '\n=== 索引信息 ==='
SELECT 
    tablename as "表名",
    indexname as "索引名",
    indexdef as "索引定义"
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'  -- 排除主键索引
ORDER BY tablename, indexname;

-- =====================================================
-- 6. 表行数统计
-- =====================================================
\echo '\n=== 表数据统计 ==='
SELECT 
    tablename as "表名",
    n_live_tup as "行数",
    n_tup_ins as "插入数",
    n_tup_upd as "更新数",
    n_tup_del as "删除数"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;