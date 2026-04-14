# 修复比赛类型错误

## 🐛 问题

创建比赛时出现错误：
```
new row for relation "competitions" violates check constraint "competitions_competition_type_check"
```

## 🔍 原因

数据库的 CHECK 约束仍然只允许旧的类型：`individual`, `duo_team`, `challenge`

但代码已更新为：`individual`, `duo`, `team`, `challenge`

## ✅ 解决方案

需要更新数据库约束。请按以下步骤操作：

### 方法1：使用数据库管理工具（推荐）

1. 打开你的数据库管理工具（pgAdmin、DBeaver等）
2. 连接到数据库
3. 执行以下SQL命令：

```sql
-- 1. 删除旧约束
ALTER TABLE competitions 
DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

-- 2. 添加新约束
ALTER TABLE competitions 
ADD CONSTRAINT competitions_competition_type_check 
CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 3. 迁移现有数据（如果有duo_team类型的比赛）
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';

-- 4. 验证
SELECT competition_type, COUNT(*) 
FROM competitions 
GROUP BY competition_type;
```

### 方法2：使用 psql 命令行

```bash
# 连接到数据库
psql -U your_username -d your_database_name

# 然后执行上面的SQL命令
```

### 方法3：临时回退（不推荐）

如果暂时无法执行SQL，可以临时回退代码：

1. 在 `interface/competition.ts` 中：
```typescript
export type CompetitionType = 'individual' | 'duo_team' | 'challenge';
```

2. 在翻译文件中恢复 `duoTeam` 相关的翻译

但这样会失去"区分双人和团体"的功能。

## 📋 执行后的验证

1. 尝试创建一个双人赛（duo）
2. 尝试创建一个团体赛（team）
3. 确认两种类型都能成功创建

## 🔄 后续步骤

执行SQL后：
1. 清除Redis缓存：`node backend/clear-competition-cache.js`
2. 刷新前端页面
3. 测试创建新比赛

## 💡 提示

- 执行SQL前建议备份数据库
- 如果有现有的 `duo_team` 比赛，它们会被自动迁移为 `duo`
- 可以在管理界面手动修改比赛类型（从duo改为team，或反之）

## 📞 需要帮助？

如果遇到问题，请检查：
1. 数据库连接是否正常
2. 是否有足够的权限执行 ALTER TABLE
3. 是否有其他约束或触发器影响

