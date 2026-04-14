-- 简单修复：只需复制粘贴这3行SQL
-- 注意：确保已经连接到 scoring 数据库

-- 1. 删除旧约束
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

-- 2. 添加新约束
ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 3. 迁移现有数据
UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
