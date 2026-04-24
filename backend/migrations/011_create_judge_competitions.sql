-- Migration: 011_create_judge_competitions.sql
-- Description: Create judge_competitions table to manage which competitions each judge can score
-- Created: 2026-04-24
-- Purpose: Restrict judges to specific competitions assigned by admin

-- ============================================================================
-- TABLE: judge_competitions
-- Description: Many-to-many relationship between judges and competitions
-- Purpose: Control which competitions each judge is allowed to score
-- ============================================================================
CREATE TABLE IF NOT EXISTS judge_competitions (
    id SERIAL PRIMARY KEY,
    judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    -- Ensure a judge can only be assigned to a competition once
    UNIQUE(judge_id, competition_id)
);

-- Indexes for judge_competitions table
CREATE INDEX IF NOT EXISTS idx_judge_competitions_judge ON judge_competitions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_competitions_competition ON judge_competitions(competition_id);
CREATE INDEX IF NOT EXISTS idx_judge_competitions_assigned_by ON judge_competitions(assigned_by);
CREATE INDEX IF NOT EXISTS idx_judge_competitions_assigned_at ON judge_competitions(assigned_at);

-- Comments
COMMENT ON TABLE judge_competitions IS 'Manages which competitions each judge is authorized to score';
COMMENT ON COLUMN judge_competitions.judge_id IS 'Reference to the judge';
COMMENT ON COLUMN judge_competitions.competition_id IS 'Reference to the competition';
COMMENT ON COLUMN judge_competitions.assigned_by IS 'Admin user who assigned this permission';
COMMENT ON COLUMN judge_competitions.assigned_at IS 'When the permission was granted';
COMMENT ON COLUMN judge_competitions.notes IS 'Optional notes about this assignment';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
