# 比赛状态评分限制实现总结

## 🎯 业务需求

确保只有状态为 **"active"** 的比赛才能进行评分，状态为 **"upcoming"** 或 **"completed"** 的比赛不能评分。

## ✅ 实现的功能

### 1. 前端限制

#### 📱 Judge Dashboard (评审控制台)
- 显示所有 `active` 和 `upcoming` 状态的比赛
- 评审可以看到即将开始的比赛，但不能对其评分

#### 🎯 Competition Selector (比赛选择器)
- **视觉区分**: 非 active 比赛显示为灰色且透明度降低
- **交互限制**: 非 active 比赛按钮被禁用 (`disabled={competition.status !== 'active'}`)
- **状态指示器**: 
  - ✅ "可评分" (绿色) - active 比赛
  - ❌ "不可评分" (灰色) - upcoming/completed 比赛

#### 📝 Scoring Page (评分页面)
- **状态检查**: 在评分表单区域检查比赛状态
- **警告提示**: 非 active 比赛显示黄色警告框
- **阻止评分**: 不显示评分表单，只显示状态说明

### 2. 用户体验优化

#### 🎨 视觉提示
```jsx
// 比赛卡片样式
className={`
  ${competition.status === 'active' 
    ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
    : 'cursor-not-allowed opacity-60'
  }
`}
```

#### 📢 多语言提示信息
- **中文**: "此比赛尚未开始，无法进行评分"
- **英文**: "This competition has not started yet and cannot be scored"

#### 🚫 禁用状态
- 非 active 比赛按钮不可点击
- 鼠标悬停显示 "not-allowed" 光标
- 降低透明度 (opacity-60)

### 3. 状态判断逻辑

#### 📅 自动状态设置
```javascript
// 创建/更新比赛时的自动状态判断
if (!status && start_date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(start_date);
  startDate.setHours(0, 0, 0, 0);
  
  if (startDate.getTime() <= today.getTime()) {
    finalStatus = 'active'; // 今天或过去 → active
  } else {
    finalStatus = 'upcoming'; // 未来 → upcoming
  }
}
```

#### 🔒 评分权限检查
```jsx
// 评分页面状态检查
{selectedCompetition.status !== 'active' ? (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
    <h3>{t('judge.competitionNotActive')}</h3>
    <p>{t('judge.onlyActiveCompetitionsCanBeScored')}</p>
  </div>
) : (
  <ScoreInputForm /> // 只有 active 状态才显示评分表单
)}
```

## 📊 当前数据状态

根据测试结果，华东赛区有 5 个比赛：

| ID | 比赛名称 | 类型 | 状态 | 可评分 |
|----|----------|------|------|--------|
| 42 | 2025 比赛 | duo_team | upcoming | ❌ |
| 43 | 2025比赛 | challenge | upcoming | ❌ |
| 44 | 2025 华东赛区双人/团队赛 | duo_team | active | ✅ |
| 45 | 2025 华东赛区挑战赛 | challenge | active | ✅ |
| 46 | 2025 比赛 | individual | upcoming | ❌ |

**统计**: 2 个可评分，3 个不可评分

## 🔧 技术实现

### 文件修改列表

1. **`app/[locale]/(judge)/scoring/scoring-client.tsx`**
   - 添加比赛状态检查
   - 显示状态警告信息
   - 阻止非 active 比赛评分

2. **`components/judge/competition-selector.tsx`**
   - 添加按钮禁用逻辑
   - 添加视觉状态指示器
   - 优化样式和交互

3. **`i18n/locales/zh.json` & `i18n/locales/en.json`**
   - 添加状态相关翻译文本
   - 支持中英文切换

4. **`backend/controllers/competitions.controller.js`**
   - 优化日期比较逻辑
   - 确保基于日期而非时间的状态判断

### 新增翻译键

```json
{
  "judge": {
    "competitionNotActive": "比赛未激活",
    "competitionUpcoming": "此比赛尚未开始，无法进行评分。",
    "competitionCompleted": "此比赛已结束，无法进行评分。",
    "onlyActiveCompetitionsCanBeScored": "只有状态为"进行中"的比赛才能进行评分。",
    "canScore": "可评分",
    "cannotScore": "不可评分"
  }
}
```

## 🎯 用户流程

1. **评审登录** → Judge Dashboard
2. **查看比赛列表** → 看到所有 active 和 upcoming 比赛
3. **选择比赛** → 只能选择 active 比赛 (upcoming 被禁用)
4. **进入评分页面** → 如果误选了 upcoming 比赛，显示警告
5. **开始评分** → 只有 active 比赛才显示评分表单

## ✨ 优势

- **用户友好**: 清晰的视觉提示和状态说明
- **防误操作**: 技术层面阻止对非 active 比赛评分
- **多语言支持**: 中英文界面完整支持
- **响应式设计**: 适配平板和桌面设备
- **一致性**: 前后端状态判断逻辑统一

## 🧪 测试验证

使用 `backend/test-competition-status-restriction.js` 可以验证：
- 数据库中的比赛状态
- 评分权限规则
- 前端实现逻辑

---

**实现完成时间**: 2026-04-13  
**实现者**: Kiro AI Assistant  
**状态**: ✅ 完成并测试通过