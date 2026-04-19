-- Supabase数据库Schema查询
-- 适用于Supabase PostgreSQL环境

-- =====================================================
-- 1. 获取所有表的基本信息
-- =====================================================
SELECT 
    'TABLE_INFO' as query_type,
    table_name as "表名",
    table_type as "表类型"
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. 获取所有表的列信息
-- =====================================================
SELECT 
    'COLUMN_INFO' as query_type,
    table_name as "表名",
    column_name as "列名",
    ordinal_position as "位置",
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
-- 3. 获取所有主键约束
-- =====================================================
SELECT 
    'PRIMARY_KEYS' as query_type,
    tc.table_name as "表名",
    tc.constraint_name as "约束名",
    string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as "主键列"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- =====================================================
-- 4. 获取所有外键约束
-- =====================================================
SELECT 
    'FOREIGN_KEYS' as query_type,
    tc.table_name as "源表",
    ku.column_name as "源列",
    ccu.table_name as "目标表",
    ccu.column_name as "目标列",
    tc.constraint_name as "约束名",
    rc.delete_rule as "删除规则",
    rc.update_rule as "更新规则"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, ku.column_name;

-- =====================================================
-- 5. 获取所有唯一约束
-- =====================================================
SELECT 
    'UNIQUE_CONSTRAINTS' as query_type,
    tc.table_name as "表名",
    tc.constraint_name as "约束名",
    string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as "唯一列"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- =====================================================
-- 6. 获取所有检查约束
-- =====================================================
SELECT 
    'CHECK_CONSTRAINTS' as query_type,
    tc.table_name as "表名",
    tc.constraint_name as "约束名",
    cc.check_clause as "检查条件"
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 7. 获取索引信息 (使用pg_indexes视图)
-- =====================================================
SELECT 
    'INDEXES' as query_type,
    schemaname as "模式",
    tablename as "表名",
    indexname as "索引名",
    indexdef as "索引定义"
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'  -- 排除主键索引
ORDER BY tablename, indexname;

-- =====================================================
-- 8. 获取序列信息
-- =====================================================
SELECT 
    'SEQUENCES' as query_type,
    sequence_name as "序列名",
    data_type as "数据类型",
    start_value as "起始值",
    minimum_value as "最小值",
    maximum_value as "最大值",
    increment as "增量"
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- =====================================================
-- 9. 获取视图信息
-- =====================================================
SELECT 
    'VIEWS' as query_type,
    table_name as "视图名",
    view_definition as "视图定义"
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 10. 生成CREATE TABLE语句
-- =====================================================
SELECT 
    'CREATE_STATEMENTS' as query_type,
    table_name as "表名",
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
            WHEN data_type = 'uuid' THEN 'UUID'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || chr(10)
        ORDER BY ordinal_position
    ) || chr(10) || ');' as "CREATE语句"
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- =====================================================
-- 11. 获取表统计信息 (如果可用)
-- =====================================================
SELECT 
    'TABLE_STATS' as query_type,
    schemaname as "模式",
    relname as "表名",
    n_tup_ins as "插入数",
    n_tup_upd as "更新数",
    n_tup_del as "删除数",
    n_live_tup as "活跃行数",
    n_dead_tup as "死亡行数",
    last_vacuum as "最后清理",
    last_autovacuum as "最后自动清理",
    last_analyze as "最后分析",
    last_autoanalyze as "最后自动分析"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- =====================================================
-- 12. 获取数据库大小信息
-- =====================================================
SELECT 
    'DATABASE_SIZE' as query_type,
    pg_database.datname as "数据库名",
    pg_size_pretty(pg_database_size(pg_database.datname)) as "数据库大小"
FROM pg_database
WHERE datname = current_database();

-- =====================================================
-- 13. 获取表大小信息
-- =====================================================
SELECT 
    'TABLE_SIZES' as query_type,
    schemaname as "模式",
    relname as "表名",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as "总大小",
    pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as "表大小",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as "索引大小"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;