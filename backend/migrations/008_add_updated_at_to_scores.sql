-- Migration: Add updated_at column to scores table
-- Purpose: Support partial score updates with timestamp tracking
-- Date: 2024

-- Add updated_at column to scores table
ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have updated_at = submitted_at
UPDATE scores 
SET updated_at = submitted_at 
WHERE updated_at IS NULL;

-- Create index for updated_at for performance
CREATE INDEX IF NOT EXISTS idx_scores_updated ON scores(updated_at DESC);

-- Add comment
COMMENT ON COLUMN scores.updated_at IS 'Timestamp when the score was last updated (for partial updates)';
