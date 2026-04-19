# 评委评分完成状态功能

## 功能描述

实现评委评分完成状态检查功能，当评委提交所有选手的评分后：
- 比赛卡片显示"已完成评分 / Scoring Completed"而不是"可评分 / Can Score"
- 评委不能再进入该比赛进行评分
- 显示已评分选手数量和总选手数量（例如：3/3）

## 实现细节

### 1. 后端API

#### 新增端点
```
GET /api/competitions/judge-scoring-status
```

**功能**：检查当前评委在所有活跃比赛中的评分完成状态

**返回数据**：
```json
{
  "status": "success",
  "data": {
    "judge_id": 30,
    "competitions": {
      "103": {
        "completed": true,
        "scored_count": 3,
        "total_athletes": 3
      },
      "104": {
        "completed": false,
        "scored_count": 1,
        "total_athletes": 5
      }
    }
  }
}
```

**判断逻辑**：
- 查询每个活跃比赛的总选手数
- 查询评委已提交评分的选手数（`submitted_at IS NOT NULL`）
- 如果 `scored_count >= total_athletes` 且 `total_athletes > 0`，则标记为已完成

#### 修改的文件
- `backend/controllers/competitions.controller.js` - 添加 `getJudgeScoringStatus` 方法
- `backend/routes/competitions.routes.js` - 添加路由

### 2. 前端实现

#### API配置
- `lib/api-config.ts` - 添加 `judgeScoringStatus` 端点

#### CompetitionSelector组件
- 添加 `judgeScoringStatus` 状态来存储评分完成信息
- 添加 `useEffect` 钩子获取评分状态
- 修改比赛卡片渲染逻辑：
  - 使用 `judgeScoringStatus[competition.id]` 判断是否完成
  - 已完成：显示蓝色勾选图标 + "已完成评分"
  - 可评分：显示绿色勾选图标 + "可评分"
  - 不可评分：显示灰色禁止图标 + "不可评分"
- 显示评分进度：`(scored_count/total_athletes)`

#### 点击行为
```typescript
const canScore = competition.status === 'active' && !isScoringCompleted;

<GlassCard
  onClick={() => canScore && onSelect(competition)}
  className={canScore ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
>
```

### 3. 用户体验流程

#### 评分前
```
比赛卡片：
┌─────────────────────────────┐
│ 2026华东个人赛              │
│ 个人 | 小学组 | 👥 3        │
│ 📍 华东赛区                 │
│ 📅 2026-04-15              │
│ ✅ 可评分 (0/3)            │ ← 绿色，可点击
└─────────────────────────────┘
```

#### 评分中
```
比赛卡片：
┌─────────────────────────────┐
│ 2026华东个人赛              │
│ 个人 | 小学组 | 👥 3        │
│ 📍 华东赛区                 │
│ 📅 2026-04-15              │
│ ✅ 可评分 (2/3)            │ ← 绿色，可点击
└─────────────────────────────┘
```

#### 评分完成后
```
比赛卡片：
┌─────────────────────────────┐
│ 2026华东个人赛              │
│ 个人 | 小学组 | 👥 3        │
│ 📍 华东赛区                 │
│ 📅 2026-04-15              │
│ ✅ 已完成评分 (3/3)        │ ← 蓝色，不可点击，半透明
└─────────────────────────────┘
```

## 技术要点

### 1. 评分完成判断
```sql
-- 检查评委是否完成评分
SELECT COUNT(*) as scored_count
FROM scores
WHERE competition_id = $1 
AND judge_id = $2
AND submitted_at IS NOT NULL  -- 关键：只计算已提交的评分
```

### 2. 状态同步
- 评委提交评分后，前端自动刷新评分状态
- 使用 `useEffect` 监听 `competitionIds` 变化
- 避免重复请求（使用 `isFetchingRef`）

### 3. 性能优化
- 一次API调用获取所有比赛的状态
- 前端缓存状态，避免频繁请求
- 只在必要时刷新（比赛列表变化、评委切换）

## 相关文件

### 后端
- `backend/controllers/competitions.controller.js` - 评分状态控制器
- `backend/routes/competitions.routes.js` - 路由配置

### 前端
- `lib/api-config.ts` - API端点配置
- `components/judge/competition-selector.tsx` - 比赛选择器组件
- `components/judge/scoring-client.tsx` - 评分页面（提交后触发刷新）

## 测试场景

### 场景1：首次评分
1. 评委登录，查看比赛列表
2. 所有比赛显示"可评分 (0/N)"
3. 点击进入评分页面

### 场景2：部分评分
1. 评委为部分选手评分并提交
2. 返回比赛列表
3. 比赛显示"可评分 (X/N)"，X < N
4. 仍可点击进入继续评分

### 场景3：完成评分
1. 评委为所有选手评分并提交
2. 返回比赛列表
3. 比赛显示"已完成评分 (N/N)"
4. 卡片变为半透明，不可点击
5. 尝试点击无反应

### 场景4：多个比赛
1. 评委同时负责多个比赛
2. 每个比赛独立显示评分状态
3. 完成一个不影响其他比赛

## 数据库查询示例

```sql
-- 获取评委在某比赛的评分状态
SELECT 
  c.id as competition_id,
  c.name as competition_name,
  COUNT(DISTINCT ca.athlete_id) as total_athletes,
  COUNT(DISTINCT s.athlete_id) as scored_athletes
FROM competitions c
LEFT JOIN competition_athletes ca ON c.id = ca.competition_id
LEFT JOIN scores s ON c.id = s.competition_id 
  AND s.judge_id = 30 
  AND s.submitted_at IS NOT NULL
WHERE c.id = 103
GROUP BY c.id, c.name;
```

## 日期
2026-04-19

## 状态
✅ 后端API已实现
✅ 前端组件已更新
✅ 后端服务器已重启
⏳ 等待用户测试确认
