-- Create judge sessions table for managing judge identity selection and sessions
-- This enables proper judge identity tracking and session management

CREATE TABLE IF NOT EXISTS judge_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    judge_name VARCHAR(255) NOT NULL,
    judge_code VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '8 hours'),
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_sessions_user_id ON judge_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_judge_id ON judge_sessions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_token ON judge_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_active ON judge_sessions(is_active, expires_at);

-- Add judge_session_id to scores table for tracking
ALTER TABLE scores ADD COLUMN IF NOT EXISTS judge_session_id INTEGER REFERENCES judge_sessions(id);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS judge_name VARCHAR(255);

-- Create index for scores judge session tracking
CREATE INDEX IF NOT EXISTS idx_scores_judge_session ON scores(judge_session_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_judge_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_judge_sessions_updated_at
    BEFORE UPDATE ON judge_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_judge_sessions_updated_at();

-- Insert sample judges if they don't exist
INSERT INTO judges (name, display_name, code, is_active) VALUES
('张三', '张三评委', 'J001', true),
('李四', '李四评委', 'J002', true),
('王五', '王五评委', 'J003', true),
('赵六', '赵六评委', 'J004', true),
('钱七', '钱七评委', 'J005', true)
ON CONFLICT (code) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE judge_sessions IS 'Judge identity sessions for tracking judge selection and scoring sessions';
COMMENT ON COLUMN judge_sessions.session_token IS 'Unique session token for judge identity verification';
COMMENT ON COLUMN judge_sessions.expires_at IS 'Session expiration time (default 8 hours)';
COMMENT ON COLUMN judge_sessions.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN scores.judge_session_id IS 'Reference to the judge session that submitted this score';
COMMENT ON COLUMN scores.judge_name IS 'Name of the judge who submitted this score (for easy querying)';