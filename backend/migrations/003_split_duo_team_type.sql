-- Migration: Split duo_team into duo and team
-- Date: 2026-04-14
-- Description: Update competition_type constraint to support duo and team separately

-- 1. Drop the old constraint
ALTER TABLE competitions 
DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

-- 2. Add new constraint with duo and team
ALTER TABLE competitions 
ADD CONSTRAINT competitions_competition_type_check 
CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 3. Migrate existing duo_team data (if any)
-- Option A: Migrate all to duo (default)
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';

-- Option B: Migrate based on athlete count (uncomment if preferred)
-- UPDATE competitions c
-- SET competition_type = CASE 
--   WHEN (SELECT COUNT(*) FROM competition_athletes WHERE competition_id = c.id) <= 2 
--   THEN 'duo'
--   ELSE 'team'
-- END
-- WHERE competition_type = 'duo_team';

-- 4. Verify the migration
SELECT competition_type, COUNT(*) as count
FROM competitions
GROUP BY competition_type
ORDER BY competition_type;
