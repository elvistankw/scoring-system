# ⚠️ 需要立即执行数据库迁移

## 🚨 当前状态

创建比赛时会出现错误，因为数据库约束尚未更新。

## ✅ 快速修复（2分钟）

### 步骤1：打开数据库管理工具

使用以下任一工具：
- pgAdmin
- DBeaver  
- TablePlus
- psql 命令行
- 或任何PostgreSQL客户端

### 步骤2：执行SQL

打开文件 `backend/EXECUTE_THIS.sql` 并执行其中的SQL命令。

或者直接复制粘贴以下命令：

```sql
-- 删除旧约束
ALTER TABLE competitions 
DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

-- 添加新约束
ALTER TABLE competitions 
ADD CONSTRAINT competitions_competition_type_check 
CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 迁移现有数据
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';
```

### 步骤3：验证

执行后，运行：
```sql
SELECT competition_type, COUNT(*) 
FROM competitions 
GROUP BY competition_type;
```

应该看到：`individual`, `duo`, `team`, `challenge`（不应该有 `duo_team`）

### 步骤4：清除缓存并测试

```bash
# 清除缓存
node backend/clear-competition-cache.js

# 刷新前端页面，尝试创建比赛
```

## 📋 完成后

- ✅ 可以创建"双人舞台赛"（duo）
- ✅ 可以创建"团体赛"（team）
- ✅ 两种类型使用相同的评分标准
- ✅ 不再混淆

## 🔍 如果仍有问题

检查后端日志：
```bash
# 查看最新的错误
tail -f backend/logs/error.log
```

或查看进程输出中的错误信息。

## 💡 为什么需要这个？

我们将 `duo_team`（双人/团队）拆分为：
- `duo` - 双人舞台赛
- `team` - 团体赛

这样更清晰，不会混淆。但数据库约束需要手动更新。

