# 🚀 Vercel 部署指南

## ✅ 当前部署状态

### 构建信息
- **位置**: Washington, D.C., USA (East) – iad1
- **分支**: main
- **提交**: 1da8203
- **构建机器**: 2 cores, 8 GB
- **依赖安装**: ✅ 完成 (542 packages)

### 本地构建验证
```
✓ Compiled successfully in 4.9s
✓ Finished TypeScript in 5.9s
✓ Build completed successfully
```

## 📋 Vercel 配置

### 实验性服务配置
```json
{
  "experimentalServices": {
    "frontend": {
      "routePrefix": "/",
      "framework": "nextjs"
    },
    "backend": {
      "entrypoint": "backend",
      "routePrefix": "/_/backend"
    }
  }
}
```

### 路由说明
- **前端**: 所有路由从根路径 `/` 提供服务
- **后端**: API 通过 `/_/backend` 前缀访问

## 🔧 环境变量配置

### 必需的环境变量

在 Vercel 项目设置中配置以下环境变量：

#### 前端环境变量
```bash
# API URL - 指向 Vercel 后端服务
NEXT_PUBLIC_API_URL=/_/backend

# WebSocket URL - 指向 Vercel 后端服务
NEXT_PUBLIC_WS_URL=/_/backend

# 或者使用完整域名
# NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/_/backend
# NEXT_PUBLIC_WS_URL=https://your-domain.vercel.app/_/backend
```

#### 后端环境变量
```bash
# 数据库连接
DATABASE_URL=postgresql://user:password@host:port/scoring
# 或者分开配置
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=scoring
DB_USER=postgres
DB_PASSWORD=your-password

# Redis 连接
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# Google OAuth (如果使用)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/_/backend/api/auth/google/callback

# Node 环境
NODE_ENV=production

# CORS 配置
CORS_ORIGIN=https://your-domain.vercel.app
```

## 🗄️ 数据库设置

### PostgreSQL

推荐使用以下服务之一：
- **Vercel Postgres** (推荐，集成最好)
- **Supabase** (免费层可用)
- **Neon** (无服务器 Postgres)
- **Railway** (简单易用)

### Redis

推荐使用以下服务之一：
- **Vercel KV** (推荐，基于 Redis)
- **Upstash** (无服务器 Redis)
- **Redis Cloud** (官方托管)

### 数据库迁移

**重要**: 部署前必须执行数据库迁移！

```sql
-- 连接到生产数据库后执行
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

## 📦 部署步骤

### 1. 配置 Vercel 项目

```bash
# 安装 Vercel CLI (如果还没有)
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link
```

### 2. 设置环境变量

在 Vercel Dashboard:
1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加上述所有环境变量
4. 为 Production、Preview、Development 分别配置

### 3. 配置数据库

#### 使用 Vercel Postgres
```bash
# 在 Vercel Dashboard 中
1. 进入 Storage 标签
2. 创建 Postgres 数据库
3. 自动添加环境变量
```

#### 使用 Vercel KV (Redis)
```bash
# 在 Vercel Dashboard 中
1. 进入 Storage 标签
2. 创建 KV 数据库
3. 自动添加环境变量
```

### 4. 执行数据库迁移

```bash
# 连接到生产数据库
psql $DATABASE_URL

# 执行迁移 SQL
\i backend/SIMPLE_FIX.sql

# 或者直接粘贴 SQL
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;
ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));
UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

### 5. 部署

```bash
# 部署到生产环境
vercel --prod

# 或者通过 Git 推送自动部署
git push origin main
```

## 🧪 部署后测试

### 1. 检查前端
```bash
# 访问你的域名
https://your-domain.vercel.app

# 检查页面
- 登录页面
- 管理员控制台
- 评审控制台
- 大屏幕显示
```

### 2. 检查后端 API
```bash
# 测试 API 连接
curl https://your-domain.vercel.app/_/backend/api/competitions

# 测试健康检查 (如果有)
curl https://your-domain.vercel.app/_/backend/health
```

### 3. 检查 WebSocket
```javascript
// 在浏览器控制台测试
const socket = io('https://your-domain.vercel.app/_/backend');
socket.on('connect', () => console.log('Connected!'));
```

## ⚠️ 常见问题

### 问题 1: API 请求失败
**原因**: 环境变量未设置或路径错误

**解决方案**:
```bash
# 检查环境变量
vercel env ls

# 确保 NEXT_PUBLIC_API_URL 设置正确
NEXT_PUBLIC_API_URL=/_/backend
```

### 问题 2: 数据库连接失败
**原因**: 数据库环境变量未配置

**解决方案**:
```bash
# 检查数据库连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"
```

### 问题 3: Redis 连接失败
**原因**: Redis 环境变量未配置

**解决方案**:
```bash
# 使用 Vercel KV
# 在 Dashboard 中创建 KV 存储
# 环境变量会自动添加
```

### 问题 4: CORS 错误
**原因**: 后端 CORS 配置不正确

**解决方案**:
```javascript
// backend/index.js
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-domain.vercel.app',
  credentials: true
}));
```

### 问题 5: 构建失败
**原因**: TypeScript 错误或依赖问题

**解决方案**:
```bash
# 本地测试构建
npm run build

# 检查 TypeScript
npm run type-check

# 清除缓存重新构建
vercel --force
```

## 📊 性能优化

### 1. 启用边缘缓存
```javascript
// next.config.ts
export default {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }
      ]
    }
  ]
}
```

### 2. 使用 ISR (增量静态再生成)
```typescript
// 在页面中
export const revalidate = 60; // 60秒重新验证
```

### 3. 优化图片
```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';
```

## 🔒 安全检查清单

- [ ] 所有环境变量已设置
- [ ] JWT_SECRET 使用强密码
- [ ] 数据库密码已更改
- [ ] Redis 密码已设置
- [ ] CORS 配置正确
- [ ] API 速率限制已启用
- [ ] HTTPS 已启用 (Vercel 自动)
- [ ] 敏感数据不在代码中

## 📈 监控和日志

### Vercel Analytics
```bash
# 在 Vercel Dashboard 中启用
1. 进入项目设置
2. 启用 Analytics
3. 查看实时数据
```

### 日志查看
```bash
# 查看部署日志
vercel logs

# 查看实时日志
vercel logs --follow

# 查看特定部署的日志
vercel logs [deployment-url]
```

## 🎯 部署检查清单

### 部署前
- [ ] 本地构建成功 (`npm run build`)
- [ ] TypeScript 检查通过
- [ ] 所有测试通过
- [ ] 环境变量已准备
- [ ] 数据库已设置
- [ ] Redis 已设置

### 部署中
- [ ] 推送代码到 GitHub
- [ ] Vercel 自动构建
- [ ] 构建日志无错误
- [ ] 部署成功

### 部署后
- [ ] 执行数据库迁移
- [ ] 测试前端页面
- [ ] 测试 API 端点
- [ ] 测试 WebSocket 连接
- [ ] 测试用户登录
- [ ] 测试创建比赛
- [ ] 测试评分功能
- [ ] 测试大屏幕显示

## 🚀 快速命令

```bash
# 部署到生产环境
vercel --prod

# 查看部署状态
vercel ls

# 查看环境变量
vercel env ls

# 添加环境变量
vercel env add NEXT_PUBLIC_API_URL

# 查看日志
vercel logs

# 回滚到上一个部署
vercel rollback

# 删除部署
vercel rm [deployment-url]
```

## 📞 需要帮助？

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 部署**: https://nextjs.org/docs/deployment
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Vercel KV**: https://vercel.com/docs/storage/vercel-kv

---

**部署状态**: 🟡 进行中  
**下一步**: 等待构建完成 → 配置环境变量 → 执行数据库迁移  
**预计时间**: 5-10分钟  
**最后更新**: 2026年4月14日
