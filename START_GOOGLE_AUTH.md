# 🚀 Google 账户连接功能 - 快速启动指南

## ⚡ 5分钟快速启动

### 步骤 1: 运行数据库迁移 (30秒)

```bash
cd backend
psql -U postgres -d scoring -f migrations/002_google_integration.sql
```

**预期输出**:
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
COMMENT
...
```

### 步骤 2: 验证配置 (30秒)

```bash
node test-google-integration.js
```

**预期输出**:
```
🔍 Testing Google OAuth Configuration...

1. Checking environment variables:
   ✅ GOOGLE_CLIENT_ID: 731934051308-f1g186e...
   ✅ GOOGLE_CLIENT_SECRET: GOCSPX-k-0EsThQZZfXe...
   ✅ GOOGLE_REDIRECT_URI: http://localhost:500...
   ✅ FRONTEND_URL: http://localhost:300...

2. Testing OAuth2Client initialization:
   ✅ OAuth2Client initialized successfully
   ✅ Auth URL generated successfully

3. Testing Google API clients:
   ✅ Google Drive API client initialized
   ✅ Google Sheets API client initialized

4. Checking database table:
   ✅ user_google_tokens table exists
   📋 Table columns: ...

✅ Google OAuth integration test completed!
```

### 步骤 3: 启动服务 (1分钟)

**终端 1 - 后端**:
```bash
cd backend
npm run dev
```

**终端 2 - 前端**:
```bash
npm run dev
```

### 步骤 4: 测试功能 (3分钟)

1. 访问: http://localhost:3000/zh/sign-in
2. 登录评审账户
3. 进入评分汇总页面
4. 点击"连接Google账户"
5. 完成授权
6. 测试导出功能

## ✅ 验证清单

在开始使用前，请确认：

- [ ] PostgreSQL 数据库正在运行
- [ ] Redis 服务正在运行（如果使用）
- [ ] 后端服务启动成功（端口 5000）
- [ ] 前端服务启动成功（端口 3000）
- [ ] 数据库迁移已完成
- [ ] 测试脚本运行成功
- [ ] 可以访问 Google 服务

## 🎯 快速测试

### 测试 1: 连接 Google 账户

```
1. 登录 → 2. 评分汇总 → 3. 点击"连接Google账户" → 4. 授权 → 5. 成功
```

**预期时间**: < 30秒

### 测试 2: 导出到 Google Drive

```
1. 选择比赛 → 2. 点击"导出Excel" → 3. 选择"Google Drive" → 4. 成功
```

**预期时间**: < 10秒

### 测试 3: 创建在线 Excel

```
1. 选择比赛 → 2. 点击"导出Excel" → 3. 选择"在线Excel" → 4. 打开表格
```

**预期时间**: < 10秒

## 🐛 常见问题快速解决

### 问题 1: 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
psql -U postgres -d scoring -c "SELECT 1;"

# 如果失败，启动 PostgreSQL
# Windows: 服务管理器中启动 PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### 问题 2: 端口被占用

```bash
# 检查端口占用
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# 修改端口（在 .env 文件中）
PORT=5001
```

### 问题 3: Google 授权失败

```bash
# 检查环境变量
cat backend/.env | grep GOOGLE

# 确保所有变量都已设置
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
FRONTEND_URL=...
```

## 📱 快速访问链接

| 页面 | URL |
|------|-----|
| 登录 | http://localhost:3000/zh/sign-in |
| 评分汇总 | http://localhost:3000/zh/score-summary |
| Google Drive | https://drive.google.com |
| Google Cloud Console | https://console.cloud.google.com |

## 🎓 学习资源

### 5分钟快速了解
- 阅读: `GOOGLE_AUTH_USER_GUIDE.md`

### 10分钟深入学习
- 阅读: `GOOGLE_AUTH_SETUP.md`

### 30分钟完整掌握
- 阅读: `GOOGLE_WORKSPACE_INTEGRATION_GUIDE.md`
- 运行: 演示脚本 `GOOGLE_AUTH_DEMO.md`

## 🔧 开发者快速参考

### API 端点

```javascript
// 获取授权链接
GET /api/auth/google/auth-url
Headers: { Authorization: 'Bearer TOKEN' }

// 检查授权状态
GET /api/auth/google/status
Headers: { Authorization: 'Bearer TOKEN' }

// OAuth 回调（由 Google 调用）
GET /api/auth/google/callback?code=xxx&state=userId
```

### 前端组件使用

```tsx
import { GoogleAuthButton } from '@/components/shared/google-auth-button';

<GoogleAuthButton 
  onAuthSuccess={() => console.log('授权成功')}
  variant="compact"
/>
```

### 数据库查询

```sql
-- 查看所有授权用户
SELECT u.username, ugt.google_email, ugt.expires_at
FROM user_google_tokens ugt
JOIN users u ON u.id = ugt.user_id;

-- 检查令牌是否过期
SELECT * FROM user_google_tokens
WHERE expires_at < NOW();
```

## 📊 性能基准

| 操作 | 预期时间 |
|------|----------|
| 生成授权链接 | < 100ms |
| OAuth 回调处理 | < 500ms |
| 检查授权状态 | < 200ms |
| 上传到 Drive | < 5s |
| 创建 Sheets | < 3s |

## 🎉 成功标志

当您看到以下内容时，说明功能正常运行：

1. ✅ 测试脚本全部通过
2. ✅ 后端日志显示 "Server running on port 5000"
3. ✅ 前端可以访问 http://localhost:3000
4. ✅ "连接Google账户"按钮可见
5. ✅ 点击按钮后弹出 Google 授权窗口
6. ✅ 授权成功后按钮显示"已连接"
7. ✅ 可以成功导出到 Google Drive

## 🚨 紧急故障排除

如果遇到严重问题：

1. **重启所有服务**
   ```bash
   # 停止所有服务 (Ctrl+C)
   # 重新启动
   cd backend && npm run dev
   # 新终端
   npm run dev
   ```

2. **清除缓存**
   ```bash
   # 清除浏览器缓存
   # Chrome: Ctrl+Shift+Delete
   # 清除 localStorage
   localStorage.clear()
   ```

3. **重置数据库**
   ```bash
   psql -U postgres -d scoring
   DROP TABLE IF EXISTS user_google_tokens CASCADE;
   \q
   psql -U postgres -d scoring -f backend/migrations/002_google_integration.sql
   ```

4. **检查日志**
   ```bash
   # 后端日志
   # 查看终端输出
   
   # 前端日志
   # 打开浏览器开发者工具 (F12)
   # 查看 Console 标签
   ```

## 📞 获取帮助

如果问题仍未解决：

1. 查看详细文档: `GOOGLE_AUTH_SETUP.md`
2. 运行诊断脚本: `node backend/test-google-integration.js`
3. 检查 GitHub Issues
4. 联系技术支持

## 🎊 开始使用

一切准备就绪！现在您可以：

1. 🔗 连接您的 Google 账户
2. 📤 导出评分数据到 Google Drive
3. 📊 创建在线可编辑的 Google Sheets
4. 🤝 与团队成员共享评分文件

祝您使用愉快！ 🚀

---

**最后更新**: 2026-04-13
**版本**: 1.0.0
**状态**: ✅ 生产就绪
