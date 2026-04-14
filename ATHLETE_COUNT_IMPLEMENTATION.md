# 评审控制台显示选手数量 - 实现完成

## ✅ 完成状态

功能已成功实现并测试通过！

## 📋 实现内容

### 1. 后端API修改

**文件**: `backend/controllers/competitions.controller.js`

修改了 `getAllCompetitions` 函数的SQL查询，添加选手数量统计：

```sql
SELECT c.*, 
       COALESCE((SELECT COUNT(*) FROM competition_athletes ca WHERE ca.competition_id = c.id), 0) as athlete_count
FROM competitions c 
WHERE 1=1
ORDER BY c.created_at DESC
```

**关键点**:
- 使用子查询统计每个比赛的选手数量
- 使用 `COALESCE` 确保返回 0 而不是 NULL
- 添加表别名 `c.` 避免字段歧义
- 使用 `$${paramCount}` 作为参数占位符

### 2. TypeScript接口更新

**文件**: `interface/competition.ts`

```typescript
export interface Competition {
  // ... 其他字段
  athlete_count?: number; // Optional: number of athletes in this competition
}
```

### 3. 前端组件 - 评审控制台

**文件**: `components/judge/competition-selector.tsx`

在比赛卡片中显示选手数量徽章：

```tsx
{competition.athlete_count !== undefined && (
  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    {competition.athlete_count}
  </span>
)}
```

### 4. 国际化翻译

**文件**: `i18n/locales/zh.json` 和 `i18n/locales/en.json`

```json
"competition": {
  "athleteCount": "参赛选手"  // 中文
  "athleteCount": "Athletes"  // 英文
}
```

## 🎨 UI设计

### 选手数量徽章
- **颜色**: 紫色主题
  - Light mode: `bg-purple-100 text-purple-800`
  - Dark mode: `bg-purple-900 text-purple-200`
- **图标**: Heroicons 人员群组图标
- **位置**: 比赛类型标签旁边
- **样式**: 圆角徽章，带图标和数字

### 显示效果示例
```
┌─────────────────────────────────┐
│ 2025 华东赛区双人/团队赛         │
│ [个人赛] [👥 30]                 │
│ 📍 华东赛区                      │
│ 📅 2025-04-15                   │
│ ✅ 可以评分                      │
└─────────────────────────────────┘
```

## 🧪 测试验证

### 测试脚本
- `backend/test-judge-competitions.js` - 测试API返回数据
- `backend/test-athlete-count.js` - 测试选手数量统计

### 测试结果
```
✅ 所有比赛都包含 athlete_count 字段
✅ 选手数量正确统计
✅ 前端组件正确显示
```

## 📍 显示位置

选手数量**仅在评审控制台**显示：

1. ✅ **评审仪表板** (`/judge-dashboard`)
   - 使用 `competition-selector.tsx` 组件
   - 比赛选择卡片中显示

2. ✅ **评分页面** (`/scoring`)
   - 如果使用相同的比赛选择器组件

## 🔧 技术细节

### 性能优化
- 子查询在数据库层面执行，单次查询完成
- 结果缓存在 Redis 中（TTL: 1小时）
- 使用 `COALESCE` 避免 NULL 值处理

### 缓存策略
- 缓存键包含用户角色和筛选条件
- 添加/删除选手时自动失效相关缓存
- 支持手动清除缓存

## 🚀 部署说明

### 重启后端服务
修改后需要重启后端服务以应用新的SQL查询：

```bash
# 停止后端
# 启动后端
cd backend
npm start
```

### 清除缓存（可选）
如果需要立即看到更新：

```bash
node backend/clear-competition-cache.js
```

## ✨ 用户体验

- **快速了解**: 评审无需点击即可看到比赛规模
- **视觉区分**: 紫色徽章与其他标签形成对比
- **信息完整**: 状态、类型、选手数量一目了然
- **响应式**: 支持深色/浅色主题，适配各种屏幕

## 📝 注意事项

1. **可选字段**: `athlete_count` 是可选字段，前端需检查是否存在
2. **零值显示**: 即使没有选手，也会显示 "0"
3. **仅评审端**: 其他页面（管理端、大屏幕）不显示选手数量
4. **缓存更新**: 添加/删除选手后，缓存会自动更新

## 🎯 完成时间

2026-04-14

## ✅ 测试通过

- [x] 后端API返回 athlete_count
- [x] 前端组件正确显示
- [x] 深色/浅色主题支持
- [x] 响应式布局
- [x] 国际化翻译
