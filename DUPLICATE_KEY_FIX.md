# React Key 重复问题修复

## 错误信息
```
Encountered two children with the same key, `77`. Keys should be unique so that 
components maintain their identity across updates. Non-unique keys may cause 
children to be duplicated and/or omitted — the behavior is unsupported and could 
change in a future version.
```

## 问题原因

### 根本原因
评分列表使用 `score.id` 作为 React key，但数据库中存在重复的 `score.id`。这可能是因为：

1. **数据库设计问题**: `scores` 表的主键可能不是自增的，或者有重复数据
2. **查询问题**: SQL 查询可能返回了重复的记录
3. **业务逻辑**: 同一个评委可能对同一个选手有多次评分记录

### 问题代码
```typescript
{scores.map((score, index) => (
  <GlassCard key={score.id} hoverEffect="none">
    {/* ❌ 如果 score.id 重复，React 会报错 */}
  </GlassCard>
))}
```

## 修复方案

### 使用组合键确保唯一性
**文件**: `components/judge/score-summary-client.tsx`

```typescript
{scores.map((score, index) => (
  <GlassCard key={`${score.id}-${score.judge_id || index}-${index}`} hoverEffect="none">
    {/* ✅ 组合键：score.id + judge_id + index */}
  </GlassCard>
))}
```

### 组合键的组成
```typescript
`${score.id}-${score.judge_id || index}-${index}`
```

**包含三个部分:**
1. `score.id` - 评分记录ID
2. `score.judge_id || index` - 评委ID（如果不存在则使用索引）
3. `index` - 数组索引（最后的保障）

这样即使 `score.id` 重复，组合键也能保证唯一性。

## 为什么会有重复的 score.id？

### 可能的原因

**1. 数据库查询返回重复记录**
```sql
-- 如果 JOIN 不正确，可能返回重复记录
SELECT s.*, ...
FROM scores s
LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
-- 如果一个 judge_id 有多个 session，会返回多条记录
```

**2. 同一评委多次评分**
```
比赛规则允许评委修改评分，导致：
- 同一个 judge_id
- 同一个 athlete_id  
- 同一个 competition_id
- 但有多条 score 记录
```

**3. 数据迁移或导入问题**
```
可能在数据迁移时产生了重复的评分记录
```

## 长期解决方案

### 1. 检查数据库中的重复记录
```sql
-- 查找重复的评分记录
SELECT 
  competition_id,
  athlete_id,
  judge_id,
  COUNT(*) as count
FROM scores
GROUP BY competition_id, athlete_id, judge_id
HAVING COUNT(*) > 1;
```

### 2. 修复后端查询
**文件**: `backend/controllers/scores.controller.js`

确保查询使用 `DISTINCT` 或正确的 JOIN：

```javascript
const query = `
  SELECT DISTINCT ON (s.id)
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
  WHERE s.athlete_id = $1 AND s.competition_id = $2
  ORDER BY s.id, s.submitted_at DESC
`;
```

### 3. 添加数据库约束
```sql
-- 确保每个评委对每个选手在每个比赛中只有一条评分记录
ALTER TABLE scores
ADD CONSTRAINT unique_score_per_judge_athlete_competition
UNIQUE (competition_id, athlete_id, judge_id);
```

### 4. 业务逻辑处理
如果允许评委修改评分，应该：
- **更新现有记录**而不是插入新记录
- 或者只显示**最新的评分记录**

```javascript
// 前端去重逻辑（临时方案）
const uniqueScores = scores.reduce((acc, score) => {
  const key = `${score.competition_id}-${score.athlete_id}-${score.judge_id}`;
  if (!acc[key] || new Date(score.submitted_at) > new Date(acc[key].submitted_at)) {
    acc[key] = score;
  }
  return acc;
}, {});

const deduplicatedScores = Object.values(uniqueScores);
```

## React Key 最佳实践

### 1. 使用稳定且唯一的标识符
```typescript
// ✅ 好 - 使用数据库主键
<div key={item.id}>

// ✅ 好 - 使用组合键
<div key={`${item.id}-${item.type}`}>

// ❌ 不好 - 使用数组索引（除非列表永不改变）
<div key={index}>

// ❌ 不好 - 使用随机值
<div key={Math.random()}>
```

### 2. 确保 key 在兄弟元素中唯一
```typescript
// ✅ 好 - key 在同一层级中唯一
{items.map(item => (
  <div key={item.id}>
    {/* 子元素可以有相同的 key，因为它们在不同的层级 */}
    <span key="name">{item.name}</span>
    <span key="value">{item.value}</span>
  </div>
))}
```

### 3. 避免使用不稳定的值
```typescript
// ❌ 不好 - 每次渲染都会变化
<div key={new Date().getTime()}>

// ❌ 不好 - 对象引用每次都不同
<div key={JSON.stringify(item)}>

// ✅ 好 - 使用稳定的属性
<div key={item.id}>
```

## 测试验证

### 验证步骤
1. 打开浏览器开发者工具 Console
2. 访问评分汇总页面
3. 选择一个选手查看评分

### 预期结果
✅ **修复前:**
- Console 显示 "Encountered two children with the same key" 警告
- 可能有评分记录显示不正确或重复

✅ **修复后:**
- Console 没有 key 相关的警告
- 所有评分记录正常显示
- 每条记录都有唯一的 key

## 相关文件
- `components/judge/score-summary-client.tsx` - 修复 React key
- `backend/controllers/scores.controller.js` - 后端查询逻辑
- `backend/migrations/001_initial_schema.sql` - 数据库表结构

## 日期
2026-04-19
