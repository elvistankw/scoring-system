# 🚀 部署选项总览

## 快速选择指南

| 方案 | 时间 | 难度 | 成本 | 稳定性 | 适用场景 |
|------|------|------|------|--------|----------|
| **ngrok** | 5分钟 | ⭐ | 免费 | ⭐⭐ | 临时演示、快速测试 |
| **Vercel + Railway** | 30分钟 | ⭐⭐ | 免费 | ⭐⭐⭐⭐ | 测试版、小团队 |
| **Docker + VPS** | 2小时 | ⭐⭐⭐⭐ | ¥50/月 | ⭐⭐⭐⭐⭐ | 正式使用、大规模 |

---

## 方案 1: ngrok (最快 - 5分钟)

### ✅ 优点
- 最快速，5分钟内完成
- 无需服务器
- 无需域名
- 完全免费

### ❌ 缺点
- URL 每次重启会变
- 免费版有连接限制
- 需要保持电脑运行
- 不适合长期使用

### 📝 使用步骤

**Windows:**
```bash
# 1. 启动后端
cd backend
npm start

# 2. 启动前端 (新终端)
npm run dev

# 3. 运行 ngrok 脚本 (新终端)
start-ngrok.bat
```

**Mac/Linux:**
```bash
# 1. 启动后端
cd backend
npm start

# 2. 启动前端 (新终端)
npm run dev

# 3. 运行 ngrok 脚本 (新终端)
chmod +x start-ngrok.sh
./start-ngrok.sh
```

### 📖 详细文档
参考: `quick-share.md`

---

## 方案 2: Vercel + Railway (推荐 - 30分钟)

### ✅ 优点
- 永久 URL
- 自动 HTTPS
- 全球 CDN
- 自动部署
- 免费额度充足

### ❌ 缺点
- 需要 GitHub 账号
- 首次设置稍复杂
- 免费版有使用限制

### 📝 使用步骤

1. **准备代码**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/scoring-system.git
git push -u origin main
```

2. **部署后端到 Railway**
- 访问 [railway.app](https://railway.app)
- 使用 GitHub 登录
- 创建新项目 → Deploy from GitHub
- 添加 PostgreSQL 数据库
- 配置环境变量

3. **部署前端到 Vercel**
- 访问 [vercel.com](https://vercel.com)
- 使用 GitHub 登录
- 导入项目
- 配置环境变量
- 自动部署

4. **初始化数据库**
```bash
railway login
railway link
railway run node backend/migrations/run-migrations.js
```

### 📖 详细文档
参考: `STAGING_DEPLOYMENT_GUIDE.md` - 选项 1

---

## 方案 3: Docker + VPS (最稳定 - 2小时)

### ✅ 优点
- 完全控制
- 最稳定
- 性能最好
- 可自定义域名
- 适合正式使用

### ❌ 缺点
- 需要购买服务器
- 设置较复杂
- 需要维护
- 有一定成本

### 📝 使用步骤

1. **购买 VPS**
   - 阿里云、腾讯云、AWS 等
   - 推荐配置: 2核4G，40GB存储

2. **安装 Docker**
```bash
ssh root@你的服务器IP
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

3. **部署应用**
```bash
# 上传代码
rsync -avz ./ root@你的IP:/opt/scoring-system/

# 启动服务
cd /opt/scoring-system
docker-compose -f docker-compose.staging.yml up -d --build
```

4. **配置域名** (可选)
   - 购买域名
   - 配置 DNS 解析
   - 设置 Nginx 反向代理

### 📖 详细文档
参考: `STAGING_DEPLOYMENT_GUIDE.md` - 选项 2

---

## 🎯 推荐方案

### 场景 1: 快速演示给客户看
**推荐**: ngrok
- 5分钟内完成
- 立即可用
- 无需任何配置

### 场景 2: 团队内部测试 (1-2周)
**推荐**: Vercel + Railway
- 稳定的 URL
- 团队成员随时访问
- 免费且可靠

### 场景 3: 正式比赛使用
**推荐**: Docker + VPS
- 最稳定
- 性能最好
- 完全控制

---

## 📞 快速帮助

### 我该选择哪个方案？

**回答这些问题:**

1. **使用时长?**
   - 几小时 → ngrok
   - 几周 → Vercel + Railway
   - 长期 → Docker + VPS

2. **用户数量?**
   - <10人 → ngrok
   - 10-100人 → Vercel + Railway
   - >100人 → Docker + VPS

3. **技术水平?**
   - 初学者 → ngrok
   - 中级 → Vercel + Railway
   - 高级 → Docker + VPS

4. **预算?**
   - ¥0 → ngrok 或 Vercel + Railway
   - ¥50-200/月 → Docker + VPS

---

## 🚀 快速开始

### 最简单的方式 (5分钟):

1. 确保服务正在运行:
```bash
# 终端 1
cd backend && npm start

# 终端 2
npm run dev
```

2. 运行分享脚本:
```bash
# Windows
start-ngrok.bat

# Mac/Linux
./start-ngrok.sh
```

3. 分享生成的 URL 给其他人！

---

## 📚 更多资源

- **快速分享指南**: `quick-share.md`
- **完整部署指南**: `STAGING_DEPLOYMENT_GUIDE.md`
- **生产环境检查**: `PRODUCTION_READINESS_CHECKLIST.md`
- **快速部署指南**: `QUICK_DEPLOY_GUIDE.md`

---

## 💡 提示

1. **开发环境**: 使用 `npm run dev` (热重载)
2. **测试环境**: 使用 ngrok 或 Vercel
3. **生产环境**: 使用 Docker + VPS

---

## ✅ 部署成功检查

- [ ] 可以访问前端页面
- [ ] 可以注册和登录
- [ ] 可以创建比赛
- [ ] 可以添加选手
- [ ] 评审可以打分
- [ ] 大屏幕可以显示

---

需要帮助？查看对应的详细文档或联系技术支持。
