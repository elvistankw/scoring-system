-- Migration: Fix scores table judge_id foreign key
-- Change judge_id to reference judges table instead of users table
-- This allows device-based judge sessions to submit scores

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE scores 
DROP CONSTRAINT IF EXISTS scores_judge_id_fkey;

-- Step 2: Add new foreign key constraint referencing judges table
ALTER TABLE scores 
ADD CONSTRAINT scores_judge_id_fkey 
FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE;

-- Note: This migration assumes:
-- 1. All existing scores have judge_id values that exist in the judges table
-- 2. If there are orphaned records, they need to be cleaned up first
