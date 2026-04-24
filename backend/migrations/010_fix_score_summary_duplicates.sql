-- ============================================================================
-- Migration: Fix Score Summary Duplicate Display Issue
-- Date: 2026-04-24
-- Description: 
--   Fixes the issue where same judge's scores appear 3 times in Score Summary
--   by ensuring queries use DISTINCT ON and filter judge_sessions properly
-- ============================================================================

-- Step 1: Verify the problem exists
-- This query shows if there are duplicate score entries due to multiple judge sessions
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT s.id, COUNT(*) as occurrence_count
    FROM scores s
    LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
    GROUP BY s.id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '🔍 Found % score(s) that would appear as duplicates due to multiple judge sessions', duplicate_count;
END $$;

-- Step 2: Show example of the problem (if any)
SELECT 
  s.id as score_id,
  s.athlete_id,
  a.name as athlete_name,
  s.judge_id,
  COALESCE(u.username, js.judge_name) as judge_name,
  js.id as session_id,
  js.started_at,
  js.ended_at,
  CASE WHEN js.ended_at IS NULL THEN 'Active' ELSE 'Ended' END as session_status,
  s.submitted_at
FROM scores s
INNER JOIN athletes a ON s.athlete_id = a.id
LEFT JOIN users u ON s.judge_id = u.id
LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
INNER JOIN competitions c ON s.competition_id = c.id
WHERE s.id IN (
  -- Find scores that have multiple judge sessions
  SELECT s2.id
  FROM scores s2
  LEFT JOIN judge_sessions js2 ON s2.judge_id = js2.judge_id
  GROUP BY s2.id
  HAVING COUNT(js2.id) > 1
  LIMIT 5
)
ORDER BY s.id, js.started_at DESC;

-- Step 3: Create a helper function to get scores without duplicates
-- This function demonstrates the correct query pattern
CREATE OR REPLACE FUNCTION get_scores_without_duplicates(
  p_competition_id INTEGER DEFAULT NULL,
  p_athlete_id INTEGER DEFAULT NULL,
  p_judge_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  competition_id INTEGER,
  athlete_id INTEGER,
  judge_id INTEGER,
  action_difficulty NUMERIC,
  stage_artistry NUMERIC,
  action_creativity NUMERIC,
  action_fluency NUMERIC,
  costume_styling NUMERIC,
  action_interaction NUMERIC,
  submitted_at TIMESTAMP,
  athlete_name VARCHAR,
  athlete_number VARCHAR,
  judge_name VARCHAR,
  competition_type VARCHAR,
  competition_name VARCHAR,
  region VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (s.id)
    s.id,
    s.competition_id,
    s.athlete_id,
    s.judge_id,
    s.action_difficulty,
    s.stage_artistry,
    s.action_creativity,
    s.action_fluency,
    s.costume_styling,
    s.action_interaction,
    s.submitted_at,
    a.name as athlete_name,
    a.athlete_number,
    COALESCE(u.username, js.judge_name) as judge_name,
    c.competition_type,
    c.name as competition_name,
    c.region
  FROM scores s
  INNER JOIN athletes a ON s.athlete_id = a.id
  LEFT JOIN users u ON s.judge_id = u.id
  LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id AND js.ended_at IS NULL
  INNER JOIN competitions c ON s.competition_id = c.id
  WHERE 
    (p_competition_id IS NULL OR s.competition_id = p_competition_id)
    AND (p_athlete_id IS NULL OR s.athlete_id = p_athlete_id)
    AND (p_judge_id IS NULL OR s.judge_id = p_judge_id)
  ORDER BY s.id, s.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Test the helper function
DO $$
DECLARE
  test_competition_id INTEGER;
  test_athlete_id INTEGER;
  result_count INTEGER;
BEGIN
  -- Get a test competition and athlete
  SELECT id INTO test_competition_id FROM competitions LIMIT 1;
  SELECT id INTO test_athlete_id FROM athletes LIMIT 1;
  
  IF test_competition_id IS NOT NULL AND test_athlete_id IS NOT NULL THEN
    SELECT COUNT(*) INTO result_count
    FROM get_scores_without_duplicates(test_competition_id, test_athlete_id, NULL);
    
    RAISE NOTICE '✅ Helper function test: Found % score(s) for competition % and athlete %', 
      result_count, test_competition_id, test_athlete_id;
  ELSE
    RAISE NOTICE '⚠️  No test data available';
  END IF;
END $$;

-- Step 5: Create an index to optimize the DISTINCT ON query
-- This index supports the ORDER BY clause in DISTINCT ON queries
CREATE INDEX IF NOT EXISTS idx_scores_id_submitted_at 
ON scores(id, submitted_at DESC);

-- Step 6: Create an index on judge_sessions for the filter
CREATE INDEX IF NOT EXISTS idx_judge_sessions_judge_id_ended_at 
ON judge_sessions(judge_id, ended_at);

-- Step 7: Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('scores', 'judge_sessions')
  AND indexname IN ('idx_scores_id_submitted_at', 'idx_judge_sessions_judge_id_ended_at')
ORDER BY tablename, indexname;

-- Step 8: Show statistics
DO $$
DECLARE
  total_scores INTEGER;
  total_sessions INTEGER;
  active_sessions INTEGER;
  ended_sessions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_scores FROM scores;
  SELECT COUNT(*) INTO total_sessions FROM judge_sessions;
  SELECT COUNT(*) INTO active_sessions FROM judge_sessions WHERE ended_at IS NULL;
  SELECT COUNT(*) INTO ended_sessions FROM judge_sessions WHERE ended_at IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Statistics:';
  RAISE NOTICE '   Total Scores: %', total_scores;
  RAISE NOTICE '   Total Judge Sessions: %', total_sessions;
  RAISE NOTICE '   Active Sessions: %', active_sessions;
  RAISE NOTICE '   Ended Sessions: %', ended_sessions;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Summary of Changes:';
  RAISE NOTICE '   1. Created helper function: get_scores_without_duplicates()';
  RAISE NOTICE '   2. Added index: idx_scores_id_submitted_at';
  RAISE NOTICE '   3. Added index: idx_judge_sessions_judge_id_ended_at';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Backend Code Changes Required:';
  RAISE NOTICE '   Update backend/controllers/scores.controller.js:';
  RAISE NOTICE '   - Add DISTINCT ON (s.id) to SELECT clause';
  RAISE NOTICE '   - Add AND js.ended_at IS NULL to judge_sessions JOIN';
  RAISE NOTICE '   - Update ORDER BY to: ORDER BY s.id, s.submitted_at DESC';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these queries to verify the fix is working
-- ============================================================================

-- Query 1: Compare old vs new approach
-- This shows the difference between the old query (with duplicates) and new query (without)
COMMENT ON FUNCTION get_scores_without_duplicates IS 
'Helper function that demonstrates the correct query pattern to avoid duplicate scores in Score Summary. 
Use this as a reference for updating the backend API queries.';

-- Query 2: Test query for a specific athlete
-- Replace the IDs with actual values from your database
/*
SELECT * FROM get_scores_without_duplicates(
  p_competition_id := 1,  -- Replace with actual competition ID
  p_athlete_id := 1,      -- Replace with actual athlete ID
  p_judge_id := NULL
);
*/

-- Query 3: Check for any remaining duplicates
-- This should return 0 rows if the fix is working correctly
/*
SELECT 
  s.id,
  COUNT(*) as duplicate_count
FROM scores s
LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id AND js.ended_at IS NULL
GROUP BY s.id
HAVING COUNT(*) > 1;
*/
