-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for Realtime Scoring System
-- Created: 2024
-- Requirements: 2.1, 2.2, 2.6, 10.4, 10.5

-- ============================================================================
-- TABLE: users
-- Description: Stores admin and judge user accounts with authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'judge')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================================
-- TABLE: competitions
-- Description: Stores competition events with type, region, and status
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    competition_type VARCHAR(20) NOT NULL CHECK (
        competition_type IN ('individual', 'duo_team', 'challenge')
    ),
    region VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (
        status IN ('upcoming', 'active', 'completed')
    ),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for competitions table
CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(competition_type);
CREATE INDEX IF NOT EXISTS idx_competitions_region ON competitions(region);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_created_by ON competitions(created_by);
CREATE INDEX IF NOT EXISTS idx_competitions_start_date ON competitions(start_date);

-- ============================================================================
-- TABLE: athletes
-- Description: Stores athlete/team information
-- ============================================================================
CREATE TABLE IF NOT EXISTS athletes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    athlete_number VARCHAR(20) UNIQUE,
    team_name VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for athletes table
CREATE INDEX IF NOT EXISTS idx_athletes_number ON athletes(athlete_number);
CREATE INDEX IF NOT EXISTS idx_athletes_name ON athletes(name);
CREATE INDEX IF NOT EXISTS idx_athletes_team_name ON athletes(team_name);

-- ============================================================================
-- TABLE: competition_athletes
-- Description: Many-to-many relationship between competitions and athletes
-- ============================================================================
CREATE TABLE IF NOT EXISTS competition_athletes (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competition_id, athlete_id)
);

-- Indexes for competition_athletes table
CREATE INDEX IF NOT EXISTS idx_comp_athletes_comp ON competition_athletes(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_athletes_athlete ON competition_athletes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_comp_athletes_reg_date ON competition_athletes(registration_date);

-- ============================================================================
-- TABLE: scores
-- Description: Stores judge scores for athletes in competitions
-- Supports three competition types with different scoring dimensions:
-- - Individual: action_difficulty, stage_artistry, action_creativity, 
--               action_fluency, costume_styling
-- - Duo/Team: action_difficulty, stage_artistry, action_interaction,
--             action_creativity, costume_styling
-- - Challenge: action_difficulty, action_creativity, action_fluency
-- ============================================================================
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    judge_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Individual Stage & Duo/Team dimensions
    action_difficulty DECIMAL(5,2),
    stage_artistry DECIMAL(5,2),
    action_creativity DECIMAL(5,2),
    action_fluency DECIMAL(5,2),
    costume_styling DECIMAL(5,2),
    
    -- Duo/Team specific dimension
    action_interaction DECIMAL(5,2),
    
    -- Metadata
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: One score per judge per athlete per competition
    CONSTRAINT unique_judge_athlete_score UNIQUE(competition_id, athlete_id, judge_id)
);

-- Indexes for scores table (performance optimization)
CREATE INDEX IF NOT EXISTS idx_scores_competition ON scores(competition_id);
CREATE INDEX IF NOT EXISTS idx_scores_athlete ON scores(athlete_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_submitted ON scores(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_comp_athlete ON scores(competition_id, athlete_id);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athletes_updated_at
    BEFORE UPDATE ON athletes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS: Document table purposes
-- ============================================================================
COMMENT ON TABLE users IS 'Stores admin and judge user accounts';
COMMENT ON TABLE competitions IS 'Stores competition events with type and region';
COMMENT ON TABLE athletes IS 'Stores athlete and team information';
COMMENT ON TABLE competition_athletes IS 'Many-to-many relationship between competitions and athletes';
COMMENT ON TABLE scores IS 'Stores judge scores with multiple dimensions per competition type';

COMMENT ON COLUMN scores.action_difficulty IS 'Difficulty score (all competition types)';
COMMENT ON COLUMN scores.stage_artistry IS 'Artistry score (individual, duo_team)';
COMMENT ON COLUMN scores.action_creativity IS 'Creativity score (all competition types)';
COMMENT ON COLUMN scores.action_fluency IS 'Fluency score (individual, challenge)';
COMMENT ON COLUMN scores.costume_styling IS 'Costume score (individual, duo_team)';
COMMENT ON COLUMN scores.action_interaction IS 'Interaction score (duo_team only)';
