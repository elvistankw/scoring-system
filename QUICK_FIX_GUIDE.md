# 🚀 快速修复指南（2分钟）

## 问题
创建比赛时出错：`violates check constraint`

## 解决方案

### 📋 需要执行的SQL（3行）

打开 `COPY_PASTE_THIS.txt` 文件，复制里面的3行SQL。

或者直接复制这里的：

```sql
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

### 🔧 执行方式

#### 选项A：使用 psql（命令行）

```bash
psql -U postgres -d scoring
```

然后粘贴3行SQL，按回车。

#### 选项B：使用图形界面工具

1. 打开你的数据库工具（pgAdmin、DBeaver、TablePlus等）
2. 连接到数据库 **scoring**
3. 打开SQL查询窗口
4. 粘贴3行SQL
5. 点击执行

### ✅ 完成

刷新前端页面，现在可以创建比赛了！

---

## 📚 详细文档

- `COPY_PASTE_THIS.txt` - 只包含SQL，方便复制
- `backend/SIMPLE_FIX.sql` - 带注释的SQL
- `HOW_TO_FIX_DATABASE.md` - 详细步骤和故障排除

## 💡 数据库信息

- 数据库名：`scoring`
- 用户：`postgres`
- 密码：`etkw1234`
- 主机：`localhost`
- 端口：`5432`

## ❓ 常见问题

**Q: 找不到 psql 命令**
A: 需要安装 PostgreSQL 或将其添加到系统PATH

**Q: 连接被拒绝**
A: 确保 PostgreSQL 服务正在运行

**Q: 权限不足**
A: 使用 postgres 超级用户账号

**Q: 表不存在**
A: 确认连接到了正确的数据库 `scoring`
