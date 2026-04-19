# 评分汇总页面 - 比赛列表修复

## 问题描述
评分汇总页面的比赛列表没有正常显示。

## 根本原因
评分汇总页面使用了 `useCompetitions` hook，该 hook 依赖于 `localStorage` 中的 `auth_token`。但是评委会话系统使用的是**设备级别的认证**（通过 `X-Judge-Session-Id` 和 `X-Device-Id` headers），不使用 JWT token。

### 认证系统差异

**管理员认证（JWT）:**
```typescript
// 使用 auth_token
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**评委会话认证（设备级别）:**
```typescript
// 使用 session ID 和 device ID
headers: {
  'X-Judge-Session-Id': sessionId,
  'X-Device-Id': deviceId,
  'Content-Type': 'application/json'
}
```

## 修复方案

### 1. 扩展 judgeApiClient
**文件**: `lib/judge-api-client.ts`

添加了 `getCompetitions` 方法，使用评委会话认证获取比赛列表：

```typescript
async getCompetitions(params?: { 
  status?: string; 
  region?: string; 
  competition_type?: string;
  include_completed_for_summary?: boolean;
}): Promise<any> {
  let url = API_ENDPOINTS.competitions.list;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  const response = await this.makeSessionRequest(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to get competitions');
  }

  return response.json();
}
```

### 2. 修改 ScoreSummaryClient 组件
**文件**: `components/judge/score-summary-client.tsx`

**修改前（使用 useCompetitions hook）:**
```typescript
const { competitions, isLoading: competitionsLoading } = useCompetitions({
  includeCompletedForSummary: true
});
```

**修改后（使用 judgeApiClient）:**
```typescript
// State for competitions
const [competitions, setCompetitions] = useState<Competition[]>([]);
const [competitionsLoading, setCompetitionsLoading] = useState(true);

// Fetch competitions using judgeApiClient
useEffect(() => {
  const fetchCompetitions = async () => {
    if (!currentSession) return;
    
    setCompetitionsLoading(true);
    try {
      const response = await judgeApiClient.getCompetitions({
        include_completed_for_summary: true
      });
      
      setCompetitions(response.data?.competitions || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error(error instanceof Error ? error.message : t('competition.loadCompetitionsFailed'));
      setCompetitions([]);
    } finally {
      setCompetitionsLoading(false);
    }
  };
  
  fetchCompetitions();
}, [currentSession, t]);
```

## 后端支持验证

后端 `competitions.routes.js` 已经使用了 `dualAuth` 中间件：

```javascript
const { dualAuth } = require('../middleware/dual-auth');

// All competition routes require authentication (JWT for admin, session for judge)
router.use(dualAuth);
```

这意味着后端同时支持：
- JWT token 认证（管理员）
- 评委会话认证（评委）

## 测试步骤

1. **选择评委身份**
   - 在评委登录页面选择评委身份
   - 确认评委会话已创建

2. **访问评分汇总页面**
   - 导航到 `/zh/score-summary`
   - 验证页面加载

3. **查看比赛列表**
   - 确认比赛列表正常显示
   - 验证包含进行中和已完成的比赛
   - 检查比赛信息（名称、状态、类型、参赛人数）

4. **选择比赛**
   - 点击一个比赛
   - 验证选手列表加载

5. **查看评分**
   - 选择一个选手
   - 验证评分记录显示

## 预期结果

✅ 评分汇总页面现在应该能够：
- 正确加载比赛列表（包括已完成的比赛）
- 显示每个比赛的详细信息
- 支持比赛选择和选手选择
- 显示选手的评分记录

## 相关文件

- `lib/judge-api-client.ts` - 评委API客户端（新增 getCompetitions 方法）
- `components/judge/score-summary-client.tsx` - 评分汇总组件（修改比赛获取逻辑）
- `backend/routes/competitions.routes.js` - 后端比赛路由（使用 dualAuth）
- `backend/middleware/dual-auth.js` - 双重认证中间件

## 架构说明

### 认证流程

```
评委会话认证流程:
1. 评委选择身份 → 创建 judge_session
2. 存储 session_id 和 device_id
3. 所有API请求携带 X-Judge-Session-Id 和 X-Device-Id headers
4. 后端 dualAuth 中间件验证会话有效性
5. 返回数据

管理员认证流程:
1. 管理员登录 → 获取 JWT token
2. 存储 auth_token 到 localStorage
3. 所有API请求携带 Authorization: Bearer token
4. 后端 dualAuth 中间件验证 token 有效性
5. 返回数据
```

## 日期
2026-04-19
