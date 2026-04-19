-- =====================================================
-- 评委身份系统数据库迁移脚本
-- Judge Identity System Database Migration
-- 适用于 Supabase PostgreSQL
-- =====================================================

-- 开始事务
BEGIN;

-- =====================================================
-- 1. 创建 judges 表 (评委信息表)
-- =====================================================
CREATE TABLE IF NOT EXISTS judges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                    -- 评委姓名
    display_name VARCHAR(100),                     -- 显示名称
    code VARCHAR(20) UNIQUE NOT NULL,              -- 评委代码 (如: J001, J002)
    is_active BOOLEAN DEFAULT true,                -- 是否激活
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为 judges 表创建索引
CREATE INDEX IF NOT EXISTS idx_judges_code ON judges(code);
CREATE INDEX IF NOT EXISTS idx_judges_active ON judges(is_active);
CREATE INDEX IF NOT EXISTS idx_judges_name ON judges(name);

-- 添加表注释
COMMENT ON TABLE judges IS '评委信息表 - 存储所有评委的基本信息';
COMMENT ON COLUMN judges.id IS '评委ID，主键';
COMMENT ON COLUMN judges.name IS '评委真实姓名';
COMMENT ON COLUMN judges.display_name IS '评委显示名称，用于界面展示';
COMMENT ON COLUMN judges.code IS '评委代码，唯一标识符，如 J001, J002';
COMMENT ON COLUMN judges.is_active IS '是否激活状态，false表示已停用';
COMMENT ON COLUMN judges.created_at IS '创建时间';
COMMENT ON COLUMN judges.updated_at IS '最后更新时间';

-- =====================================================
-- 2. 创建 judge_sessions 表 (评委会话表)
-- =====================================================
CREATE TABLE IF NOT EXISTS judge_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,    -- 会话令牌
    judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- 登录的用户ID
    ip_address INET,                               -- IP地址
    user_agent TEXT,                               -- 浏览器信息
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,                 -- 会话过期时间
    is_active BOOLEAN DEFAULT true,
    ended_at TIMESTAMP,
    
    -- 约束：过期时间必须晚于开始时间
    CONSTRAINT check_expires_after_start CHECK (expires_at > started_at)
);

-- 为 judge_sessions 表创建索引
CREATE INDEX IF NOT EXISTS idx_judge_sessions_token ON judge_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_judge ON judge_sessions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_active ON judge_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_expires ON judge_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_user ON judge_sessions(user_id);

-- 添加表注释
COMMENT ON TABLE judge_sessions IS '评委会话表 - 管理评委登录会话';
COMMENT ON COLUMN judge_sessions.id IS '会话ID，主键';
COMMENT ON COLUMN judge_sessions.session_token IS '会话令牌，用于身份验证';
COMMENT ON COLUMN judge_sessions.judge_id IS '关联的评委ID';
COMMENT ON COLUMN judge_sessions.user_id IS '登录的用户ID，关联users表';
COMMENT ON COLUMN judge_sessions.ip_address IS '登录IP地址';
COMMENT ON COLUMN judge_sessions.user_agent IS '浏览器用户代理信息';
COMMENT ON COLUMN judge_sessions.started_at IS '会话开始时间';
COMMENT ON COLUMN judge_sessions.expires_at IS '会话过期时间';
COMMENT ON COLUMN judge_sessions.is_active IS '会话是否激活';
COMMENT ON COLUMN judge_sessions.ended_at IS '会话结束时间';

-- =====================================================
-- 3. 修改 scores 表 - 添加评委会话相关字段
-- =====================================================

-- 检查列是否已存在，如果不存在则添加
DO $$ 
BEGIN
    -- 添加 judge_session_id 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' 
        AND column_name = 'judge_session_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE scores ADD COLUMN judge_session_id INTEGER;
        ALTER TABLE scores ADD CONSTRAINT fk_scores_judge_session 
            FOREIGN KEY (judge_session_id) REFERENCES judge_sessions(id) ON DELETE SET NULL;
    END IF;
    
    -- 添加 judge_name 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' 
        AND column_name = 'judge_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE scores ADD COLUMN judge_name VARCHAR(100);
    END IF;
END $$;

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_scores_judge_session ON scores(judge_session_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_name ON scores(judge_name);

-- 添加字段注释
COMMENT ON COLUMN scores.judge_session_id IS '评委会话ID，关联judge_sessions表';
COMMENT ON COLUMN scores.judge_name IS '评委姓名，冗余字段便于查询';

-- =====================================================
-- 4. 修改 users 表 - 添加评委账号标识字段
-- =====================================================

-- 检查列是否已存在，如果不存在则添加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_judge_account'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN is_judge_account BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_users_judge_account ON users(is_judge_account);

-- 添加字段注释
COMMENT ON COLUMN users.is_judge_account IS '是否为评委通用账号标识';

-- =====================================================
-- 5. 插入初始评委数据
-- =====================================================

-- 插入示例评委数据（如果不存在）
INSERT INTO judges (name, display_name, code, is_active) 
VALUES 
    ('张三', '张三评委', 'J001', true),
    ('李四', '李四评委', 'J002', true),
    ('王五', '王五评委', 'J003', true),
    ('赵六', '赵六评委', 'J004', true),
    ('钱七', '钱七评委', 'J005', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 6. 创建评委通用账号（如果不存在）
-- =====================================================

-- 插入评委通用账号
INSERT INTO users (username, email, password_hash, role, is_judge_account, created_at, updated_at)
VALUES (
    'judge', 
    'judge@scoring-system.com', 
    '$2b$10$rQZ8kHWfQxwjQxwjQxwjQOeKm5rQZ8kHWfQxwjQxwjQxwjQOeKm5r', -- 默认密码: judge123
    'judge', 
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET 
    is_judge_account = true,
    updated_at = CURRENT_TIMESTAMP;

-- 为现有的评委角色用户添加标记（可选）
UPDATE users 
SET is_judge_account = true, updated_at = CURRENT_TIMESTAMP
WHERE role = 'judge' AND email LIKE '%judge%';

-- =====================================================
-- 7. 创建用于清理过期会话的函数
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_judge_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除过期的会话
    DELETE FROM judge_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 将过期但仍标记为活跃的会话设为非活跃
    UPDATE judge_sessions 
    SET is_active = false, ended_at = CURRENT_TIMESTAMP
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION cleanup_expired_judge_sessions() IS '清理过期的评委会话记录';

-- =====================================================
-- 8. 创建获取活跃评委的视图
-- =====================================================

CREATE OR REPLACE VIEW active_judges AS
SELECT 
    j.id,
    j.name,
    j.display_name,
    j.code,
    j.created_at,
    j.updated_at,
    CASE 
        WHEN js.id IS NOT NULL THEN true 
        ELSE false 
    END as is_currently_active,
    js.started_at as last_session_start,
    js.expires_at as session_expires_at
FROM judges j
LEFT JOIN judge_sessions js ON j.id = js.judge_id 
    AND js.is_active = true 
    AND js.expires_at > CURRENT_TIMESTAMP
WHERE j.is_active = true
ORDER BY j.code;

-- 添加视图注释
COMMENT ON VIEW active_judges IS '活跃评委视图 - 显示所有激活的评委及其当前会话状态';

-- =====================================================
-- 9. 创建评委会话统计视图
-- =====================================================

CREATE OR REPLACE VIEW judge_session_stats AS
SELECT 
    j.id as judge_id,
    j.name,
    j.code,
    COUNT(js.id) as total_sessions,
    COUNT(CASE WHEN js.is_active = true THEN 1 END) as active_sessions,
    MAX(js.started_at) as last_login,
    SUM(CASE 
        WHEN js.ended_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (js.ended_at - js.started_at))/3600
        WHEN js.is_active = true THEN 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - js.started_at))/3600
        ELSE 0 
    END) as total_hours
FROM judges j
LEFT JOIN judge_sessions js ON j.id = js.judge_id
WHERE j.is_active = true
GROUP BY j.id, j.name, j.code
ORDER BY j.code;

-- 添加视图注释
COMMENT ON VIEW judge_session_stats IS '评委会话统计视图 - 显示每个评委的会话统计信息';

-- =====================================================
-- 10. 创建触发器函数 - 自动更新 updated_at 字段
-- =====================================================

-- 创建通用的更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 judges 表创建触发器
DROP TRIGGER IF EXISTS trigger_judges_updated_at ON judges;
CREATE TRIGGER trigger_judges_updated_at
    BEFORE UPDATE ON judges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. 设置行级安全策略 (RLS) - 可选
-- =====================================================

-- 启用行级安全 (如果需要)
-- ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE judge_sessions ENABLE ROW LEVEL SECURITY;

-- 创建策略示例 (根据需要调整)
-- CREATE POLICY "judges_select_policy" ON judges FOR SELECT USING (is_active = true);
-- CREATE POLICY "judge_sessions_select_policy" ON judge_sessions FOR SELECT USING (is_active = true);

-- =====================================================
-- 12. 验证数据完整性
-- =====================================================

-- 检查创建的表
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('judges', 'judge_sessions');
    
    IF table_count = 2 THEN
        RAISE NOTICE '✅ 成功创建 judges 和 judge_sessions 表';
    ELSE
        RAISE EXCEPTION '❌ 表创建失败，请检查错误信息';
    END IF;
END $$;

-- 检查插入的数据
DO $$
DECLARE
    judge_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO judge_count FROM judges;
    SELECT COUNT(*) INTO user_count FROM users WHERE is_judge_account = true;
    
    RAISE NOTICE '📊 插入了 % 个评委记录', judge_count;
    RAISE NOTICE '📊 创建了 % 个评委账号', user_count;
END $$;

-- 提交事务
COMMIT;

-- =====================================================
-- 迁移完成提示
-- =====================================================

-- 显示迁移结果
SELECT 
    '🎉 评委身份系统数据库迁移完成！' as status,
    CURRENT_TIMESTAMP as completed_at;

-- 显示创建的表信息
SELECT 
    table_name as "创建的表",
    CASE 
        WHEN table_name = 'judges' THEN '评委信息表'
        WHEN table_name = 'judge_sessions' THEN '评委会话表'
        ELSE '其他表'
    END as "说明"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('judges', 'judge_sessions')
ORDER BY table_name;

-- 显示插入的评委数据
SELECT 
    code as "评委代码",
    name as "评委姓名", 
    display_name as "显示名称",
    is_active as "是否激活"
FROM judges 
ORDER BY code;

-- 显示评委账号信息
SELECT 
    username as "用户名",
    email as "邮箱",
    role as "角色",
    is_judge_account as "是否评委账号"
FROM users 
WHERE is_judge_account = true;

-- =====================================================
-- 使用说明
-- =====================================================

/*
🚀 使用说明：

1. 在 Supabase SQL 编辑器中运行此脚本
2. 脚本会自动创建所需的表和索引
3. 插入示例评委数据和评委通用账号
4. 创建相关的视图和函数

📋 创建的表：
- judges: 评委信息表
- judge_sessions: 评委会话表
- 修改 scores 表：添加 judge_session_id 和 judge_name 字段
- 修改 users 表：添加 is_judge_account 字段

🔧 创建的功能：
- cleanup_expired_judge_sessions(): 清理过期会话的函数
- active_judges: 活跃评委视图
- judge_session_stats: 评委会话统计视图
- 自动更新 updated_at 字段的触发器

🔑 默认账号：
- 用户名: judge
- 邮箱: judge@scoring-system.com  
- 密码: judge123 (请在生产环境中修改)

📊 示例评委：
- J001: 张三评委
- J002: 李四评委  
- J003: 王五评委
- J004: 赵六评委
- J005: 钱七评委

⚠️ 注意事项：
1. 请在生产环境中修改默认密码
2. 根据实际需求调整评委信息
3. 考虑启用行级安全策略 (RLS)
4. 定期运行 cleanup_expired_judge_sessions() 清理过期会话
*/