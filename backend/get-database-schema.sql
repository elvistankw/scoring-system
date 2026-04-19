-- 完整的数据库Schema查询
-- 获取所有表结构、索引、约束、关系等信息

-- =====================================================
-- 1. 获取所有表的基本信息
-- =====================================================
SELECT 
    'TABLE_INFO' as query_type,
    schemaname,
    tablename,
    tableowner,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. 获取所有表的列信息
-- =====================================================
SELECT 
    'COLUMN_INFO' as query_type,
    t.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        WHEN uk.column_name IS NOT NULL THEN 'UNIQUE'
        ELSE ''
    END as key_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
) uk ON uk.table_name = c.table_name AND uk.column_name = c.column_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- 3. 获取所有主键约束
-- =====================================================
SELECT 
    'PRIMARY_KEYS' as query_type,
    tc.table_name,
    tc.constraint_name,
    string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as primary_key_columns
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
    tc.table_name as source_table,
    ku.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule
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
    tc.table_name,
    tc.constraint_name,
    string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as unique_columns
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
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 7. 获取所有索引信息
-- =====================================================
SELECT 
    'INDEXES' as query_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 8. 获取所有序列信息
-- =====================================================
SELECT 
    'SEQUENCES' as query_type,
    schemaname,
    sequencename,
    start_value,
    min_value,
    max_value,
    increment_by,
    cycle,
    cache_size,
    last_value
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;

-- =====================================================
-- 9. 获取表之间的关系图信息
-- =====================================================
SELECT 
    'TABLE_RELATIONSHIPS' as query_type,
    tc.table_name as from_table,
    ku.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name as relationship_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 10. 获取表的行数统计
-- =====================================================
SELECT 
    'TABLE_STATISTICS' as query_type,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 11. 获取索引使用统计
-- =====================================================
SELECT 
    'INDEX_STATISTICS' as query_type,
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =====================================================
-- 12. 生成CREATE TABLE语句
-- =====================================================
SELECT 
    'CREATE_STATEMENTS' as query_type,
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
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;