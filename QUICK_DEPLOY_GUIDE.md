# 🚀 快速部署指南

## 📋 部署前检查清单

在开始部署前，请确保：

- [ ] 已有服务器（推荐 2核4GB 以上）
- [ ] 已有域名并配置 DNS
- [ ] 服务器已安装 Docker 和 Docker Compose
- [ ] 已准备好 SSL 证书（或使用 Let's Encrypt）
- [ ] 已生成所有必需的密钥和密码

## ⚡ 5 步快速部署

### 步骤 1: 准备服务器 (5分钟)

```bash
# SSH 连接到服务器
ssh user@your-server-ip

# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤 2: 克隆代码 (2分钟)

```bash
# 克隆仓库
git clone <your-repository-url>
cd scoring-system

# 或者上传代码
# scp -r ./scoring-system user@your-server-ip:/home/user/
```

### 步骤 3: 配置环境变量 (10分钟)

```bash
# 生成密钥
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 24)"
echo "DB_PASSWORD=$(openssl rand -base64 24)"

# 配置前端环境变量
cp .env.production.example .env.production
nano .env.production
```

编辑 `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=https://api.your-domain.com
NODE_ENV=production
```

```bash
# 配置后端环境变量
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

编辑 `backend/.env.production`:
```env
# 数据库
DB_USER=scoring_user
DB_HOST=postgres
DB_NAME=scoring_production
DB_PASSWORD=<刚才生成的密码>
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<刚才生成的密码>

# JWT
JWT_SECRET=<刚才生成的密钥>

# 服务器
PORT=5000
NODE_ENV=production
CORS_ORIGINS=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# Google OAuth (如果使用)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=https://api.your-domain.com/api/auth/google/callback
```

### 步骤 4: 配置 SSL 证书 (5分钟)

**选项 A: 使用 Let's Encrypt (推荐)**

```bash
# 安装 Certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 创建 SSL 目录
mkdir -p nginx/ssl

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

**选项 B: 使用自己的证书**

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl

# 上传证书文件
# fullchain.pem - 完整证书链
# privkey.pem - 私钥
```

### 步骤 5: 启动服务 (5分钟)

```bash
# 更新 nginx 配置中的域名
nano nginx/nginx.conf
# 将 your-domain.com 替换为实际域名

# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 等待所有服务启动（约 1-2 分钟）
```

## ✅ 验证部署

### 1. 检查服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 应该看到所有服务都是 Up 状态
```

### 2. 测试健康检查

```bash
# 测试后端
curl https://api.your-domain.com/health

# 测试前端
curl https://your-domain.com

# 运行健康检查脚本
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

### 3. 访问应用

在浏览器中访问：
- 主页: https://your-domain.com
- 管理后台: https://your-domain.com/zh/admin-dashboard
- 评审界面: https://your-domain.com/zh/judge-dashboard

## 🔧 常用命令

### 查看日志
```bash
# 所有服务
docker-compose -f docker-compose.prod.yml logs -f

# 特定服务
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend
```

### 停止服务
```bash
docker-compose -f docker-compose.prod.yml down
```

### 更新代码
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📊 监控和维护

### 设置自动备份

```bash
# 使备份脚本可执行
chmod +x scripts/backup-database.sh

# 测试备份
./scripts/backup-database.sh

# 设置定时任务
crontab -e

# 添加以下行（每天凌晨 2 点备份）
0 2 * * * /path/to/scoring-system/scripts/backup-database.sh
```

### 设置健康检查

```bash
# 使健康检查脚本可执行
chmod +x scripts/health-check.sh

# 设置定时任务（每 5 分钟检查一次）
crontab -e

# 添加以下行
*/5 * * * * /path/to/scoring-system/scripts/health-check.sh
```

### 查看系统资源

```bash
# CPU 和内存使用
docker stats

# 磁盘使用
df -h

# 数据库大小
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U scoring_user -d scoring_production \
  -c "SELECT pg_size_pretty(pg_database_size('scoring_production'));"
```

## 🐛 故障排除

### 问题 1: 容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs backend

# 检查环境变量
docker-compose -f docker-compose.prod.yml config

# 重新构建
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### 问题 2: 数据库连接失败

```bash
# 检查数据库容器
docker-compose -f docker-compose.prod.yml ps postgres

# 进入数据库容器
docker-compose -f docker-compose.prod.yml exec postgres psql -U scoring_user -d scoring_production

# 检查连接
\conninfo
```

### 问题 3: SSL 证书问题

```bash
# 检查证书文件
ls -la nginx/ssl/

# 测试 SSL 配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# 重新加载 nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 问题 4: 前端无法连接后端

```bash
# 检查环境变量
cat .env.production

# 检查 CORS 配置
cat backend/.env.production | grep CORS

# 检查 nginx 配置
cat nginx/nginx.conf
```

## 📞 获取帮助

如果遇到问题：

1. 查看日志: `docker-compose -f docker-compose.prod.yml logs -f`
2. 运行健康检查: `./scripts/health-check.sh`
3. 查看详细文档: `PRODUCTION_READINESS_CHECKLIST.md`
4. 查看部署文档: `DEPLOYMENT.md`

## 🎉 部署完成！

恭喜！你的评分系统已经成功部署到生产环境。

### 下一步：

1. ✅ 创建管理员账户
2. ✅ 配置 Google OAuth（如果需要）
3. ✅ 设置监控告警
4. ✅ 配置自动备份
5. ✅ 进行负载测试

---

**部署时间**: 约 30 分钟
**难度**: 中等
**推荐配置**: 2核4GB 服务器
