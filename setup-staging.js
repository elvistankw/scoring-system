#!/usr/bin/env node

// 测试版部署设置脚本
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 评分系统 - 测试版部署设置\n');

// 检查部署方式
console.log('请选择部署方式:');
console.log('1. Vercel + Railway (推荐 - 云端部署)');
console.log('2. Docker + VPS (自托管)');
console.log('3. ngrok (本地暴露 - 快速测试)');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('请输入选项 (1/2/3): ', (choice) => {
  switch(choice.trim()) {
    case '1':
      setupVercelRailway();
      break;
    case '2':
      setupDockerVPS();
      break;
    case '3':
      setupNgrok();
      break;
    default:
      console.log('❌ 无效选项');
      rl.close();
  }
});

// 选项 1: Vercel + Railway
function setupVercelRailway() {
  console.log('\n📦 设置 Vercel + Railway 部署\n');
  
  console.log('步骤 1: 准备 Git 仓库');
  console.log('--------------------------------------');
  console.log('1. 确保代码已提交到 Git');
  console.log('2. 推送到 GitHub:');
  console.log('   git remote add origin https://github.com/你的用户名/scoring-system.git');
  console.log('   git push -u origin main');
  console.log('');
  
  console.log('步骤 2: 部署后端到 Railway');
  console.log('--------------------------------------');
  console.log('1. 访问 https://railway.app');
  console.log('2. 使用 GitHub 登录');
  console.log('3. 创建新项目 → Deploy from GitHub');
  console.log('4. 添加 PostgreSQL 数据库');
  console.log('5. 配置环境变量 (见下方)');
  console.log('');
  
  console.log('Railway 环境变量:');
  console.log('--------------------------------------');
  console.log('JWT_SECRET=' + generateRandomString(32));
  console.log('JWT_EXPIRES_IN=24h');
  console.log('PORT=5000');
  console.log('NODE_ENV=staging');
  console.log('FRONTEND_URL=https://你的应用.vercel.app');
  console.log('');
  
  console.log('步骤 3: 部署前端到 Vercel');
  console.log('--------------------------------------');
  console.log('1. 访问 https://vercel.com');
  console.log('2. 使用 GitHub 登录');
  console.log('3. 导入项目');
  console.log('4. 配置环境变量:');
  console.log('   NEXT_PUBLIC_API_URL=https://你的后端.railway.app');
  console.log('');
  
  console.log('步骤 4: 初始化数据库');
  console.log('--------------------------------------');
  console.log('1. 安装 Railway CLI: npm install -g @railway/cli');
  console.log('2. 登录: railway login');
  console.log('3. 链接项目: railway link');
  console.log('4. 运行迁移: railway run node backend/migrations/run-migrations.js');
  console.log('');
  
  console.log('✅ 设置完成！访问 Vercel 提供的 URL 即可使用');
  
  rl.close();
}

// 选项 2: Docker + VPS
function setupDockerVPS() {
  console.log('\n🐳 设置 Docker + VPS 部署\n');
  
  // 创建 docker-compose.staging.yml
  const dockerCompose = `version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: scoring-postgres
    environment:
      POSTGRES_DB: scoring
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${generateRandomString(16)}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: scoring-redis
    command: redis-server --requirepass ${generateRandomString(16)}
    ports:
      - "6379:6379"
    restart: unless-stopped

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
      DB_PASSWORD: 更改为上面的密码
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: 更改为上面的密码
      JWT_SECRET: ${generateRandomString(32)}
      PORT: 5000
      NODE_ENV: staging
      FRONTEND_URL: http://你的服务器IP:3000
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

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

volumes:
  postgres_data:
`;

  fs.writeFileSync('docker-compose.staging.yml', dockerCompose);
  console.log('✅ 已创建 docker-compose.staging.yml');
  
  // 创建前端 Dockerfile
  const frontendDockerfile = `FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
`;

  fs.writeFileSync('Dockerfile.frontend', frontendDockerfile);
  console.log('✅ 已创建 Dockerfile.frontend');
  
  console.log('\n部署步骤:');
  console.log('--------------------------------------');
  console.log('1. 上传代码到服务器:');
  console.log('   rsync -avz --exclude node_modules --exclude .next ./ root@你的IP:/opt/scoring-system/');
  console.log('');
  console.log('2. 在服务器上运行:');
  console.log('   cd /opt/scoring-system');
  console.log('   docker-compose -f docker-compose.staging.yml up -d --build');
  console.log('');
  console.log('3. 查看日志:');
  console.log('   docker-compose -f docker-compose.staging.yml logs -f');
  console.log('');
  console.log('4. 访问应用:');
  console.log('   http://你的服务器IP:3000');
  console.log('');
  
  rl.close();
}

// 选项 3: ngrok
function setupNgrok() {
  console.log('\n🌐 设置 ngrok 本地暴露\n');
  
  console.log('步骤 1: 安装 ngrok');
  console.log('--------------------------------------');
  console.log('访问 https://ngrok.com 注册并下载');
  console.log('');
  
  console.log('步骤 2: 启动服务');
  console.log('--------------------------------------');
  console.log('终端 1 - 后端:');
  console.log('  cd backend && npm start');
  console.log('');
  console.log('终端 2 - 前端:');
  console.log('  npm run dev');
  console.log('');
  
  console.log('步骤 3: 暴露服务');
  console.log('--------------------------------------');
  console.log('终端 3 - 暴露后端:');
  console.log('  ngrok http 5000');
  console.log('  复制 https://xxx.ngrok.io URL');
  console.log('');
  console.log('终端 4 - 暴露前端:');
  console.log('  ngrok http 3000');
  console.log('  复制 https://yyy.ngrok.io URL');
  console.log('');
  
  console.log('步骤 4: 更新配置');
  console.log('--------------------------------------');
  console.log('1. 更新 .env.local:');
  console.log('   NEXT_PUBLIC_API_URL=https://xxx.ngrok.io (后端URL)');
  console.log('');
  console.log('2. 更新 backend/.env:');
  console.log('   FRONTEND_URL=https://yyy.ngrok.io (前端URL)');
  console.log('');
  console.log('3. 重启服务');
  console.log('');
  
  console.log('步骤 5: 分享链接');
  console.log('--------------------------------------');
  console.log('访问地址: https://yyy.ngrok.io (前端URL)');
  console.log('');
  console.log('⚠️  注意: ngrok 免费版链接会在重启后改变');
  console.log('');
  
  rl.close();
}

// 生成随机字符串
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
