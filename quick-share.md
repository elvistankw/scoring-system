# 🚀 快速分享 - 让其他人远程访问 (5分钟设置)

## 最简单的方法：使用 ngrok

### 步骤 1: 安装 ngrok

1. 访问 [ngrok.com](https://ngrok.com)
2. 注册账号（免费）
3. 下载 ngrok
4. 解压到任意目录

### 步骤 2: 启动本地服务

打开 **4 个终端窗口**：

**终端 1 - 启动后端:**
```bash
cd backend
npm start
```
等待看到 "Server running on port 5000"

**终端 2 - 启动前端:**
```bash
npm run dev
```
等待看到 "Ready on http://localhost:3000"

**终端 3 - 暴露后端:**
```bash
ngrok http 5000
```
复制显示的 URL，例如: `https://abc123.ngrok.io`

**终端 4 - 暴露前端:**
```bash
ngrok http 3000
```
复制显示的 URL，例如: `https://xyz789.ngrok.io`

### 步骤 3: 更新配置

1. **停止前端** (终端 2 按 Ctrl+C)

2. **更新 `.env.local`** 文件:
```env
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```
(使用终端 3 中的后端 URL)

3. **更新 `backend/.env`** 文件:
```env
FRONTEND_URL=https://xyz789.ngrok.io
```
(使用终端 4 中的前端 URL)

4. **重启前端** (终端 2):
```bash
npm run dev
```

### 步骤 4: 分享链接

✅ **访问地址**: `https://xyz789.ngrok.io` (终端 4 的前端 URL)

把这个链接分享给其他人，他们就可以远程访问了！

---

## ⚠️ 注意事项

1. **免费版限制**:
   - 每次重启 ngrok，URL 会改变
   - 需要重新更新配置
   - 同时最多 1 个连接

2. **保持运行**:
   - 4 个终端窗口都要保持运行
   - 关闭任何一个，服务就会停止

3. **网络要求**:
   - 需要稳定的网络连接
   - 建议使用有线网络

---

## 🎯 更好的方案：使用 Vercel (推荐)

如果需要长期使用，建议部署到 Vercel：

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/scoring-system.git
git push -u origin main
```

### 2. 部署到 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 导入项目
4. 自动部署

### 3. 获取永久链接
Vercel 会提供一个永久链接，如: `https://scoring-system.vercel.app`

---

## 📞 遇到问题？

### Q: ngrok 显示 "ERR_NGROK_108"
**A**: 需要注册 ngrok 账号并认证
```bash
ngrok authtoken 你的token
```

### Q: 前端无法连接后端
**A**: 检查 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正确

### Q: 其他人无法访问
**A**: 
1. 确保 4 个终端都在运行
2. 检查防火墙设置
3. 确认 ngrok URL 正确

### Q: 想要更稳定的方案
**A**: 参考 `STAGING_DEPLOYMENT_GUIDE.md` 使用云端部署

---

## ✅ 快速检查清单

- [ ] 后端正在运行 (终端 1)
- [ ] 前端正在运行 (终端 2)
- [ ] 后端 ngrok 正在运行 (终端 3)
- [ ] 前端 ngrok 正在运行 (终端 4)
- [ ] `.env.local` 已更新
- [ ] `backend/.env` 已更新
- [ ] 可以通过 ngrok URL 访问

---

## 🎉 完成！

现在你可以把前端的 ngrok URL 分享给其他人测试了！
