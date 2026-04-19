# 无限循环修复 - 评分汇总页面

## 错误信息
```
Maximum update depth exceeded. This can happen when a component calls setState 
inside useEffect, but useEffect either doesn't have a dependency array, or one 
of the dependencies changes on every render.
```

## 问题原因

### 根本原因
`useEffect` 的依赖数组中包含了 `t` 函数（来自 `useTranslation` hook），该函数在每次渲染时都会创建新的引用，导致：

1. 组件渲染 → `t` 函数创建新引用
2. `useEffect` 检测到 `t` 变化 → 执行 `fetchCompetitions`
3. `setCompetitionsLoading(true)` → 触发重新渲染
4. 回到步骤 1，形成无限循环

### 问题代码
```typescript
useEffect(() => {
  const fetchCompetitions = async () => {
    // ...
    toast.error(error instanceof Error ? error.message : t('competition.loadCompetitionsFailed'));
    // ...
  };
  
  fetchCompetitions();
}, [currentSession, t]); // ❌ t 在每次渲染时都变化
```

## 修复方案

### 1. 移除 `t` 从依赖数组
**文件**: `components/judge/score-summary-client.tsx`

```typescript
useEffect(() => {
  const fetchCompetitions = async () => {
    if (!currentSession) return;
    
    // Set the current session in judgeApiClient
    judgeApiClient.setSession(currentSession);
    
    setCompetitionsLoading(true);
    try {
      const response = await judgeApiClient.getCompetitions({
        include_completed_for_summary: true
      });
      
      setCompetitions(response.data?.competitions || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      // ✅ 使用硬编码的错误消息，避免依赖 t
      toast.error(error instanceof Error ? error.message : '加载比赛列表失败');
      setCompetitions([]);
    } finally {
      setCompetitionsLoading(false);
    }
  };
  
  fetchCompetitions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentSession]); // ✅ 只依赖 currentSession
```

### 2. 添加会话设置
在获取比赛列表之前，确保 `judgeApiClient` 已设置当前会话：

```typescript
// Set the current session in judgeApiClient
judgeApiClient.setSession(currentSession);
```

## 为什么这样修复有效

### 依赖数组最佳实践

**问题依赖:**
- ❌ `t` - 翻译函数，每次渲染都创建新引用
- ❌ `router` - Next.js router，可能在每次渲染时变化
- ❌ 任何来自 context 的函数

**安全依赖:**
- ✅ `currentSession` - 只有在会话真正改变时才变化
- ✅ 原始值（string, number, boolean）
- ✅ 使用 `useCallback` 包装的函数

### 替代方案

如果需要使用翻译，可以考虑：

**方案 A: 使用 useCallback**
```typescript
const fetchCompetitions = useCallback(async () => {
  // ...
  toast.error(t('competition.loadCompetitionsFailed'));
}, [currentSession, t]);

useEffect(() => {
  fetchCompetitions();
}, [fetchCompetitions]);
```

**方案 B: 硬编码关键错误消息（当前方案）**
```typescript
// 对于不频繁显示的错误消息，使用硬编码
toast.error('加载比赛列表失败');
```

**方案 C: 使用 ref 存储 t**
```typescript
const tRef = useRef(t);
useEffect(() => {
  tRef.current = t;
});

useEffect(() => {
  // 使用 tRef.current
}, [currentSession]);
```

## 测试验证

### 验证步骤
1. 打开浏览器开发者工具
2. 访问评分汇总页面
3. 观察 Console 和 Network 标签

### 预期结果
✅ **修复前:**
- Console 显示大量重复的 API 请求
- Network 标签显示无限的请求循环
- 页面可能卡死或崩溃

✅ **修复后:**
- 只有一次 API 请求（当 currentSession 存在时）
- 页面正常加载
- 比赛列表正常显示

## React useEffect 最佳实践

### 1. 最小化依赖
```typescript
// ❌ 不好 - 太多依赖
useEffect(() => {
  fetchData(a, b, c, d, e);
}, [a, b, c, d, e, f, g, h]);

// ✅ 好 - 只依赖真正需要的
useEffect(() => {
  fetchData(id);
}, [id]);
```

### 2. 避免对象和函数依赖
```typescript
// ❌ 不好 - 对象每次都是新的
useEffect(() => {
  fetchData(config);
}, [config]); // config 是对象

// ✅ 好 - 依赖对象的属性
useEffect(() => {
  fetchData({ id: config.id });
}, [config.id]);
```

### 3. 使用 ESLint 规则但理解何时忽略
```typescript
// 有时需要忽略 exhaustive-deps 警告
useEffect(() => {
  // 只在挂载时执行一次
  initializeApp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // 空依赖数组是有意为之
```

## 相关文件
- `components/judge/score-summary-client.tsx` - 修复无限循环
- `lib/judge-api-client.ts` - 评委API客户端

## 日期
2026-04-19
