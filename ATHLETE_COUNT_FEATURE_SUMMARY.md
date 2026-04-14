# 比赛列表显示选手数量功能实现总结

## 📋 功能概述

在所有比赛列表卡片中显示该比赛的参赛选手数量，帮助用户快速了解比赛规模。

## ✅ 实现内容

### 1. 后端修改

#### `backend/controllers/competitions.controller.js`
- 修改 `getAllCompetitions` 函数的SQL查询
- 使用 LEFT JOIN 和 COUNT 统计每个比赛的选手数量
- 查询语句：
```sql
SELECT c.*, 
       COALESCE((SELECT COUNT(*) FROM competition_athletes ca WHERE ca.competition_id = c.id), 0) as athlete_count
FROM competitions c 
WHERE 1=1
```

### 2. 接口定义更新

#### `interface/competition.ts`
- 在 `Competition` 接口中添加可选字段：
```typescript
athlete_count?: number; // Optional: number of athletes in this competition
```

### 3. 前端组件更新

所有显示比赛列表的组件都已更新，添加选手数量显示：

#### ✅ `components/judge/score-summary-client.tsx`
- 在比赛卡片的标签区域添加选手数量徽章
- 使用紫色主题，带人员图标

#### ✅ `components/judge/competition-selector.tsx`
- 在比赛类型标签旁边显示选手数量
- 使用紫色徽章，带人员图标

#### ✅ `components/admin/competition-list.tsx`
- 在管理员比赛列表中显示选手数量
- 与状态和类型标签并列显示

#### ✅ `app/[locale]/(display)/scoreboard/scoreboard-client.tsx`
- 在大屏幕比赛选择界面显示选手数量
- 使用紫色文字，带图标

### 4. 国际化翻译

#### `i18n/locales/zh.json`
```json
"competition": {
  "athleteCount": "参赛选手"
}
```

#### `i18n/locales/en.json`
```json
"competition": {
  "athleteCount": "Athletes"
}
```

## 🎨 UI 设计

### 选手数量徽章样式
- **颜色主题**: 紫色 (Purple)
  - Light mode: `bg-purple-100 text-purple-800`
  - Dark mode: `bg-purple-900 text-purple-200`
- **图标**: 人员群组图标 (Heroicons - Users)
- **位置**: 与比赛状态、类型标签并列显示
- **响应式**: 使用 `flex-wrap` 确保在小屏幕上正确换行

### 示例显示效果
```
[进行中] [个人赛] [👥 30]
```

## 🔧 技术细节

### 数据流
1. **数据库查询**: PostgreSQL 使用子查询统计选手数量
2. **缓存策略**: Redis 缓存包含 athlete_count 的完整数据
3. **前端展示**: 条件渲染，仅在 athlete_count 存在时显示

### 性能优化
- 使用 `COALESCE` 确保返回 0 而不是 NULL
- 子查询在数据库层面执行，性能优于多次查询
- 结果缓存在 Redis 中，减少数据库负载

## 📝 使用说明

### 清除缓存（如需要）
如果修改后数据未更新，可以清除 Redis 缓存：

```bash
# 方法1: 使用清除脚本
node backend/clear-competition-cache.js

# 方法2: 重启后端服务
# 停止后端
# 启动后端
node backend/index.js
```

### 测试验证
```bash
# 测试选手数量是否正确返回
node backend/test-athlete-count.js
```

## 🎯 显示位置

选手数量在以下页面/组件中显示：

1. ✅ **评审端 - 评分汇总页面** (`/score-summary`)
   - 比赛选择卡片

2. ✅ **评审端 - 评审仪表板** (`/judge-dashboard`)
   - 比赛选择器组件

3. ✅ **管理端 - 比赛列表** (`/admin-dashboard`)
   - 比赛管理卡片

4. ✅ **大屏幕端 - 比分显示** (`/scoreboard`)
   - 比赛选择界面

## 🔍 注意事项

1. **可选字段**: `athlete_count` 是可选字段，前端需要检查是否存在
2. **缓存更新**: 当添加/删除选手时，相关比赛的缓存会自动失效
3. **零值显示**: 即使没有选手，也会显示 "0"
4. **响应式设计**: 标签使用 `flex-wrap` 确保在小屏幕上正确显示

## ✨ 用户体验提升

- **快速了解**: 用户无需点击即可看到比赛规模
- **视觉区分**: 紫色徽章与其他标签形成视觉对比
- **信息完整**: 状态、类型、选手数量一目了然
- **国际化**: 支持中英文显示

## 🚀 后续优化建议

1. 可以添加选手数量的排序功能
2. 可以根据选手数量筛选比赛
3. 可以在选手数量旁边显示已评分/未评分的比例
4. 可以添加选手数量变化的实时更新（WebSocket）
