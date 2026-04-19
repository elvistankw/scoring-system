# Rate Limiting 问题解决方案

## 问题描述
开发过程中遇到 "Too many requests from this IP. Please try again later." 错误，导致无法正常测试功能。

## 原因分析
1. **前端频繁请求**: 页面刷新或组件重新渲染时，会触发多个 API 请求
2. **Rate Limit 设置过严**: 开发环境的 rate limit 设置太低（1000 requests/15min）
3. **Redis 未运行**: Rate limit 计数器存储在内存中，重启后不会清除

## 解决方案

### ✅ 方案 1: 提高 Rate Limit（已实施）

修改 `backend/middleware/rate-limit.js`:

```javascript
// General API: 1000 → 10000 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 提高到 10000
  // ...
});

// Auth API: 50 → 500 requests per 15 minutes  
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 提高到 500
  // ...
});
```

**优点**: 
- 简单快速
- 不影响其他功能
- 适合开发环境

**缺点**:
- 生产环境需要改回较低的值

### 方案 2: 启动 Redis（可选）

如果 Docker Desktop 已安装：

```bash
# 启动 Redis 容器
docker start redis-scoring

# 或者创建新容器
docker run -d --name redis-scoring -p 6379:6379 redis:7-alpine
```

**优点**:
- Rate limit 计数器持久化
- 可以手动清除: `docker exec -it redis-scoring redis-cli FLUSHDB`

### 方案 3: 临时禁用 Rate Limiting（不推荐）

在 `backend/index.js` 中注释掉 rate limiter:

```javascript
// app.use('/api', generalLimiter); // 临时禁用
```

**缺点**: 
- 容易忘记恢复
- 不符合生产环境最佳实践

## 前端优化（已实施）

修改 `components/judge/competition-selector.tsx`，使用 SWR 替代 useEffect:

```typescript
// ❌ 旧方式: 每次 useEffect 触发都会发送新请求
useEffect(() => {
  fetchJudgeScoringStatus();
}, [currentSession?.judge_id, competitionIds, swrFetcher]);

// ✅ 新方式: SWR 自动去重和缓存
const { data: scoringStatusData } = useSWR(
  currentSession?.judge_id && competitions.length > 0 
    ? API_ENDPOINTS.competitions.judgeScoringStatus 
    : null,
  swrFetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 60秒内去重
  }
);
```

**优点**:
- 自动请求去重
- 自动缓存管理
- 减少不必要的 API 调用

## 当前状态

✅ **已完成**:
1. 提高 rate limit 到 10000 requests/15min
2. 提高 auth limit 到 500 requests/15min
3. 前端使用 SWR 优化请求
4. Backend server 重启（Process 31）

✅ **测试**:
- 刷新页面应该不再出现 rate limit 错误
- Judge scoring status 功能可以正常使用

## 生产环境注意事项

⚠️ **部署到生产环境前，必须将 rate limit 改回较低的值**:

```javascript
// 生产环境推荐值
const generalLimiter = rateLimit({
  max: 100, // 100 requests per 15 minutes
});

const authLimiter = rateLimit({
  max: 10, // 10 requests per 15 minutes
});
```

## 监控建议

在生产环境中，建议：
1. 启用 Redis 存储 rate limit 计数器
2. 监控 rate limit 触发频率
3. 根据实际使用情况调整限制值
4. 为不同用户角色设置不同的限制

---

**更新时间**: 2026-04-19  
**Backend Server**: Process 31 (running)  
**Status**: ✅ 问题已解决
