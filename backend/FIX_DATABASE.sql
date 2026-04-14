-- ============================================
-- 修复数据库约束：支持 duo 和 team 类型
-- 执行此SQL以修复比赛类型错误
-- ============================================

-- 注意：在psql中使用 \c scoring 切换数据库
-- 或者在连接时指定：psql -U postgres -d scoring

-- 步骤1: 查看当前约束
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'competitions'::regclass;

-- 步骤2: 删除旧的约束
ALTER TABLE competitions 
DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

-- 步骤3: 添加新的约束（支持 duo 和 team）
ALTER TABLE competitions 
ADD CONSTRAINT competitions_competition_type_check 
CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 步骤4: 迁移现有的 duo_team 数据为 duo
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';

-- 步骤5: 验证结果
SELECT 
  competition_type,
  COUNT(*) as count
FROM competitions 
GROUP BY competition_type
ORDER BY competition_type;

-- 步骤6: 显示所有比赛
SELECT id, name, competition_type, region, status 
FROM competitions 
ORDER BY id DESC 
LIMIT 10;

-- ============================================
-- 完成！
-- 现在可以创建 duo 和 team 类型的比赛了
-- ============================================
