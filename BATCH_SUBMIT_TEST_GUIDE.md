# 批量提交评分测试指南

## 修改已应用

✅ 后端服务器已重启，修改已生效
✅ 批量提交现在支持 UPSERT 逻辑（更新已存在的记录）

## 测试步骤

### 1. 清除浏览器缓存
刷新前端页面以确保使用最新的代码：
- 按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
- 或者清除浏览器缓存后刷新

### 2. 测试场景

#### 场景 A：首次提交（无现有记录）
1. 选择一个新的比赛
2. 为所有选手输入评分
3. 点击"提交所有评分"按钮
4. **预期结果**：成功提交，无错误

#### 场景 B：修改后再提交（有现有记录）
1. 选择已经评过分的比赛
2. 修改某些选手的分数
3. 点击"提交所有评分"按钮
4. **预期结果**：成功更新并提交，无"已提交"错误

#### 场景 C：部分选手有记录
1. 选择一个比赛
2. 为部分选手输入评分（自动保存）
3. 刷新页面
4. 为剩余选手输入评分
5. 点击"提交所有评分"按钮
6. **预期结果**：成功提交所有选手的评分

## 验证要点

### 前端验证
- ✅ 提交成功后显示成功消息
- ✅ 自动跳转回评审控制台
- ✅ localStorage 缓存被清除

### 后端验证
查看后端日志，应该看到：
```
📊 Found X existing score records
🔄 Updating existing score for athlete Y in competition Z
```

### 数据库验证
检查 `scores` 表：
```sql
SELECT 
  id,
  competition_id,
  athlete_id,
  judge_id,
  submitted_at,
  updated_at
FROM scores
WHERE competition_id = 103 AND judge_id = 30
ORDER BY athlete_id;
```

应该看到：
- `submitted_at` 字段有值（不是 NULL）
- `updated_at` 字段已更新

## 常见问题

### Q: 仍然看到"已提交"错误？
**A**: 确保：
1. 后端服务器已重启（检查进程ID是否改变）
2. 前端页面已刷新（清除缓存）
3. 检查后端日志确认新代码已加载

### Q: 如何确认后端代码已更新？
**A**: 查看后端日志，应该看到新的日志消息：
- `📊 Found X existing score records`
- `🔄 Updating existing score for athlete...`

### Q: 提交后分数没有更新？
**A**: 检查：
1. 后端日志是否有错误
2. 数据库连接是否正常
3. Redis 缓存是否正常刷新

## 技术细节

### 修改的文件
- `backend/controllers/scores.controller.js` - batchSubmitScores 方法

### 关键改动
```javascript
// 旧代码：检查重复并报错
if (duplicateCheck.rows.length > 0) {
  return next(new AppError('You have already submitted scores...', 409));
}

// 新代码：UPSERT 逻辑
if (existingScoreId) {
  // 更新现有记录
  UPDATE scores SET ... submitted_at = NOW() ...
} else {
  // 插入新记录
  INSERT INTO scores ...
}
```

### 数据流程
1. **输入阶段**：`partialScoreUpdate` → 创建/更新记录（`submitted_at` = NULL）
2. **提交阶段**：`batchSubmitScores` → 更新记录（`submitted_at` = NOW()）

## 日期
2026-04-19

## 状态
✅ 修改已应用
✅ 后端已重启
⏳ 等待用户测试确认
