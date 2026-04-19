# 🔧 Vercel 后端部署错误修复

## ❌ 错误信息
```
Error: Cannot find module '/app/index.js'
```

## 🔍 问题原因
Vercel 的 `experimentalServices` 配置不正确，它在错误的路径查找后端文件。

## ✅ 推荐解决方案

### 方案 1: 只部署前端到 Vercel（强烈推荐）

**这是最简单、最稳定的方式！**

#### 步骤 1: 删除后端配置

在 Vercel 项目中：
1. 进入 Settings → General
2. 找到 "Root Directory" 设置
3. 确保为空（使用根目录）
4. 保存

#### 步骤 2: 部署后端到 Railway

**Railway 部署步骤**：

1. **访问 Railway**
   - 打开 https://railway.app
   - 使用 GitHub 登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 `scoring-system` 仓库

3. **配置后端**
   - 点击项目后，点击 "Settings"
   - 在 "Service Settings" 中：
     - Root Directory: `backend`
     - Start Command: `npm start`
     - Build Command: `npm install`

4. **添加环境变量**
   点击 "Variables" 标签，添加：
   ```

   DB_USER=postgres
DB_HOST=localhost
DB_NAME=scoring
DB_PASSWORD=etkw1234
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=vbTCayHmK9Jxv6sMQDzVaAB9hYCa2KLH
REDIS_DB=0
REDIS_USERNAME=
REDIS_FAMILY=4
REDIS_KEEPALIVE=30000
JWT_SECRET=T6dx48Si33N6p/HVVlbTGZF60E13eoo1usafzVq61Hk=
CORS_ORIGIN=https://scoring-system-nine.vercel.app
   NODE_ENV=production
   PORT=5000
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=scoring
   DB_USER=postgres
   DB_PASSWORD=your-password
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   JWT_SECRET=your-jwt-secret
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

5. **部署**
   - Railway 会自动开始部署
   - 等待部署完成
   - 复制 Railway 提供的 URL（例如：`https://scoring-system-production.up.railway.app`）

#### 步骤 3: 更新 Vercel 环境变量

在 Vercel Dashboard：
1. 进入你的项目
2. Settings → Environment Variables
3. 添加/更新：
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
   NEXT_PUBLIC_WS_URL=https://your-app.up.railway.app
   ```
4. 保存后点击 "Redeploy"

#### 步骤 4: 测试
1. 访问你的 Vercel 网站
2. 打开浏览器控制台（F12）
3. 查看 Network 标签
4. 确认 API 请求指向 Railway URL

---

### 方案 2: 使用 Vercel Serverless Functions（复杂）

如果坚持在 Vercel 部署后端，需要重构为 Serverless Functions。

**不推荐原因**：
- 需要大量代码重构
- WebSocket 支持有限
- 数据库连接池管理复杂
- 冷启动延迟

**如果必须使用**，需要：
1. 将每个路由转换为独立的 Serverless Function
2. 放在 `api/` 目录下
3. 重写数据库连接逻辑
4. 使用 Vercel KV 替代 Redis

---

## 🎯 快速修复步骤（推荐）

### 1. 删除 experimentalServices 配置

如果你有 `vercel.json` 文件包含 `experimentalServices`，删除它或替换为：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

### 2. 提交更改

```bash
git add vercel.json
git commit -m "Fix Vercel config - frontend only"
git push origin main
```

### 3. 部署后端到 Railway

按照上面的 Railway 步骤操作。

### 4. 更新环境变量

在 Vercel 中设置 `NEXT_PUBLIC_API_URL` 指向 Railway。

### 5. 重新部署 Vercel

在 Vercel Dashboard 点击 "Redeploy"。

---

## 📋 Railway 详细配置

### 数据库设置

**选项 A: 使用 Railway Postgres**
1. 在 Railway 项目中点击 "New"
2. 选择 "Database" → "PostgreSQL"
3. 自动添加 `DATABASE_URL` 环境变量
4. 连接并执行迁移 SQL

**选项 B: 使用外部数据库（Supabase）**
1. 访问 https://supabase.com
2. 创建新项目
3. 获取连接字符串
4. 在 Railway 添加环境变量：
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   ```

### Redis 设置

**选项 A: 使用 Railway Redis**
1. 在 Railway 项目中点击 "New"
2. 选择 "Database" → "Redis"
3. 自动添加 Redis 环境变量

**选项 B: 使用 Upstash**
1. 访问 https://upstash.com
2. 创建 Redis 数据库
3. 获取连接信息
4. 在 Railway 添加环境变量

### 执行数据库迁移

```bash
# 连接到数据库
psql "your-database-url"

# 执行迁移
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

---

## 🔍 验证部署

### 检查 Railway 后端
```bash
# 测试后端 API
curl https://your-app.up.railway.app/api/competitions

# 应该返回 JSON 数据或空数组
```

### 检查 Vercel 前端
1. 访问你的 Vercel URL
2. 打开浏览器控制台（F12）
3. 查看 Network 标签
4. 确认 API 请求指向 Railway

### 检查环境变量
```javascript
// 在浏览器控制台输入
console.log(process.env.NEXT_PUBLIC_API_URL)
// 应该显示 Railway URL
```

---

## 💡 为什么推荐分离部署？

### 优势
✅ **简单**: 不需要复杂配置  
✅ **稳定**: 各自使用最适合的平台  
✅ **灵活**: 可以独立扩展和更新  
✅ **成本**: Railway 有免费额度  
✅ **性能**: 专门的后端服务器性能更好  

### 架构
```
用户
 ↓
Vercel (Next.js 前端)
 ↓ API 请求
Railway (Node.js 后端)
 ↓
Supabase (PostgreSQL) + Upstash (Redis)
```

---

## 🚀 完整部署清单

### Railway 后端
- [ ] 创建 Railway 项目
- [ ] 连接 GitHub 仓库
- [ ] 设置 Root Directory: `backend`
- [ ] 添加所有环境变量
- [ ] 部署成功
- [ ] 复制 Railway URL
- [ ] 测试 API 端点

### Vercel 前端
- [ ] 删除 experimentalServices 配置
- [ ] 更新 vercel.json
- [ ] 提交并推送代码
- [ ] 添加环境变量（Railway URL）
- [ ] 重新部署
- [ ] 测试前端页面
- [ ] 验证 API 连接

### 数据库
- [ ] 设置 PostgreSQL（Railway 或 Supabase）
- [ ] 设置 Redis（Railway 或 Upstash）
- [ ] 执行数据库迁移
- [ ] 测试连接

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. Railway 部署日志
2. Vercel 部署日志
3. 浏览器控制台错误
4. Network 标签的请求详情

我会帮你诊断具体问题！

---

**推荐方案**: Railway (后端) + Vercel (前端)  
**预计时间**: 20-30 分钟  
**难度**: 简单
