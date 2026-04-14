# 如何修复数据库约束

## 🎯 问题

创建比赛时出现错误：
```
relation "competitions" violates check constraint "competitions_competition_type_check"
```

## ✅ 解决方案（3步骤，2分钟）

### 方法1：使用 psql 命令行（推荐）

```bash
# 连接到数据库（一步完成）
psql -U postgres -d scoring

# 然后复制粘贴以下3条SQL命令：
```

```sql
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

```bash
# 验证（可选）
SELECT competition_type, COUNT(*) FROM competitions GROUP BY competition_type;

# 退出
\q
```

### 方法2：使用 pgAdmin

1. 打开 pgAdmin
2. 展开服务器 → PostgreSQL → 数据库 → **scoring**
3. 右键 **scoring** → Query Tool
4. 复制粘贴 `backend/SIMPLE_FIX.sql` 中的3条SQL
5. 点击执行按钮（▶️）或按 F5

### 方法3：使用 DBeaver

1. 打开 DBeaver
2. 连接到 PostgreSQL 服务器
3. 展开数据库，找到 **scoring**
4. 右键 **scoring** → SQL Editor → New SQL Script
5. 复制粘贴 `backend/SIMPLE_FIX.sql` 中的3条SQL
6. 点击执行（Ctrl+Enter）

### 方法4：使用 TablePlus

1. 打开 TablePlus
2. 连接到 PostgreSQL，选择数据库 **scoring**
3. 点击 SQL 按钮（或 Cmd/Ctrl + K）
4. 复制粘贴 `backend/SIMPLE_FIX.sql` 中的3条SQL
5. 点击 Run（或 Cmd/Ctrl + Enter）

### 方法5：使用 Windows 命令行

```cmd
REM 打开命令提示符或PowerShell
REM 导航到 PostgreSQL bin 目录（通常在 C:\Program Files\PostgreSQL\版本号\bin）

cd "C:\Program Files\PostgreSQL\16\bin"

REM 连接到数据库
psql.exe -U postgres -d scoring

REM 然后粘贴3条SQL命令
```

## 📋 需要执行的SQL

文件位置：`backend/SIMPLE_FIX.sql`

```sql
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;
ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));
UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

## 🔍 验证是否成功

执行后，运行：
```sql
SELECT competition_type, COUNT(*) FROM competitions GROUP BY competition_type;
```

应该看到：
- `individual` - 个人赛
- `duo` - 双人赛
- `team` - 团体赛（如果有）
- `challenge` - 挑战赛

**不应该**看到 `duo_team`

## 🚀 完成后

1. 刷新前端页面
2. 尝试创建新比赛
3. 应该可以选择：个人赛、双人舞台赛、团体赛、挑战赛

## ⚠️ 如果仍然出错

### 错误1：relation "competitions" does not exist

**原因**：连接到了错误的数据库

**解决**：
```bash
# 查看所有数据库
psql -U postgres -l

# 确保连接到 scoring 数据库
psql -U postgres -d scoring
```

### 错误2：permission denied

**原因**：没有权限修改表结构

**解决**：使用 postgres 超级用户或数据库所有者账号

### 错误3：constraint does not exist

**原因**：约束名称可能不同

**解决**：
```sql
-- 查看所有约束
SELECT conname FROM pg_constraint WHERE conrelid = 'competitions'::regclass;

-- 使用实际的约束名称
ALTER TABLE competitions DROP CONSTRAINT actual_constraint_name;
```

## 💡 数据库连接信息

根据 `backend/.env` 文件：
- 主机：localhost
- 端口：5432
- 数据库：scoring
- 用户：postgres
- 密码：etkw1234

## 📞 需要帮助？

如果遇到问题：
1. 检查数据库是否正在运行
2. 检查连接信息是否正确
3. 确认有足够的权限
4. 查看后端日志获取详细错误信息

