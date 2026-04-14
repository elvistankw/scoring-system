# 🚀 测试版部署指南 (Staging Deployment)

本指南将帮助你部署一个测试版本，让其他人可以远程访问和测试评分系统。

## 📋 部署选项

### 选项 1: 使用 Vercel + Railway (推荐 - 最简单)
- **前端**: Vercel (免费)
- **后端 + 数据库**: Railway (免费额度)
- **优点**: 零配置，自动 HTTPS，全球 CDN
- **适合**: 快速测试，小团队使用

### 选项 2: 使用 Docker + VPS
- **部署**: 任何 VPS (阿里云、腾讯云、AWS 等)
- **优点**: 完全控制，性能稳定
- **适合**: 正式使用，大规模部署

### 选项 3: 本地网络暴露 (临时测试)
- **工具**: ngrok 或 localtunnel
- **优点**: 最快速，无需配置服务器
- **适合**: 短期测试，演示

---

## 🎯 选项 1: Vercel + Railway 部署 (推荐)

### 步骤 1: 准备代码仓库

1. **初始化 Git 仓库** (如果还没有)
```bash
git init
git add .
git commit -m "Initial commit for staging deployment"
```

2. **推送到 GitHub**
```bash
# 创建 GitHub 仓库后
git remote add origin https://github.com/你的用户名/scoring-system.git
git branch -M main
git push -u origin main
```

### 步骤 2: 部署后端到 Railway

1. **访问** [railway.app](https://railway.app)
2. **登录** 使用 GitHub 账号
3. **创建新项目** → "Deploy from GitHub repo"
4. **选择仓库** → scoring-system
5. **添加服务**:
   - PostgreSQL 数据库
   - Redis (可选)
   - Node.js 后端

6. **配置环境变量** (在 Railway 项目设置中):
```env
# 数据库 (Railway 自动提供)
DATABASE_URL=postgresql://...

# JWT 配置
JWT_SECRET=你的随机密钥
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=5000
NODE_ENV=staging

# 前端 URL (稍后从 Vercel 获取)
FRONTEND_URL=https://你的应用.vercel.app

# Redis (如果使用)
REDIS_URL=redis://...
```

7. **设置启动命令**:
```json
{
  "build": "npm install",
  "start": "node index.js"
}
```

8. **获取后端 URL**: 
   - Railway 会提供一个 URL，如: `https://你的应用.railway.app`

### 步骤 3: 部署前端到 Vercel

1. **访问** [vercel.com](https://vercel.com)
2. **登录** 使用 GitHub 账号
3. **导入项目** → 选择 scoring-system 仓库
4. **配置项目**:
   - Framework Preset: Next.js
   - Root Directory: `./` (项目根目录)
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **配置环境变量**:
```env
NEXT_PUBLIC_API_URL=https://你的后端.railway.app
```

6. **部署** → Vercel 会自动构建和部署

7. **获取前端 URL**: 
   - Vercel 会提供一个 URL，如: `https://你的应用.vercel.app`

8. **更新后端环境变量**:
   - 回到 Railway，更新 `FRONTEND_URL` 为 Vercel 提供的 URL

### 步骤 4: 初始化数据库

1. **连接到 Railway 数据库**:
```bash
# 使用 Railway CLI
railway login
railway link
railway run psql $DATABASE_URL
```

2. **运行数据库迁移**:
```sql
-- 创建表结构
-- 复制 backend/migrations/ 中的 SQL 文件内容并执行
```

3. **创建测试用户**:
```sql
INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
VALUES ('admin', 'admin@test.com', '$2b$10$...', 'admin', NOW(), NOW());
```

---

## 🎯 选项 2: Docker + VPS 部署

### 步骤 1: 准备 VPS 服务器

1. **购买 VPS** (推荐配置):
   - CPU: 2核
   - 内存: 4GB
   - 存储: 40GB
   - 系统: Ubuntu 22.04

2. **连接服务器**:
```bash
ssh root@你的服务器IP
```

3. **安装 Docker**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

4. **安装 Docker Compose**:
```bash
apt install docker-compose -y
```

### 步骤 2: 创建 Docker 配置

创建 `docker-compose.staging.yml`:
```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15
    container_name: scoring-postgres
    environment:
      POSTGRES_DB: scoring
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 你的密码
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: scoring-redis
    command: redis-server --requirepass 你的Redis密码
    ports:
      - "6379:6379"
    restart: unless-stopped

  # 后端 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: scoring-backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: scoring
      DB_USER: postgres
      DB_PASSWORD: 你的密码
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: 你的Redis密码
      JWT_SECRET: 你的JWT密钥
      PORT: 5000
      NODE_ENV: staging
      FRONTEND_URL: http://你的服务器IP:3000
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # 前端 Next.js
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: scoring-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://你的服务器IP:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: scoring-nginx
    volumes:
      - ./nginx/nginx.staging.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### 步骤 3: 创建前端 Dockerfile

创建 `Dockerfile.frontend`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 步骤 4: 部署到服务器

1. **上传代码到服务器**:
```bash
# 在本地
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ root@你的服务器IP:/opt/scoring-system/
```

2. **在服务器上构建和启动**:
```bash
cd /opt/scoring-system
docker-compose -f docker-compose.staging.yml up -d --build
```

3. **查看日志**:
```bash
docker-compose -f docker-compose.staging.yml logs -f
```

4. **初始化数据库**:
```bash
docker exec -it scoring-postgres psql -U postgres -d scoring
# 运行迁移 SQL
```

---

## 🎯 选项 3: 本地网络暴露 (快速测试)

### 使用 ngrok (推荐)

1. **安装 ngrok**:
   - 访问 [ngrok.com](https://ngrok.com)
   - 注册并下载

2. **启动本地服务**:
```bash
# 终端 1: 启动后端
cd backend
npm start

# 终端 2: 启动前端
npm run dev
```

3. **暴露后端**:
```bash
# 终端 3
ngrok http 5000
# 获取 URL: https://xxx.ngrok.io
```

4. **暴露前端**:
```bash
# 终端 4
ngrok http 3000
# 获取 URL: https://yyy.ngrok.io
```

5. **更新配置**:
   - 更新 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 为后端 ngrok URL
   - 更新 `backend/.env` 中的 `FRONTEND_URL` 为前端 ngrok URL
   - 重启服务

6. **分享链接**:
   - 前端访问: `https://yyy.ngrok.io`
   - 其他人可以通过这个链接访问

---

## 📝 部署后检查清单

### 1. 功能测试
- [ ] 用户注册和登录
- [ ] 创建比赛
- [ ] 添加选手
- [ ] 评审打分
- [ ] 实时大屏幕显示
- [ ] 排行榜显示

### 2. 性能测试
- [ ] 页面加载速度 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] WebSocket 连接稳定

### 3. 安全检查
- [ ] HTTPS 已启用
- [ ] JWT 密钥已更改
- [ ] 数据库密码已更改
- [ ] 敏感信息不在代码中

### 4. 监控设置
- [ ] 错误日志收集
- [ ] 性能监控
- [ ] 数据库备份

---

## 🔧 常见问题

### Q: 如何更新部署？
**Vercel/Railway**: 推送代码到 GitHub，自动部署
**Docker**: 
```bash
git pull
docker-compose -f docker-compose.staging.yml up -d --build
```

### Q: 如何查看日志？
**Vercel**: 在 Vercel 控制台查看
**Railway**: 在 Railway 控制台查看
**Docker**: 
```bash
docker-compose logs -f [服务名]
```

### Q: 如何备份数据库？
```bash
# Railway
railway run pg_dump $DATABASE_URL > backup.sql

# Docker
docker exec scoring-postgres pg_dump -U postgres scoring > backup.sql
```

### Q: 如何恢复数据库？
```bash
# Railway
railway run psql $DATABASE_URL < backup.sql

# Docker
docker exec -i scoring-postgres psql -U postgres scoring < backup.sql
```

---

## 📞 获取帮助

如果遇到问题：
1. 检查日志文件
2. 查看错误信息
3. 参考 PRODUCTION_READINESS_CHECKLIST.md
4. 联系技术支持

---

## 🎉 部署成功！

测试版部署完成后，你可以：
1. 分享访问链接给测试用户
2. 收集反馈和问题
3. 持续改进和优化
4. 准备正式生产环境部署
