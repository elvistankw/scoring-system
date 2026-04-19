-- Supabase简化Schema查询
-- 可以直接在Supabase SQL编辑器中运行

-- 1. 获取所有表列表
SELECT 
    table_name as "表名",
    table_type as "类型"
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. 获取表结构详情
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

-- 3. 获取主键信息
SELECT 
    tc.table_name as "表名",
    string_agg(ku.column_name, ', ' ORDER BY ku.ordinal_position) as "主键列"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY tc.table_name;

-- 4. 获取外键关系
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

-- 5. 获取检查约束
SELECT 
    tc.table_name as "表名",
    tc.constraint_name as "约束名",
    cc.check_clause as "检查条件"
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 6. 获取索引信息
SELECT 
    tablename as "表名",
    indexname as "索引名",
    indexdef as "索引定义"
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;