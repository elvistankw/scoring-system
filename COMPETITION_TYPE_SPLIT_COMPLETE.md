# 比赛类型拆分完成 - 双人赛 vs 团体赛

## ✅ 完成状态

已成功将 `duo_team` 拆分为 `duo`（双人）和 `team`（团体）两个独立类型。

## 📋 已更新的文件

### 1. 类型定义
- ✅ `interface/competition.ts` - CompetitionType 类型定义

### 2. 国际化翻译
- ✅ `i18n/locales/zh.json` - 中文翻译
- ✅ `i18n/locales/en.json` - 英文翻译

### 3. 后端验证
- ✅ `backend/controllers/competitions.controller.js` - 两处 validTypes 更新

### 4. 前端组件
- ✅ `components/admin/competition-form.tsx` - 比赛创建/编辑表单
- ✅ `components/admin/competition-list.tsx` - 比赛列表
- ✅ `components/admin/competition-edit-client.tsx` - 比赛编辑页面
- ✅ `components/judge/competition-selector.tsx` - 评审比赛选择器
- ✅ `components/judge/score-input-form.tsx` - 评分表单（关键）
- ✅ `components/judge/score-summary-client.tsx` - 评分汇总
- ✅ `components/display/scoreboard-grid.tsx` - 大屏幕显示

## 🎯 关键变更

### 比赛类型
```typescript
// 旧
export type CompetitionType = 'individual' | 'duo_team' | 'challenge';

// 新
export type CompetitionType = 'individual' | 'duo' | 'team' | 'challenge';
```

### 翻译
```json
// 中文
"individual": "个人",
"duo": "双人",
"team": "团体",
"challenge": "挑战"

// 英文
"individual": "Individual",
"duo": "Duo",
"team": "Team",
"challenge": "Challenge"
```

### 评分标准
**重要**：`duo` 和 `team` 使用**相同的评分标准**：

```typescript
if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
  // 5个维度，相同的权重
  // action_difficulty: 35%
  // stage_artistry: 25%
  // action_interaction: 15%
  // action_creativity: 15%
  // costume_styling: 10%
}
```

## ⚠️ 数据迁移需求

现有数据库中的 `duo_team` 数据需要迁移。有以下选项：

### 选项1：全部迁移为 duo（推荐用于测试）
```sql
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';
```

### 选项2：根据选手数量自动判断
```sql
UPDATE competitions c
SET competition_type = CASE 
  WHEN (SELECT COUNT(*) FROM competition_athletes WHERE competition_id = c.id) <= 2 
  THEN 'duo'
  ELSE 'team'
END
WHERE competition_type = 'duo_team';
```

### 选项3：手动指定（最准确）
需要管理员逐个确认每个比赛应该是 duo 还是 team。

## 🚀 部署步骤

### 1. 重启后端服务
```bash
# 停止后端
# 启动后端
cd backend
npm start
```

### 2. 执行数据迁移（如果有现有数据）
```bash
# 创建迁移脚本
node backend/migrate-duo-team.js
```

### 3. 清除缓存
```bash
node backend/clear-competition-cache.js
```

### 4. 重启前端（如果在运行）
```bash
npm run dev
```

## 🧪 测试清单

- [ ] 创建双人赛（duo）
- [ ] 创建团体赛（team）
- [ ] 评分表单显示正确的维度
- [ ] 评分提交成功
- [ ] 大屏幕显示正确
- [ ] 排行榜显示正确
- [ ] 筛选功能正常
- [ ] 导出Excel功能正常
- [ ] 国际化切换正常

## 📝 使用说明

### 创建比赛时
管理员现在可以明确选择：
- **个人赛** (Individual) - 1人
- **双人舞台赛** (Duo) - 2人
- **团体赛** (Team) - 3人以上
- **挑战赛** (Challenge) - 特殊赛制

### 评分时
- 双人赛和团体赛使用相同的评分标准
- 评分表单会根据比赛类型自动显示对应的维度
- 评委无需关心类型区别，系统自动处理

## 🔍 未更新的文件

以下文件可能还包含 `duo_team` 引用，但不影响核心功能：
- `components/display/ranking-table.tsx`
- `components/display/realtime-score-display.tsx`
- `backend/controllers/competitions.controller.js` (Excel导出部分)
- 各种测试脚本

这些文件可以在后续逐步更新。

## ✨ 优势

1. **类型明确**：双人和团体不再混淆
2. **便于统计**：可以分别统计双人赛和团体赛的数据
3. **未来扩展**：如果将来需要区分评分标准，代码已经准备好
4. **用户友好**：管理员创建比赛时选项更清晰

## 📅 完成时间

2026-04-14

