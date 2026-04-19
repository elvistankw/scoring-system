# 评委会话认证修复总结

## 问题描述

用户反映在评委仪表板点击比赛后，会弹出"请先选择评委身份"的提示，然后被重定向回评委登录页面。

## 根本原因

### 问题 1: CORS 配置缺少自定义头部

**位置**: `backend/middleware/security-headers.js`

CORS 配置中的 `allowedHeaders` 只包含了 `'Content-Type'` 和 `'Authorization'`，但评委会话认证需要以下自定义头部：
- `x-judge-session-id`: 评委会话 ID
- `x-device-id`: 设备 ID

**影响**: 前端发送的评委会话头部被 CORS 策略阻止，导致后端无法识别评委身份。

### 问题 2: 评分页面会话检查逻辑缺陷

**位置**: `components/judge/scoring-client.tsx`

评分页面的 `useEffect` 钩子在检查评委会话时存在以下问题：

1. **缺少 `currentSession` 依赖**: 依赖数组中只有 `[router, locale]`，没有包含 `currentSession`
2. **没有检查加载状态**: 没有使用 `loadingSession` 来判断会话是否还在加载中

**影响**: 
- 当组件首次加载时，`currentSession` 可能还是 `null`（因为会话数据还在异步加载）
- 由于依赖数组中没有 `currentSession`，即使后来会话加载成功，这个检查也不会重新执行
- 结果就是用户看到"请先选择评委身份"的错误提示并被重定向

## 修复方案

### 修复 1: 更新 CORS 配置

**文件**: `backend/middleware/security-headers.js`

```javascript
// 修改前
allowedHeaders: ['Content-Type', 'Authorization'],

// 修改后
allowedHeaders: ['Content-Type', 'Authorization', 'x-judge-session-id', 'x-device-id'],
```

**效果**: 允许前端发送评委会话认证所需的自定义头部。

### 修复 2: 完善评分页面会话检查逻辑

**文件**: `components/judge/scoring-client.tsx`

#### 2.1 添加 `loadingSession` 状态

```typescript
// 修改前
const { currentSession } = useJudgeSession();

// 修改后
const { currentSession, loadingSession } = useJudgeSession();
```

#### 2.2 更新 useEffect 依赖数组和逻辑

```typescript
// 修改前
useEffect(() => {
  if (!currentSession) {
    toast.error('请先选择评委身份');
    // ...重定向逻辑
  }
  // ...其他逻辑
}, [router, locale]); // ❌ 缺少 currentSession 和 loadingSession

// 修改后
useEffect(() => {
  // ✅ 先检查是否还在加载中
  if (loadingSession) return;
  
  if (!currentSession) {
    toast.error('请先选择评委身份');
    // ...重定向逻辑
  }
  // ...其他逻辑
}, [currentSession, loadingSession, router, locale]); // ✅ 包含所有必要的依赖
```

**效果**: 
- 等待会话加载完成后再进行检查
- 当会话状态变化时会重新执行检查逻辑
- 避免在会话加载过程中误判为"未登录"

## 其他相关改进

### 1. 双重认证中间件

**文件**: `backend/routes/competitions.routes.js`, `backend/routes/athletes.routes.js`

将这些路由从单一的 JWT 认证改为支持双重认证（JWT + 评委会话）：

```javascript
// 修改前
router.use(authenticate);

// 修改后
router.use(dualAuth);
```

**效果**: 评委可以使用会话认证访问比赛和选手数据，管理员仍然使用 JWT 认证。

### 2. SWR 评委专用 Fetcher

**文件**: `lib/swr-config.ts`

创建了专门用于评委会话认证的 fetcher：

```typescript
export const judgeFetcher = (sessionId: string, deviceId: string) => async (url: string) => {
  const headers = getJudgeSessionHeaders(sessionId, deviceId);
  const response = await fetch(url, { headers });
  // ...错误处理
  return response.json();
};
```

**文件**: `components/judge/competition-selector.tsx`

在比赛选择器中使用评委专用 fetcher：

```typescript
const swrFetcher = currentSession 
  ? judgeFetcher(currentSession.id.toString(), currentSession.device_id)
  : fetcher;
```

**效果**: 确保评委在获取数据时使用正确的认证头部。

## 测试验证

### 测试场景 1: 评委登录并选择比赛

1. ✅ 评委在 judge-landing 页面选择身份
2. ✅ 成功创建评委会话
3. ✅ 跳转到 judge-dashboard 页面
4. ✅ 可以看到比赛列表（使用评委会话认证）
5. ✅ 点击比赛后成功跳转到评分页面
6. ✅ 不再出现"请先选择评委身份"的错误提示

### 测试场景 2: 后端认证验证

通过测试脚本验证：
- ✅ 评委会话可以访问 `/api/competitions` 端点
- ✅ 评委会话可以访问 `/api/athletes` 端点
- ✅ 后端正确识别评委会话头部
- ✅ 双重认证中间件正常工作

### 后端日志确认

```
✅ Current session found: 吴十评委 (J008)
⚠️  Cache MISS for competitions list: active:all:all:judge:false
✅ Cached competitions list: active:all:all:judge:false
```

## 系统状态

### ✅ 已修复的功能

1. **评委会话认证**: 评委可以使用设备会话进行认证
2. **CORS 配置**: 允许评委会话所需的自定义头部
3. **比赛访问**: 评委可以查看和选择比赛
4. **选手访问**: 评委可以查看选手列表
5. **评分页面**: 点击比赛后正确跳转到评分页面
6. **会话状态管理**: 正确处理会话加载状态，避免误判

### ✅ 工作正常的组件

- `judge-landing-client.tsx`: 评委身份选择页面
- `judge-dashboard-client.tsx`: 评委仪表板
- `scoring-client.tsx`: 评分页面（已修复）
- `score-summary-client.tsx`: 评分总结页面
- `competition-selector.tsx`: 比赛选择器
- `use-judge-session.ts`: 评委会话管理钩子

## 技术要点

### 1. React Hooks 依赖数组

在使用 `useEffect` 时，必须在依赖数组中包含所有在 effect 中使用的响应式值：

```typescript
// ❌ 错误：缺少依赖
useEffect(() => {
  if (!currentSession) {
    // ...
  }
}, [router, locale]); // currentSession 未包含

// ✅ 正确：包含所有依赖
useEffect(() => {
  if (loadingSession) return;
  if (!currentSession) {
    // ...
  }
}, [currentSession, loadingSession, router, locale]);
```

### 2. 异步状态加载

在检查异步加载的状态时，应该先检查加载状态：

```typescript
// ✅ 正确的模式
if (loadingSession) {
  return; // 或显示加载状态
}

if (!currentSession) {
  // 现在可以安全地判断为"未登录"
}
```

### 3. CORS 自定义头部

当使用自定义 HTTP 头部时，必须在 CORS 配置中明确允许：

```javascript
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'x-judge-session-id',  // 自定义头部
  'x-device-id'          // 自定义头部
]
```

## 后续建议

1. **添加会话过期提示**: 当评委会话过期时，显示友好的提示信息
2. **会话自动续期**: 在用户活跃时自动延长会话有效期
3. **离线支持**: 考虑添加离线评分功能，在网络恢复后同步
4. **错误边界**: 添加 React Error Boundary 来捕获和处理组件错误

## 相关文件

### 后端文件
- `backend/middleware/security-headers.js` - CORS 配置
- `backend/middleware/dual-auth.js` - 双重认证中间件
- `backend/routes/competitions.routes.js` - 比赛路由
- `backend/routes/athletes.routes.js` - 选手路由

### 前端文件
- `components/judge/scoring-client.tsx` - 评分页面（已修复）
- `components/judge/judge-dashboard-client.tsx` - 评委仪表板
- `components/judge/competition-selector.tsx` - 比赛选择器
- `hooks/use-judge-session.ts` - 评委会话钩子
- `lib/swr-config.ts` - SWR 配置和 fetcher
- `lib/judge-api-client.ts` - 评委 API 客户端

## 修复时间

2026-04-18

## 修复人员

Kiro AI Assistant
