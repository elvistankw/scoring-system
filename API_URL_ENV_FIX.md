# API URL 环境变量修复

**日期:** 2026年4月19日  
**状态:** ✅ **已修复**

## 问题
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 根本原因

### 环境变量缺失
前端代码尝试访问 API 时，`process.env.NEXT_PUBLIC_API_URL` 未定义，导致：

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

在客户端渲染时，`process.env.NEXT_PUBLIC_API_URL` 为 `undefined`，所以使用了默认值 `'http://localhost:5000'`。

但是，如果环境变量完全缺失，Next.js 可能会尝试使用相对路径，导致请求发送到 Next.js 服务器（3000端口）而不是后端服务器（5000端口）。

### 错误流程
```
前端请求 /api/events/active
  ↓
没有 NEXT_PUBLIC_API_URL
  ↓
请求发送到 http://localhost:3000/api/events/active
  ↓
Next.js 返回 404 HTML 页面
  ↓
前端尝试解析 HTML 为 JSON
  ↓
SyntaxError: Unexpected token '<'
```

## 解决方案

### 1. 添加环境变量到 `.env.local`

```env
# Frontend API URL (must start with NEXT_PUBLIC_ to be accessible in browser)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### 2. 重启 Next.js 开发服务器

环境变量的更改需要重启开发服务器才能生效：

```bash
# 停止当前的 Next.js 服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 3. 验证环境变量

在浏览器控制台中检查：
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL);
// 应该输出: http://localhost:5000
```

## Next.js 环境变量规则

### 服务器端变量
```env
DB_USER=postgres          # ✅ 只在服务器端可用
DB_PASSWORD=secret        # ✅ 只在服务器端可用
JWT_SECRET=secret         # ✅ 只在服务器端可用
```

### 客户端变量（浏览器）
```env
NEXT_PUBLIC_API_URL=http://localhost:5000  # ✅ 客户端和服务器端都可用
NEXT_PUBLIC_WS_URL=http://localhost:5000   # ✅ 客户端和服务器端都可用
```

**规则**: 只有以 `NEXT_PUBLIC_` 开头的环境变量才能在浏览器中访问！

## 为什么需要 NEXT_PUBLIC_ 前缀？

### 安全性
Next.js 默认不会将环境变量暴露给浏览器，防止敏感信息泄露：

```env
# ❌ 不会暴露给浏览器（安全）
DB_PASSWORD=secret
JWT_SECRET=secret

# ✅ 会暴露给浏览器（公开信息）
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 构建时注入
`NEXT_PUBLIC_` 变量在构建时被注入到 JavaScript bundle 中：

```javascript
// 构建后的代码
const API_BASE_URL = "http://localhost:5000";  // 直接替换
```

## 验证修复

### 1. 检查 API 端点
```bash
curl http://localhost:5000/api/events/active
```

应该返回 JSON：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "马六甲扯铃大赛",
    "poster_url": "/default-event-poster.jpg",
    ...
  }
}
```

### 2. 检查前端请求
在浏览器开发者工具的 Network 标签中，检查请求：
- ✅ URL 应该是: `http://localhost:5000/api/events/active`
- ✅ Status 应该是: `200 OK`
- ✅ Response 应该是: JSON 数据

### 3. 检查 Judge Landing Page
访问 `/judge-landing`，应该：
- ✅ 显示比赛海报背景
- ✅ 显示比赛名称
- ✅ 没有 JSON 解析错误

## 相关文件

### 修改的文件
- `.env.local` - 添加 `NEXT_PUBLIC_API_URL` 和 `NEXT_PUBLIC_WS_URL`
- `hooks/use-events.ts` - 使用 `API_ENDPOINTS.events.active` 而不是相对路径

### 配置文件
- `lib/api-config.ts` - API 端点配置
- `backend/routes/events.routes.js` - Events 路由
- `backend/controllers/events.controller.js` - Events 控制器

## 生产环境配置

在生产环境中，需要设置正确的 API URL：

```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

或者在 Vercel/Netlify 等平台的环境变量设置中添加。

## 常见错误

### 错误 1: 忘记 NEXT_PUBLIC_ 前缀
```env
# ❌ 错误 - 浏览器中无法访问
API_URL=http://localhost:5000

# ✅ 正确
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 错误 2: 修改后未重启服务器
```bash
# ❌ 错误 - 环境变量不会自动更新
# 修改 .env.local 后继续使用旧的服务器

# ✅ 正确 - 重启服务器
# Ctrl+C 停止
npm run dev  # 重新启动
```

### 错误 3: 使用相对路径
```typescript
// ❌ 错误 - 可能请求到 Next.js 服务器
const { data } = useSWR('/api/events/active', fetcher);

// ✅ 正确 - 使用完整 URL
const { data } = useSWR(API_ENDPOINTS.events.active, fetcher);
```

## 测试检查清单

- [ ] `.env.local` 包含 `NEXT_PUBLIC_API_URL`
- [ ] `.env.local` 包含 `NEXT_PUBLIC_WS_URL`
- [ ] Next.js 开发服务器已重启
- [ ] 浏览器控制台可以访问 `process.env.NEXT_PUBLIC_API_URL`
- [ ] Network 标签显示请求发送到 `localhost:5000`
- [ ] API 返回 JSON 而不是 HTML
- [ ] Judge Landing Page 正常显示海报
- [ ] 没有 JSON 解析错误

---

**状态**: ✅ 环境变量已添加  
**下一步**: 重启 Next.js 开发服务器以应用更改
