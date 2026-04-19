# 批量评分系统测试指南 / Batch Scoring System Test Guide

## 🚀 快速开始 / Quick Start

### 1. 启动系统 / Start System

```bash
# 启动后端 / Start Backend
cd backend
npm start

# 启动前端 / Start Frontend (新终端)
npm run dev
```

### 2. 创建测试数据 / Create Test Data

确保你有以下测试数据：
- ✅ 至少一个评委账户 (Judge account)
- ✅ 至少一个活跃的比赛 (Active competition)
- ✅ 比赛中至少有 3-5 个选手 (3-5 athletes in competition)

Make sure you have:
- ✅ At least one judge account
- ✅ At least one active competition
- ✅ 3-5 athletes in the competition

## 📋 功能测试清单 / Feature Test Checklist

### A. 评分界面测试 / Scoring Interface Tests

#### A1. 页面加载 / Page Loading
- [ ] 访问 `/zh/scoring` 或 `/en/scoring`
- [ ] 检查是否正确重定向到评委仪表板（如果未选择比赛）
- [ ] 从评委仪表板选择比赛后，检查评分页面是否正确加载

#### A2. 进度追踪 / Progress Tracking
- [ ] 检查进度条是否显示 "0/X" (X = 选手总数)
- [ ] 检查进度百分比是否为 0%
- [ ] 检查状态文字是否显示 "还需评分 X 位选手"

#### A3. 选手列表 / Athlete List
- [ ] 检查所有选手是否正确显示
- [ ] 检查排序功能：按编号、按姓名、按团队（如适用）
- [ ] 检查选手卡片是否可以点击选择

### B. 评分功能测试 / Scoring Function Tests

#### B1. 单个选手评分 / Individual Athlete Scoring
- [ ] 选择第一个选手
- [ ] 检查评分表单是否正确显示（根据比赛类型）
- [ ] 输入所有评分维度的分数
- [ ] 检查自动保存功能（输入后 500ms）
- [ ] 检查选手卡片是否显示绿色勾选标记 ✅
- [ ] 检查进度条是否更新为 "1/X"

#### B2. 多个选手评分 / Multiple Athletes Scoring
- [ ] 为所有选手完成评分
- [ ] 检查进度条是否达到 100%
- [ ] 检查状态文字是否变为 "所有选手已评分，可以提交"
- [ ] 检查提交按钮是否变为可用状态（绿色）

#### B3. 评分修改 / Score Modification
- [ ] 重新选择已评分的选手
- [ ] 修改某些评分
- [ ] 检查修改是否正确保存
- [ ] 检查选手仍然显示为已完成状态

#### B4. 评分清除 / Score Clearing
- [ ] 选择已评分的选手
- [ ] 点击"清除"按钮
- [ ] 检查评分是否被清除
- [ ] 检查选手状态是否变为未完成
- [ ] 检查进度条是否正确更新

### C. 缓存功能测试 / Caching Function Tests

#### C1. 页面刷新测试 / Page Refresh Test
- [ ] 为几个选手评分（不要全部完成）
- [ ] 刷新浏览器页面 (F5)
- [ ] 检查是否显示 "已恢复缓存的评分数据" 提示
- [ ] 检查所有已评分的选手是否正确恢复
- [ ] 检查进度条是否正确显示

#### C2. 浏览器关闭重开测试 / Browser Close/Reopen Test
- [ ] 为几个选手评分
- [ ] 完全关闭浏览器
- [ ] 重新打开浏览器并访问评分页面
- [ ] 检查缓存数据是否正确恢复

#### C3. 不同比赛缓存隔离测试 / Different Competition Cache Isolation
- [ ] 在比赛A中评分几个选手
- [ ] 切换到比赛B
- [ ] 检查比赛B的评分是否为空（不受比赛A影响）
- [ ] 切换回比赛A
- [ ] 检查比赛A的评分是否仍然存在

### D. 提交确认测试 / Submission Confirmation Tests

#### D1. 未完成提交测试 / Incomplete Submission Test
- [ ] 只为部分选手评分（不是全部）
- [ ] 点击"提交所有评分"按钮
- [ ] 检查是否显示错误提示："请为所有选手打分"
- [ ] 检查确认弹窗是否没有出现

#### D2. 完成提交测试 / Complete Submission Test
- [ ] 为所有选手完成评分
- [ ] 点击"提交所有评分"按钮
- [ ] 检查确认弹窗是否正确显示
- [ ] 检查弹窗标题："确认提交评分"
- [ ] 检查提交摘要是否正确显示选手数量
- [ ] 检查选手列表是否正确显示所有选手和总分
- [ ] 检查警告提示是否显示

#### D3. 取消提交测试 / Cancel Submission Test
- [ ] 在确认弹窗中点击"取消"按钮
- [ ] 检查弹窗是否关闭
- [ ] 检查评分数据是否仍然保留
- [ ] 检查可以继续修改评分

#### D4. 确认提交测试 / Confirm Submission Test
- [ ] 在确认弹窗中点击"确认提交"按钮
- [ ] 检查是否显示提交中状态
- [ ] 检查是否显示成功提示："成功提交 X 个选手的评分"
- [ ] 检查是否自动跳转回评委仪表板
- [ ] 检查缓存是否被清除

### E. 离开页面测试 / Leave Page Tests

#### E1. 有未提交评分时离开 / Leave with Unsubmitted Scores
- [ ] 为几个选手评分（不提交）
- [ ] 点击"返回"按钮
- [ ] 检查是否显示确认对话框
- [ ] 检查对话框内容是否提到评分已缓存
- [ ] 点击"取消"，检查是否留在当前页面
- [ ] 点击"确定"，检查是否返回仪表板

#### E2. 无评分时离开 / Leave without Scores
- [ ] 不进行任何评分
- [ ] 点击"返回"按钮
- [ ] 检查是否直接返回仪表板（无确认对话框）

### F. 后端API测试 / Backend API Tests

#### F1. 批量提交API测试 / Batch Submit API Test
```bash
# 运行测试脚本
cd backend
node test-batch-submission.js
```

- [ ] 检查API是否正确接收批量提交请求
- [ ] 检查数据库中是否正确插入所有评分记录
- [ ] 检查Redis缓存是否正确更新
- [ ] 检查WebSocket是否正确广播更新

#### F2. 数据验证测试 / Data Validation Tests
使用API测试工具（如Postman）测试：

**无效数据测试：**
- [ ] 提交空的submissions数组
- [ ] 提交缺少必填字段的数据
- [ ] 提交超出范围的评分
- [ ] 提交不存在的比赛ID或选手ID

**重复提交测试：**
- [ ] 提交相同选手的评分两次
- [ ] 检查是否返回409错误

**权限测试：**
- [ ] 使用非评委账户尝试提交
- [ ] 使用无效token尝试提交

## 🐛 常见问题排查 / Troubleshooting

### 问题1：页面白屏或加载失败
**解决方案：**
1. 检查控制台错误信息
2. 确认后端服务器正在运行
3. 检查API_BASE_URL配置

### 问题2：缓存数据丢失
**解决方案：**
1. 检查浏览器localStorage是否被清除
2. 确认缓存键格式：`scores_{competition_id}_{judge_id}`
3. 检查用户ID和比赛ID是否正确

### 问题3：提交失败
**解决方案：**
1. 检查网络连接
2. 查看后端日志错误信息
3. 确认所有评分数据格式正确
4. 检查用户权限

### 问题4：进度条不更新
**解决方案：**
1. 检查React状态更新逻辑
2. 确认athleteScores Map正确更新
3. 检查completionStats计算逻辑

## 📊 性能测试 / Performance Tests

### P1. 大量选手测试 / Large Number of Athletes
- [ ] 测试50个选手的比赛
- [ ] 检查页面加载速度
- [ ] 检查评分保存速度
- [ ] 检查提交处理时间

### P2. 网络延迟测试 / Network Latency Test
- [ ] 在慢网络环境下测试
- [ ] 检查自动保存是否正常工作
- [ ] 检查提交超时处理

### P3. 并发测试 / Concurrency Test
- [ ] 多个评委同时评分
- [ ] 检查数据一致性
- [ ] 检查缓存冲突处理

## ✅ 测试完成标准 / Test Completion Criteria

所有测试项目必须通过才能认为功能完整：

**必须通过的核心功能：**
- ✅ 批量评分模式正常工作
- ✅ 进度追踪准确显示
- ✅ 本地缓存防止数据丢失
- ✅ 确认弹窗正确显示和操作
- ✅ 批量提交API正常工作
- ✅ 数据验证和错误处理正确

**性能要求：**
- ✅ 页面加载时间 < 3秒
- ✅ 评分保存响应时间 < 500ms
- ✅ 批量提交处理时间 < 5秒（50个选手）

**用户体验要求：**
- ✅ 界面响应流畅，无卡顿
- ✅ 错误提示清晰易懂
- ✅ 操作流程直观简单

---

**测试完成后，请更新 SCORING_REDESIGN_SUMMARY.md 文件，记录测试结果和发现的问题。**

**After testing, please update SCORING_REDESIGN_SUMMARY.md with test results and any issues found.**