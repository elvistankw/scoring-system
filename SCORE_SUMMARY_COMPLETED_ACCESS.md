# 评分汇总页面访问已完成比赛功能

## 功能描述
允许评审在评分汇总页面查看已完成比赛的评分记录，同时保持评审仪表板只显示活跃和即将开始的比赛。

## 业务需求
- **评审仪表板**：只显示可以评分的比赛（活跃 + 即将开始）
- **评分汇总页面**：显示所有比赛，包括已完成的比赛，用于查看历史评分记录

## 实现方案

### 1. 后端API增强 ✅

#### 新增查询参数
在比赛控制器中添加 `include_completed_for_summary` 参数：

```javascript
const { status, region, type, include_completed_for_summary } = req.query;

// 角色过滤逻辑更新
if (userRole === 'judge' && include_completed_for_summary !== 'true') {
  query += ` AND status IN ('active', 'upcoming')`;
}
```

#### 缓存键优化
更新缓存键以包含新参数：

```javascript
const filterKey = `${status || 'all'}:${region || 'all'}:${type || 'all'}:${userRole || 'guest'}:${include_completed_for_summary || 'false'}`;
```

#### 特殊处理逻辑
```javascript
// 当评审请求已完成比赛时的特殊处理
if (userRole === 'judge' && status === 'completed' && include_completed_for_summary !== 'true') {
  return res.status(200).json({
    status: 'success',
    cached: false,
    data: { competitions: [] }
  });
}
```

### 2. 前端Hook扩展 ✅

#### useCompetitions Hook更新
添加新的可选参数：

```typescript
export function useCompetitions(filters?: {
  status?: CompetitionStatus;
  region?: string;
  type?: CompetitionType;
  includeCompletedForSummary?: boolean; // 新增参数
})
```

#### 查询参数构建
```typescript
if (filters?.includeCompletedForSummary) {
  params.append('include_completed_for_summary', 'true');
}
```

### 3. 评分汇总页面修改 ✅

#### 组件更新
在 `ScoreSummaryClient` 组件中使用新参数：

```typescript
const { competitions, isLoading: competitionsLoading } = useCompetitions({
  includeCompletedForSummary: true // 启用已完成比赛访问
});
```

## 权限控制矩阵

### 评审用户访问权限

| 页面/功能 | 活跃比赛 | 即将开始 | 已完成比赛 | 说明 |
|-----------|----------|----------|------------|------|
| 评审仪表板 | ✅ | ✅ | ❌ | 只显示可评分的比赛 |
| 比赛选择器 | ✅ | ✅ | ❌ | 防止选择已结束比赛 |
| 评分汇总页面 | ✅ | ✅ | ✅ | 可查看历史评分记录 |
| 评分页面 | ✅ | ❌ | ❌ | 只能对活跃比赛评分 |

### 管理员用户访问权限

| 页面/功能 | 活跃比赛 | 即将开始 | 已完成比赛 | 说明 |
|-----------|----------|----------|------------|------|
| 管理员仪表板 | ✅ | ✅ | ✅ | 完全访问权限 |
| 比赛管理 | ✅ | ✅ | ✅ | 可管理所有状态比赛 |

## 技术实现细节

### 1. API端点行为

#### 常规请求（评审仪表板）
```
GET /api/competitions
角色：judge
结果：返回 active + upcoming 比赛
```

#### 评分汇总请求
```
GET /api/competitions?include_completed_for_summary=true
角色：judge
结果：返回所有状态比赛（包括completed）
```

#### 管理员请求
```
GET /api/competitions
角色：admin
结果：始终返回所有状态比赛
```

### 2. 缓存策略

#### 缓存键设计
```
格式：status:region:type:role:include_completed
示例：
- all:all:all:judge:false (评审仪表板)
- all:all:all:judge:true (评分汇总)
- all:all:all:admin:false (管理员)
```

#### 缓存隔离
- 不同角色使用不同缓存键
- 不同访问模式使用不同缓存键
- 确保数据不会交叉污染

### 3. 前端状态管理

#### 组件级别控制
```typescript
// 评审仪表板 - 受限访问
const { competitions } = useCompetitions();

// 评分汇总 - 完整访问
const { competitions } = useCompetitions({
  includeCompletedForSummary: true
});
```

## 测试验证

### 测试场景1：评审仪表板
```
请求：GET /api/competitions
角色：judge
结果：✅ 14个比赛（排除已完成）
```

### 测试场景2：评分汇总页面
```
请求：GET /api/competitions?include_completed_for_summary=true
角色：judge
结果：✅ 15个比赛（包含已完成）
```

### 测试场景3：已完成比赛访问
```
请求：GET /api/competitions?status=completed&include_completed_for_summary=true
角色：judge
结果：✅ 1个已完成比赛
```

### 测试场景4：管理员访问
```
请求：GET /api/competitions
角色：admin
结果：✅ 15个比赛（始终包含所有状态）
```

## 用户体验优化

### 1. 评分汇总页面
- ✅ **历史记录访问**：可以查看已完成比赛的评分
- ✅ **状态标识**：清晰显示比赛状态（进行中/已结束/即将开始）
- ✅ **完整视图**：不受评审仪表板的限制

### 2. 评审仪表板
- ✅ **简化选择**：只显示相关的活跃比赛
- ✅ **避免混淆**：不显示无法评分的已结束比赛
- ✅ **提高效率**：快速找到需要评分的比赛

### 3. 状态显示
在评分汇总页面中，比赛状态标签正确显示：
```typescript
{competition.status === 'active' ? '进行中' : 
 competition.status === 'completed' ? '已结束' : '即将开始'}
```

## 安全考虑

### 1. 权限验证
- **JWT认证**：所有请求都需要有效的JWT令牌
- **角色检查**：从JWT payload中提取用户角色
- **参数验证**：验证 `include_completed_for_summary` 参数

### 2. 数据隔离
- **缓存隔离**：不同访问模式使用不同缓存键
- **查询隔离**：在SQL级别应用不同的过滤条件
- **前端控制**：组件级别的访问控制

### 3. 审计追踪
- **访问日志**：记录不同页面的比赛访问模式
- **缓存监控**：监控不同缓存键的使用情况
- **性能跟踪**：跟踪新参数对性能的影响

## 维护建议

### 1. 监控指标
- 评分汇总页面的访问频率
- 已完成比赛的查看次数
- 缓存命中率的变化

### 2. 扩展性
- 为未来可能的新页面预留类似参数
- 考虑更细粒度的历史数据访问控制
- 支持基于时间范围的历史数据过滤

### 3. 用户反馈
- 收集评审对历史数据访问的使用反馈
- 优化评分汇总页面的用户界面
- 考虑添加更多历史数据分析功能

这个实现确保了评审可以在评分汇总页面查看完整的比赛历史，同时保持评审仪表板的简洁性和专注性。