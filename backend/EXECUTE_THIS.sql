-- ============================================
-- 执行此SQL以修复比赛类型错误
-- 日期: 2026-04-14
-- ============================================

-- 步骤1: 删除旧的约束
ALTER TABLE competitions 
DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

-- 步骤2: 添加新的约束（支持 duo 和 team）
ALTER TABLE competitions 
ADD CONSTRAINT competitions_competition_type_check 
CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 步骤3: 迁移现有的 duo_team 数据为 duo
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';

-- 步骤4: 验证结果
SELECT 
  competition_type,
  COUNT(*) as count,
  CASE 
    WHEN competition_type = 'individual' THEN '个人赛'
    WHEN competition_type = 'duo' THEN '双人赛'
    WHEN competition_type = 'team' THEN '团体赛'
    WHEN competition_type = 'challenge' THEN '挑战赛'
    ELSE competition_type
  END as type_name
FROM competitions 
GROUP BY competition_type
ORDER BY competition_type;

-- ============================================
-- 执行完成后，你应该看到类似这样的结果：
-- 
--  competition_type | count | type_name
-- ------------------+-------+-----------
--  challenge        |   X   | 挑战赛
--  duo              |   X   | 双人赛
--  individual       |   X   | 个人赛
--  team             |   X   | 团体赛
-- 
-- 如果看到 duo_team，说明迁移未成功
-- ============================================
