-- Google集成数据库迁移
-- 创建用户Google令牌表

CREATE TABLE IF NOT EXISTS user_google_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    google_email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON user_google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_expires_at ON user_google_tokens(expires_at);

-- 添加注释
COMMENT ON TABLE user_google_tokens IS '用户Google OAuth令牌存储表';
COMMENT ON COLUMN user_google_tokens.user_id IS '关联的用户ID';
COMMENT ON COLUMN user_google_tokens.access_token IS 'Google访问令牌';
COMMENT ON COLUMN user_google_tokens.refresh_token IS 'Google刷新令牌';
COMMENT ON COLUMN user_google_tokens.google_email IS '用户的Google邮箱';
COMMENT ON COLUMN user_google_tokens.expires_at IS '令牌过期时间';