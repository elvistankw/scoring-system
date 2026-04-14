# 📋 当前项目状态

## ✅ 已完成的工作

### 1. 比赛类型拆分
- ✅ 将 `duo_team` 拆分为 `duo`（双人）和 `team`（团体）
- ✅ 更新了所有前端组件
- ✅ 更新了后端验证
- ✅ 更新了翻译文件
- ✅ 两种类型使用相同的评分标准

### 2. 选手数量显示
- ✅ 后端API返回 `athlete_count` 字段
- ✅ 评审控制台显示选手数量
- ✅ 紫色徽章 + 人员图标

### 3. 评分汇总返回键
- ✅ 添加了返回按钮到评分汇总页面

### 4. Dockerfile更新
- ✅ 更新Node.js版本从18到20

## ⚠️ 需要完成的任务

### 🔴 紧急：数据库迁移（必须）

**问题**：数据库约束仍然是旧的，创建比赛会失败

**解决方案**：执行3条SQL命令

```sql
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

**执行方式**：
1. 打开数据库工具（pgAdmin/DBeaver/TablePlus）
2. 连接到数据库 `scoring`
3. 执行上面3条SQL
4. 完成！

**相关文件**：
- `COPY_PASTE_THIS.txt` - 只包含SQL
- `QUICK_FIX_GUIDE.md` - 快速指南
- `HOW_TO_FIX_DATABASE.md` - 详细步骤

### 🟡 可选：Docker部署

**当前状态**：
- Dockerfile已更新为Node.js 20
- Docker Desktop未运行

**如果需要Docker部署**：
1. 启动Docker Desktop
2. 等待Docker完全启动
3. 运行：`docker build -t scoring-system-frontend .`

**如果不需要Docker**：
- 可以继续使用 `npm run dev` 开发
- 或使用 `npm run build && npm start` 生产模式

## 📊 数据库信息

- 数据库名：`scoring`
- 用户：`postgres`
- 密码：`etkw1234`
- 主机：`localhost`
- 端口：`5432`

## 🚀 启动项目

### 开发模式（推荐）

```bash
# 后端
cd backend
npm start

# 前端（新终端）
npm run dev
```

### 生产模式

```bash
# 前端
npm run build
npm start

# 后端
cd backend
NODE_ENV=production npm start
```

## 🧪 测试功能

执行数据库迁移后：

1. ✅ 创建双人赛（duo）
2. ✅ 创建团体赛（team）
3. ✅ 查看选手数量
4. ✅ 评分功能正常
5. ✅ 大屏幕显示正常

## 📝 下一步

1. **立即执行**：数据库迁移（3条SQL）
2. **测试**：创建新比赛，验证功能
3. **可选**：如需Docker部署，启动Docker Desktop

## 💡 提示

- 数据库迁移只需要2分钟
- 不需要重启服务器
- 执行后立即生效
- 可以随时修改比赛类型（duo ↔ team）

## 📞 需要帮助？

查看以下文档：
- `QUICK_FIX_GUIDE.md` - 2分钟快速修复
- `HOW_TO_FIX_DATABASE.md` - 详细步骤
- `COPY_PASTE_THIS.txt` - 直接复制SQL

