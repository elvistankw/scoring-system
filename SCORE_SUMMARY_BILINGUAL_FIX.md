# Score Summary 页面双语修复 ✅

## 问题描述

用户报告 score-summary 页面存在以下问题：
1. User menu 没有显示双语
2. 评分详情中的标签（动作难度、舞台艺术等）没有显示双语
3. 显示"评审 #1"而不是评审的真实姓名

## 修复内容

### 1. User Menu 双语修复

**文件**: `components/judge/score-summary-client.tsx`

修改了 User Menu 中的所有文本，使用 `BilingualText` 组件：

```typescript
// 评审角色标签
<BilingualText 
  translationKey="judge.judgeRole" 
  chineseSize="text-xs" 
  englishSize="text-xs"
/>

// 评审代码标签
<BilingualText 
  translationKey="judge.judgeCodeLabel" 
  chineseSize="text-xs" 
  englishSize="text-xs"
/>: {currentSession?.judge_code}

// 评审仪表板
<BilingualText 
  translationKey="judge.judgeDashboard" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>

// 设置
<BilingualText 
  translationKey="common.settings" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>

// 登出
<BilingualText 
  translationKey="common.logout" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>
```

### 2. 评分详情标签双语修复

**文件**: `components/judge/score-summary-client.tsx`

修改了所有评分维度标签，使用 `BilingualText` 组件：

```typescript
// 动作难度 / Action Difficulty
<BilingualText 
  translationKey="score.actionDifficulty" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>:

// 舞台艺术 / Stage Artistry
<BilingualText 
  translationKey="score.stageArtistry" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>:

// 动作创意 / Action Creativity
<BilingualText 
  translationKey="score.actionCreativity" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>:

// 动作流畅 / Action Fluency
<BilingualText 
  translationKey="score.actionFluency" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>:

// 服装造型 / Costume Styling
<BilingualText 
  translationKey="score.costumeStyling" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>:

// 动作互动 / Action Interaction
<BilingualText 
  translationKey="score.actionInteraction" 
  chineseSize="text-sm" 
  englishSize="text-xs"
/>:
```

### 3. 显示评审真实姓名

#### 前端修改

**文件**: `components/judge/score-summary-client.tsx`

修改评分卡片显示逻辑，优先显示 `judge_name`：

```typescript
<p className="font-medium text-gray-900 dark:text-white">
  {score.judge_name || `${t('judge.judge')} #${index + 1}`}
</p>
```

#### 后端修改

**文件**: `backend/controllers/scores.controller.js`

修改了两个方法以支持 judge session 登录：

**1. `getScores` 方法**

```javascript
// 使用 LEFT JOIN 和 COALESCE 支持两种登录方式
let query = `
  SELECT 
    s.*,
    a.name as athlete_name,
    a.athlete_number,
    COALESCE(u.username, js.judge_name) as judge_name,
    c.competition_type,
    c.name as competition_name,
    c.region
  FROM scores s
  INNER JOIN athletes a ON s.athlete_id = a.id
  LEFT JOIN users u ON s.judge_id = u.id
  LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
  INNER JOIN competitions c ON s.competition_id = c.id
  WHERE 1=1
`;
```

**2. `getScoresByCompetition` 方法**

```javascript
// 同样使用 LEFT JOIN 和 COALESCE
let query = `
  SELECT 
    s.*,
    a.name as athlete_name,
    a.athlete_number,
    COALESCE(u.username, js.judge_name) as judge_name,
    c.competition_type,
    c.name as competition_name
  FROM scores s
  INNER JOIN athletes a ON s.athlete_id = a.id
  LEFT JOIN users u ON s.judge_id = u.id
  LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
  INNER JOIN competitions c ON s.competition_id = c.id
  WHERE s.competition_id = $1
`;
```

**关键点**:
- 使用 `LEFT JOIN` 而不是 `INNER JOIN` 连接 `users` 和 `judge_sessions` 表
- 使用 `COALESCE(u.username, js.judge_name)` 优先使用 admin 用户名，如果不存在则使用 judge session 名称
- 这样支持两种登录方式：
  - Admin 登录（从 `users` 表获取 `username`）
  - Judge Session 登录（从 `judge_sessions` 表获取 `judge_name`）

## 修改的文件

### 前端
- `components/judge/score-summary-client.tsx` - 添加 BilingualText 组件到所有用户界面文本

### 后端
- `backend/controllers/scores.controller.js` - 修改 SQL 查询以支持两种登录方式并返回正确的 judge_name

## 测试步骤

1. **启动服务器**
   ```bash
   cd backend
   node index.js
   ```

2. **登录为评审**
   - 访问 `/judge-landing`
   - 选择评审身份

3. **查看评分汇总**
   - 进入 `/score-summary`
   - 选择比赛
   - 选择选手

4. **验证修复**
   - ✅ User menu 显示双语（评审角色、评审代码、评审仪表板、设置、登出）
   - ✅ 评分详情标签显示双语（动作难度、舞台艺术、动作创意等）
   - ✅ 显示评审真实姓名而不是"评审 #1"

## 预期结果

### User Menu
```
[头像] 张三
       评审 / Judge

下拉菜单：
- 评审仪表板 / Judge Dashboard
- 设置 / Settings
- 登出 / Logout
```

### 评分详情
```
张三
2026/4/19 02:42:19

动作难度 / Action Difficulty: 1.00
舞台艺术 / Stage Artistry: 7.00
动作创意 / Action Creativity: 1.00
动作流畅 / Action Fluency: 15.00
服装造型 / Costume Styling: 1.00
```

## 已知问题

### 端口占用问题
Backend 重启时遇到 `EADDRINUSE: address already in use :::5000` 错误。

**临时解决方案**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# 或者杀掉所有 node 进程
Get-Process node | Stop-Process -Force

# 等待 TIME_WAIT 状态清除
timeout /t 5 /nobreak

# 重新启动
cd backend
node index.js
```

**永久解决方案**:
- 确保正确关闭之前的 backend 进程
- 使用 process manager (如 PM2) 管理 node 进程
- 或者重启电脑清除所有 TIME_WAIT 连接

## 状态

- ✅ 前端修改完成
- ✅ 后端修改完成
- ⏳ 等待 backend 成功重启以测试功能

---

**更新时间**: 2026-04-19  
**修改者**: Kiro AI Assistant  
**相关文档**: `JUDGE_SCORING_COMPLETION_IMPLEMENTATION.md`, `RATE_LIMIT_FIX.md`
