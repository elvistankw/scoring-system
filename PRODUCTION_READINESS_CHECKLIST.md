# 🚀 生产环境上线检查清单

## 📊 当前状态评估

### ✅ 已完成的功能
- [x] 核心功能开发完成
- [x] 实时评分系统
- [x] 多角色认证（Admin/Judge）
- [x] 比赛管理
- [x] 选手管理
- [x] 评分提交和显示
- [x] Redis 缓存
- [x] 性能优化
- [x] 安全加固
- [x] Google 账户集成
- [x] Excel 导出功能
- [x] WebSocket 实时通信
- [x] 响应式设计
- [x] Dark/Light 主题

### ⚠️ 需要完成的关键项

## 🔴 必须完成（上线前）

### 1. 生产环境配置

#### 1.1 环境变量配置 ⚠️
**状态**: 需要更新

**需要做的**:
```bash
# 创建生产环境配置
cp .env.example .env.production
cp backend/.env.example backend/.env.production
```

**必须修改的变量**:
- [ ] `JWT_SECRET` - 生成强随机密钥
- [ ] `DB_PASSWORD` - 设置强数据库密码
- [ ] `REDIS_PASSWORD` - 设置 Redis 密码
- [ ] `GOOGLE_CLIENT_ID` - 生产环境的 Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - 生产环境的密钥
- [ ] `GOOGLE_REDIRECT_URI` - 生产域名回调地址
- [ ] `FRONTEND_URL` - 生产域名
- [ ] `NEXT_PUBLIC_API_URL` - 生产 API 地址
- [ ] `NEXT_PUBLIC_WS_URL` - 生产 WebSocket 地址
- [ ] `CORS_ORIGINS` - 限制为生产域名

**生成安全密钥**:
```bash
# JWT Secret
openssl rand -base64 32

# Redis Password
openssl rand -base64 24

# Database Password
openssl rand -base64 24
```

#### 1.2 Next.js 生产配置 ⚠️
**状态**: 需要添加

**创建 `next.config.ts`**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产优化
  output: 'standalone',
  
  // 压缩
  compress: true,
  
  // 图片优化
  images: {
    domains: ['your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 安全头
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

export default nextConfig;
```

### 2. Nginx 配置 ⚠️
**状态**: 缺失

**需要创建**:
```bash
mkdir -p nginx
```

**创建 `nginx/nginx.conf`**:
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Upstream servers
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL 证书
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        # SSL 配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 前端
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 后端 API
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' 'https://your-domain.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # WebSocket 超时设置
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }

        # 登录限流
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            proxy_pass http://backend;
        }

        # 健康检查
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
}
```

### 3. SSL/HTTPS 证书 ⚠️
**状态**: 需要配置

**选项 1: Let's Encrypt (推荐)**
```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

**选项 2: 自签名证书（仅测试）**
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem
```

### 4. 数据库备份策略 ⚠️
**状态**: 需要实现

**创建 `scripts/backup-database.sh`**:
```bash
#!/bin/bash

# 配置
DB_NAME="scoring"
DB_USER="postgres"
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/scoring_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

**设置定时任务**:
```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/scripts/backup-database.sh
```

### 5. 监控和日志 ⚠️
**状态**: 需要实现

**创建 `scripts/health-check.sh`**:
```bash
#!/bin/bash

# 检查后端健康
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)

if [ $BACKEND_STATUS -ne 200 ]; then
    echo "Backend health check failed: $BACKEND_STATUS"
    # 发送告警（邮件/短信/Slack）
    exit 1
fi

# 检查前端
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ $FRONTEND_STATUS -ne 200 ]; then
    echo "Frontend health check failed: $FRONTEND_STATUS"
    exit 1
fi

# 检查数据库
psql -U postgres -d scoring -c "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Database check failed"
    exit 1
fi

# 检查 Redis
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Redis check failed"
    exit 1
fi

echo "All health checks passed"
```

### 6. 错误追踪 ⚠️
**状态**: 建议添加

**推荐工具**:
- Sentry (错误追踪)
- LogRocket (用户会话重放)
- DataDog (APM 监控)

**Sentry 集成示例**:
```bash
npm install @sentry/nextjs @sentry/node
```

## 🟡 重要但非阻塞（上线后尽快完成）

### 7. 性能监控
- [ ] 添加 Google Analytics
- [ ] 配置 Web Vitals 监控
- [ ] 设置性能预算

### 8. 用户反馈
- [ ] 添加反馈表单
- [ ] 配置错误报告机制
- [ ] 设置用户支持渠道

### 9. 文档完善
- [ ] 用户操作手册
- [ ] 故障排除指南
- [ ] API 变更日志

### 10. 测试
- [ ] 端到端测试
- [ ] 负载测试
- [ ] 安全渗透测试

## 🟢 可选优化（长期改进）

### 11. CDN 配置
- [ ] 配置 Cloudflare/AWS CloudFront
- [ ] 静态资源 CDN 加速
- [ ] 图片优化服务

### 12. 数据库优化
- [ ] 配置读写分离
- [ ] 设置数据库主从复制
- [ ] 优化慢查询

### 13. 缓存策略
- [ ] Redis 集群
- [ ] 多级缓存
- [ ] 缓存预热

## 📝 部署步骤

### 步骤 1: 准备服务器
```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 步骤 2: 配置环境
```bash
# 克隆代码
git clone <your-repo>
cd scoring-system

# 配置环境变量
cp .env.example .env.production
cp backend/.env.example backend/.env.production

# 编辑环境变量
nano .env.production
nano backend/.env.production
```

### 步骤 3: 配置 SSL
```bash
# 使用 Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到 nginx 目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### 步骤 4: 启动服务
```bash
# 构建并启动
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 检查状态
docker-compose -f docker-compose.prod.yml ps
```

### 步骤 5: 验证部署
```bash
# 检查健康状态
curl https://your-domain.com/health

# 测试 API
curl https://your-domain.com/api/health

# 测试前端
curl https://your-domain.com
```

## ✅ 上线前最终检查

### 安全检查
- [ ] 所有密码已更改为强密码
- [ ] JWT_SECRET 已更新
- [ ] CORS 配置正确
- [ ] HTTPS 已启用
- [ ] 防火墙规则已配置
- [ ] 数据库仅允许本地连接
- [ ] Redis 密码已设置

### 功能检查
- [ ] 用户注册/登录正常
- [ ] 比赛创建/编辑正常
- [ ] 选手管理正常
- [ ] 评分提交正常
- [ ] 实时更新正常
- [ ] Excel 导出正常
- [ ] Google 集成正常

### 性能检查
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] WebSocket 连接稳定
- [ ] Redis 缓存生效
- [ ] 数据库查询优化

### 监控检查
- [ ] 健康检查端点正常
- [ ] 日志记录正常
- [ ] 错误追踪配置
- [ ] 备份任务运行
- [ ] 告警通知配置

## 📞 紧急联系

### 技术支持
- 开发团队: dev@your-domain.com
- 运维团队: ops@your-domain.com
- 紧急热线: +86-xxx-xxxx-xxxx

### 服务商
- 域名注册商: [提供商名称]
- 服务器提供商: [提供商名称]
- SSL 证书: Let's Encrypt

## 📊 上线时间表

### 建议时间表
1. **准备阶段** (1-2 天)
   - 完成所有必须项
   - 配置生产环境
   - 准备备份策略

2. **测试阶段** (1 天)
   - 在测试环境验证
   - 负载测试
   - 安全测试

3. **部署阶段** (半天)
   - 部署到生产环境
   - 验证所有功能
   - 监控系统状态

4. **观察期** (1 周)
   - 密切监控
   - 快速响应问题
   - 收集用户反馈

## 🎯 总结

### 必须完成的关键项（估计 2-3 天）:
1. ✅ 生产环境变量配置
2. ✅ Next.js 生产配置
3. ✅ Nginx 配置文件
4. ✅ SSL 证书配置
5. ✅ 数据库备份脚本
6. ✅ 健康检查脚本

### 当前完成度: 85%

**距离上线还需要**:
- 配置工作: 1-2 天
- 测试验证: 1 天
- 部署上线: 半天

**总计**: 2.5-3.5 天可以上线

---

**最后更新**: 2026-04-13
**状态**: 准备上线
**优先级**: 🔴 高
