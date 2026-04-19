-- Fix unique constraint issue in judge_sessions table
-- The current constraint doesn't work properly with boolean values

-- Drop the problematic constraint
ALTER TABLE judge_sessions DROP CONSTRAINT IF EXISTS unique_active_judge;

-- Create a partial unique index instead (only for active sessions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_judge 
ON judge_sessions (judge_id) 
WHERE is_active = true;

-- Add comment
COMMENT ON INDEX idx_unique_active_judge IS 'Ensures only one active session per judge (device locking)';