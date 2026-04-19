# 选手选择和排序双语显示更新

## 更新内容

### 1. 评分页面 (scoring-client.tsx)

#### 选择选手标题
- **原文**: "选择选手"
- **新格式**: 
  ```
  选择选手
  Select Athlete
  ```
- **字体大小**: 中文 `text-xl`, 英文 `text-lg`
- **布局**: 垂直布局

#### 选手数量统计
- **原文**: "2 选手"
- **新格式**: "2 选手 / Athletes"
- **字体大小**: 中文 `text-sm`, 英文 `text-xs`

#### 排序方式标签
- **原文**: "排序方式:"
- **新格式**: "排序方式 / Sort By:"
- **字体大小**: 中文 `text-sm`, 英文 `text-xs`

#### 排序按钮
1. **按编号按钮**
   - **原文**: "按编号"
   - **新格式**: "按编号 / By Number"
   - **字体大小**: 中文 `text-sm`, 英文 `text-xs`

2. **按姓名按钮**
   - **原文**: "按姓名"
   - **新格式**: "按姓名 / By Name"
   - **字体大小**: 中文 `text-sm`, 英文 `text-xs`

3. **按团队按钮** (仅在双人/团体赛时显示)
   - **原文**: "按团队"
   - **新格式**: "按团队 / By Team"
   - **字体大小**: 中文 `text-sm`, 英文 `text-xs`

### 2. 评分汇总页面 (score-summary-client.tsx)

#### 选择选手标题
- **原文**: "选择选手"
- **新格式**: 
  ```
  选择选手
  Select Athlete
  ```
- **字体大小**: 中文 `text-xl`, 英文 `text-lg`
- **布局**: 垂直布局

#### 选手数量统计
- **原文**: "2 位选手"
- **新格式**: "2 位选手 / Athletes"
- **字体大小**: 中文 `text-sm`, 英文 `text-xs`

#### 提示信息
1. **请选择选手**
   - **原文**: "请选择选手"
   - **新格式**: 
     ```
     请选择选手
     Please select an athlete
     ```
   - **字体大小**: 中文 `text-lg`, 英文 `text-base`
   - **布局**: 垂直布局

2. **选择提示**
   - **原文**: "从左侧列表中选择要查看评分的选手"
   - **新格式**: "从左侧列表中选择要查看评分的选手 / Select an athlete from the left list to view their scores"
   - **字体大小**: 中文 `text-sm`, 英文 `text-xs`

## 技术实现

### 1. 添加了新的翻译映射
在 `components/shared/bilingual-text.tsx` 中添加：
```typescript
'athlete.athletes': { zh: '选手', en: 'Athletes' },
'judge.sortBy': { zh: '排序方式', en: 'Sort By' },
'judge.sortByNumber': { zh: '按编号', en: 'By Number' },
'judge.sortByName': { zh: '按姓名', en: 'By Name' },
'judge.sortByTeam': { zh: '按团队', en: 'By Team' },
```

### 2. 更新了组件导入
在两个组件中都添加了 BilingualText 的导入：
```typescript
import { BilingualText } from '@/components/shared/bilingual-text';
```

### 3. 实现了双语显示
- 所有相关文本都使用 BilingualText 组件
- 保持了原有的功能和样式
- 排序按钮的箭头指示器保持不变

## 显示效果

### 评分页面
```
选择选手                    2 选手
Select Athlete              Athletes

排序方式 / Sort By: [按编号↑] [按姓名] [按团队]
                   By Number  By Name  By Team
```

### 评分汇总页面
```
选择选手                    2 位选手
Select Athlete              Athletes

请选择选手
Please select an athlete

从左侧列表中选择要查看评分的选手 / Select an athlete from the left list to view their scores
```

## 字体大小规范
- **标题**: 中文 `text-xl`, 英文 `text-lg` (垂直布局)
- **统计信息**: 中文 `text-sm`, 英文 `text-xs`
- **排序标签**: 中文 `text-sm`, 英文 `text-xs`
- **按钮文本**: 中文 `text-sm`, 英文 `text-xs`
- **提示信息**: 中文 `text-lg/text-sm`, 英文 `text-base/text-xs`

## 文件修改
1. `app/[locale]/(judge)/scoring/scoring-client.tsx` - 评分页面双语化
2. `components/judge/score-summary-client.tsx` - 评分汇总页面双语化
3. `components/shared/bilingual-text.tsx` - 添加相关翻译映射

## 状态
✅ **已完成** - 所有选手选择和排序相关的文本都已实现双语显示，中文字体大，英文字体小。