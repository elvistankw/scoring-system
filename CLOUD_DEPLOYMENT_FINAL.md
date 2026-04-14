# ☁️ 云端部署最终指南

## 🎯 当前状态

✅ **已完成**：
- 代码完成并构建成功
- Upstash Redis 已创建
- Vercel 前端配置完成

⏳ **待完成**：
- Railway 后端配置
- 环境变量设置
- 数据库迁移

---

## 📋 步骤 1: 配置 Railway 后端

### 1.1 Railway 基本设置

在 Railway Dashboard (https://railway.app/dashboard):

1. **进入你的项目**
2. **点击后端服务**
3. **点击 Settings 标签**

### 1.2 配置 Builder

```
Builder: Nixpacks (推荐)
Root Directory: backend
Start Command: npm start
```

**重要**：确保 Root Directory 设置为 `backend` 并保存！

### 1.3 添加环境变量

点击 **Variables** 标签，添加以下变量：

#### Redis 配置（Upstash）

从你的 Redis URL 提取信息：
```
redis://default:AZCTAAIncDE4NzBhMGJjZjU2MTk0ZDgxYWU4NWI4NWFlMTNiYTIxZXAxMzcwMTE@neutral-kid-37011.upstash.io:6379
```

添加这些变量：

```bash
# Redis - Upstash
REDIS_HOST=neutral-kid-37011.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AZCTAAIncDE4NzBhMGJjZjU2MTk0ZDgxYWU4NWI4NWFlMTNiYTIxZXAxMzcwMTE
REDIS_TLS=true

# 或者直接使用完整 URL
REDIS_URL=redis://default:AZCTAAIncDE4NzBhMGJjZjU2MTk0ZDgxYWU4NWI4NWFlMTNiYTIxZXAxMzcwMTE@neutral-kid-37011.upstash.io:6379

# Node 环境
NODE_ENV=production
PORT=5000

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS（你的 Vercel 前端 URL）
CORS_ORIGIN=https://your-app.vercel.app
```

#### 数据库配置

**选项 A: 使用 Railway Postgres（推荐）**

1. 在 Railway 项目中点击 **"+ New"**
2. 选择 **"Database"** → **"Add PostgreSQL"**
3. Railway 会自动添加 `DATABASE_URL` 环境变量
4. 无需手动配置！

**选项 B: 使用 Supabase**

1. 访问 https://supabase.com
2. 创建新项目
3. 获取连接字符串
4. 在 Railway 添加：
   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

---

## 📋 步骤 2: 更新后端代码以支持 Upstash Redis

Upstash 需要 TLS 连接。检查 `backend/redis.js` 是否支持 TLS。

如果需要，我已经准备好更新的代码。

---

## 📋 步骤 3: 配置 Vercel 前端

### 3.1 获取 Railway URL

1. 在 Railway Dashboard 中
2. 点击你的后端服务
3. 点击 **Settings** 标签
4. 找到 **Domains** 部分
5. 复制 Railway 提供的 URL（例如：`https://your-app.up.railway.app`）

### 3.2 设置 Vercel 环境变量

在 Vercel Dashboard (https://vercel.com/dashboard):

1. **进入你的项目**
2. **Settings** → **Environment Variables**
3. **添加/更新**：

```bash
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WS_URL=https://your-app.up.railway.app
```

4. **选择环境**：Production, Preview, Development
5. **保存**
6. **重新部署**：Deployments → Redeploy

---

## 📋 步骤 4: 执行数据库迁移

### 4.1 连接到数据库

**如果使用 Railway Postgres**：

1. 在 Railway Dashboard 中找到 PostgreSQL 服务
2. 点击 **Connect** 标签
3. 复制连接命令或使用 Web Console

**如果使用 Supabase**：

1. 在 Supabase Dashboard 中
2. 进入 SQL Editor
3. 或使用 psql 连接

### 4.2 执行迁移 SQL

```sql
-- 1. 更新约束
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

-- 2. 迁移数据
UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';

-- 3. 验证
SELECT competition_type, COUNT(*) FROM competitions GROUP BY competition_type;
```

---

## 📋 步骤 5: 测试部署

### 5.1 测试后端（Railway）

```bash
# 获取 Railway URL
RAILWAY_URL=https://your-app.up.railway.app

# 测试健康检查
curl $RAILWAY_URL/api/competitions

# 应该返回 JSON 数据或空数组
```

### 5.2 测试前端（Vercel）

1. 访问你的 Vercel URL
2. 打开浏览器开发者工具（F12）
3. 查看 **Console** 标签 - 应该无错误
4. 查看 **Network** 标签 - API 请求应该指向 Railway URL

### 5.3 测试完整流程

1. ✅ 访问首页
2. ✅ 登录（如果有账号）
3. ✅ 查看比赛列表
4. ✅ 创建比赛（管理员）
5. ✅ 评分（评审）
6. ✅ 查看大屏幕

---

## 🔧 故障排查

### 问题 1: Railway 后端无法启动

**检查**：
- Root Directory 是否设置为 `backend`
- 环境变量是否正确
- 查看 Railway 部署日志

**解决**：
```bash
# 在 Railway Settings 中
Root Directory: backend
Start Command: npm start

# 或使用
Start Command: cd backend && npm start
```

### 问题 2: Redis 连接失败

**检查**：
- REDIS_TLS 是否设置为 true
- Redis 密码是否正确

**解决**：
确保 `backend/redis.js` 支持 TLS：
```javascript
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined
});
```

### 问题 3: 前端无法连接后端

**检查**：
- Vercel 环境变量是否正确
- Railway 后端是否正在运行
- CORS 设置是否正确

**解决**：
```bash
# 在 Railway 环境变量中
CORS_ORIGIN=https://your-app.vercel.app

# 在 Vercel 环境变量中
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

### 问题 4: 数据库连接失败

**检查**：
- DATABASE_URL 是否正确
- 数据库是否已创建
- 网络连接是否正常

**解决**：
```bash
# 测试数据库连接
psql "your-database-url" -c "SELECT 1"
```

---

## 📊 完整配置清单

### Railway 后端

```
✅ Root Directory: backend
✅ Start Command: npm start
✅ Builder: Nixpacks

环境变量：
✅ NODE_ENV=production
✅ PORT=5000
✅ DATABASE_URL=postgresql://...
✅ REDIS_HOST=neutral-kid-37011.upstash.io
✅ REDIS_PORT=6379
✅ REDIS_PASSWORD=AZC...
✅ REDIS_TLS=true
✅ JWT_SECRET=your-secret
✅ CORS_ORIGIN=https://your-app.vercel.app
```

### Vercel 前端

```
环境变量：
✅ NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
✅ NEXT_PUBLIC_WS_URL=https://your-app.up.railway.app
```

### 数据库

```
✅ PostgreSQL 已创建
✅ 迁移 SQL 已执行
✅ 数据验证通过
```

---

## 🎉 部署成功标志

当你看到以下情况时，说明部署成功：

1. ✅ Railway 部署状态：**Active**
2. ✅ Vercel 部署状态：**Ready**
3. ✅ 前端可以访问
4. ✅ API 请求成功
5. ✅ 可以登录和使用功能
6. ✅ 浏览器控制台无错误

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. Railway 部署日志（完整）
2. Vercel 部署日志
3. 浏览器控制台错误
4. Network 标签的请求详情

我会帮你逐步解决！

---

**下一步**：
1. 在 Railway 设置 Root Directory = `backend`
2. 添加所有环境变量（特别是 Redis 配置）
3. 等待部署完成
4. 更新 Vercel 环境变量
5. 测试！

🚀 加油！部署马上就要成功了！
