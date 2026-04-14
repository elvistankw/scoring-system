-- Test SQL query to verify athlete_count works
SELECT c.*, 
       COALESCE((SELECT COUNT(*) FROM competition_athletes ca WHERE ca.competition_id = c.id), 0) as athlete_count
FROM competitions c 
WHERE 1=1
ORDER BY c.created_at DESC
LIMIT 5;
