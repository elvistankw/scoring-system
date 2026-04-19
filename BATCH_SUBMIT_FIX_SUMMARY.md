# 批量提交评分修复总结

## 问题描述

用户报告错误：
```
You have already submitted scores for: athlete 96 in competition 103, athlete 100 in competition 103, athlete 98 in competition 103
```

## 根本原因

系统的评分流程分为两个阶段：

1. **实时保存阶段**：评委在输入分数时，通过 `partialScoreUpdate` API 实时保存到数据库
2. **最终提交阶段**：评委点击"提交所有评分"按钮，通过 `batchSubmitScores` API 标记评分为已提交

问题在于 `batchSubmitScores` 原本的逻辑是：
- 检查是否已存在评分记录
- 如果存在，返回409错误（重复提交）
- 如果不存在，插入新记录

但实际上，由于 `partialScoreUpdate` 已经创建了记录，所以批量提交时总是会遇到"已存在"的情况。

## 解决方案

修改 `batchSubmitScores` 控制器，使用 **UPSERT** 逻辑：

### 修改前
```javascript
// 7. Check for duplicate scores
const duplicateCheck = await client.query(...);

if (duplicateCheck.rows.length > 0) {
  return next(new AppError('You have already submitted scores for: ...', 409));
}

// 8. Insert all scores (只能插入新记录)
```

### 修改后
```javascript
// 7. Check for existing scores and prepare for upsert
const existingScoresResult = await client.query(...);
const existingScoresMap = new Map();

// 8. Upsert all scores (insert or update existing)
for (const submission of validatedSubmissions) {
  if (existingScoreId) {
    // Update existing score and mark as submitted
    await client.query(updateQuery, updateValues);
  } else {
    // Insert new score
    await client.query(insertQuery, insertValues);
  }
}
```

## 技术细节

### 更新逻辑
当评分记录已存在时：
- 更新所有评分字段
- 更新 `submitted_at` 时间戳（标记为已提交）
- 更新 `updated_at` 时间戳

### 插入逻辑
当评分记录不存在时：
- 插入新的评分记录
- 设置 `submitted_at` 时间戳

## 工作流程

### 评委评分流程

1. **选择选手** → 显示评分表单
2. **输入分数** → 每个字段失焦时自动调用 `partialScoreUpdate`
   - 创建或更新数据库记录
   - `submitted_at` 保持为 NULL（未提交状态）
3. **切换选手** → 重复步骤1-2
4. **点击"提交所有评分"** → 调用 `batchSubmitScores`
   - 更新所有已保存的评分记录
   - 设置 `submitted_at` 为当前时间（已提交状态）
   - 触发实时更新和缓存刷新

### 数据库状态变化

```
阶段1：输入分数
scores表：
- competition_id: 103
- athlete_id: 96
- judge_id: 30
- action_difficulty: 25.5
- stage_artistry: 28.0
- submitted_at: NULL  ← 未提交

阶段2：最终提交
scores表：
- competition_id: 103
- athlete_id: 96
- judge_id: 30
- action_difficulty: 25.5
- stage_artistry: 28.0
- submitted_at: 2026-04-19 10:30:00  ← 已提交
```

## 优势

1. **用户体验**：评委可以随时保存进度，不用担心数据丢失
2. **数据完整性**：最终提交时确保所有数据都已保存
3. **灵活性**：支持修改已保存的分数后再提交
4. **状态管理**：通过 `submitted_at` 字段区分"草稿"和"已提交"状态

## 相关文件

- `backend/controllers/scores.controller.js` - 批量提交控制器
- `components/judge/scoring-client.tsx` - 评分页面客户端
- `components/judge/batch-score-input-form.tsx` - 评分表单组件
- `lib/judge-api-client.ts` - API客户端

## 测试建议

1. 测试新评分提交（无现有记录）
2. 测试修改后再提交（有现有记录）
3. 测试部分选手有记录、部分没有记录的混合情况
4. 验证 `submitted_at` 时间戳正确更新
5. 验证实时更新和缓存刷新正常工作

## 日期

2026-04-19
