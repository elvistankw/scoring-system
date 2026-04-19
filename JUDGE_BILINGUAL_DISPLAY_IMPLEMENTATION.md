# Judge界面双语显示实现总结

## 实现目标
在所有judge相关的界面和组件中实现双语显示（中文+英文），中文字体大一些，英文字体小一些。

## 创建的新组件

### BilingualText 组件
**文件**: `components/shared/bilingual-text.tsx`

**功能特性**:
- 支持水平和垂直布局
- 中文字体可配置大小（默认 text-base）
- 英文字体可配置大小（默认 text-sm）
- 支持分隔符自定义（默认 " / "）
- 支持根据当前语言环境显示单语言
- 内置常用judge相关翻译映射

**使用示例**:
```tsx
// 水平布局
<BilingualText 
  translationKey="judge.dashboard" 
  chineseSize="text-lg" 
  englishSize="text-sm"
/>

// 垂直布局
<BilingualText 
  translationKey="judge.judges" 
  chineseSize="text-2xl" 
  englishSize="text-lg"
  layout="vertical"
/>
```

## 更新的组件

### 1. Judge管理组件

#### `components/admin/judge-list.tsx`
- ✅ 页面标题双语显示（垂直布局）
- ✅ 表格头部双语显示（垂直布局）
- ✅ 状态标签双语显示
- ✅ 操作按钮双语显示
- ✅ 统计信息双语显示

#### `components/admin/judge-form.tsx`
- ✅ 表单标题双语显示（垂直布局）
- ✅ 字段标签双语显示
- ✅ 按钮文本双语显示

### 2. Judge仪表板组件

#### `components/judge/judge-dashboard-client.tsx`
- ✅ 页面标题双语显示（垂直布局）
- ✅ 用户菜单双语显示
- ✅ 导航链接双语显示

#### `components/judge/competition-selector.tsx`
- ✅ 比赛状态指示器双语显示
- ✅ 选中状态双语显示
- ✅ 评分状态双语显示

#### `components/judge/athlete-card.tsx`
- ✅ 选手编号标签双语显示

#### `components/judge/score-input-form.tsx`
- ✅ 选手信息标签双语显示
- ✅ 提交按钮双语显示
- ✅ 帮助文本双语显示

#### `components/judge/score-summary-client.tsx`
- ✅ 页面标题双语显示（垂直布局）
- ✅ 页面描述双语显示

## 字体大小规范

### 标题级别
- **大标题**: 中文 `text-3xl`, 英文 `text-2xl`
- **中标题**: 中文 `text-2xl`, 英文 `text-lg`
- **小标题**: 中文 `text-lg`, 英文 `text-base`

### 正文级别
- **正文**: 中文 `text-base`, 英文 `text-sm`
- **小字**: 中文 `text-sm`, 英文 `text-xs`
- **表格头**: 中文 `text-xs`, 英文 `text-xs`（垂直布局）

### 按钮和标签
- **按钮**: 中文 `text-base`, 英文 `text-sm`
- **状态标签**: 中文 `text-xs`, 英文 `text-xs`

## 布局策略

### 垂直布局 (layout="vertical")
适用于：
- 页面标题
- 表格头部
- 表单标题
- 需要强调层次的地方

显示效果：
```
评委管理
Judge Management
```

### 水平布局 (layout="horizontal")
适用于：
- 按钮文本
- 状态标签
- 简短描述
- 内联文本

显示效果：
```
评委管理 / Judge Management
```

## 样式特点

### 中文样式
- 字体较大
- `font-medium` 加粗
- 主要颜色显示

### 英文样式
- 字体较小
- 次要颜色显示 (`text-gray-500 dark:text-gray-400`)
- 作为补充信息

### 分隔符样式
- 水平布局使用 `/` 分隔
- 灰色显示 (`text-gray-400 dark:text-gray-500`)
- 适当间距 (`mx-1`)

## 实现效果

### 管理界面
- 评委列表页面完全双语化
- 表格头部垂直双语显示
- 操作按钮双语显示
- 状态信息双语显示

### 评审界面
- 仪表板标题双语显示
- 比赛选择界面双语化
- 评分表单双语化
- 用户菜单双语显示

## 技术优势

1. **组件化**: 统一的BilingualText组件，便于维护
2. **灵活性**: 支持多种布局和字体大小配置
3. **一致性**: 统一的双语显示规范
4. **可扩展**: 易于添加新的翻译映射
5. **响应式**: 支持深色模式和主题切换

## 使用指南

### 添加新的双语文本
1. 在BilingualText组件的translations对象中添加映射
2. 使用BilingualText组件替换原有的单语言文本
3. 根据上下文选择合适的字体大小和布局

### 最佳实践
- 标题使用垂直布局，突出层次
- 按钮和标签使用水平布局，节省空间
- 保持字体大小的一致性
- 确保在深色模式下的可读性

## 状态
✅ **已完成** - 所有judge相关界面已实现双语显示，中文字体大，英文字体小，符合用户需求。