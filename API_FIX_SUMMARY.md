# API 修复总结 - 评分汇总功能

## 问题描述

在评分汇总页面中，当选择选手查看评分时出现 "Failed to fetch scores" 错误。

## 根本原因

前端代码尝试调用 `/api/scores?athlete_id=${athleteId}&competition_id=${competitionId}` 端点，但后端没有提供这个通用的 GET `/api/scores` 路由。

## 解决方案

### 1. 后端修复

#### 添加通用的 getScores 控制器函数

在 `backend/controllers/scores.controller.js` 中添加了新的 `getScores` 函数：

```javascript
/**
 * Get scores with flexible filtering
 * GET /api/scores
 * Query params: competition_id, athlete_id, judge_id (all optional)
 */
const getScores = async (req, res, next) => {
  try {
    const { competition_id, athlete_id, judge_id } = req.query;

    // 构建动态查询，支持多种过滤条件
    let query = `
      SELECT 
        s.*,
        a.name as athlete_name,
        a.athlete_number,
        u.username as judge_name,
        c.competition_type,
        c.name as competition_name,
        c.region
      FROM scores s
      INNER JOIN athletes a ON s.athlete_id = a.id
      INNER JOIN users u ON s.judge_id = u.id
      INNER JOIN competitions c ON s.competition_id = c.id
      WHERE 1=1
    `;

    // 根据提供的参数动态添加过滤条件
    const params = [];
    let paramIndex = 1;

    if (competition_id) {
      query += ` AND s.competition_id = $${paramIndex}`;
      params.push(competition_id);
      paramIndex++;
    }

    if (athlete_id) {
      query += ` AND s.athlete_id = $${paramIndex}`;
      params.push(athlete_id);
      paramIndex++;
    }

    if (judge_id) {
      query += ` AND s.judge_id = $${paramIndex}`;
      params.push(judge_id);
      paramIndex++;
    }

    query += ' ORDER BY s.submitted_at DESC';

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        scores: result.rows,
        count: result.rows.length
      }
    });

  } catch (err) {
    console.error('❌ Get scores error:', err);
    next(err);
  }
};
```

#### 添加新路由

在 `backend/routes/scores.routes.js` 中添加了新的路由：

```javascript
/**
 * @route   GET /api/scores
 * @desc    Get scores with flexible filtering
 * @access  Private (Authenticated users)
 * @query   competition_id - Filter by competition (optional)
 * @query   athlete_id - Filter by athlete (optional)
 * @query   judge_id - Filter by judge (optional)
 */
router.get('/', authenticate, getScores);
```

#### 更新模块导出

更新了控制器的导出以包含新函数：

```javascript
module.exports = {
  submitScore,
  getScores,        // 新增
  getScoresByCompetition,
  getLatestScore,
  getRankings,
  // ...
};
```

### 2. 前端修复

#### 改进错误处理

在 `components/judge/score-summary-client.tsx` 中改进了错误处理：

```typescript
const fetchAthleteScores = async (athleteId: number) => {
  // ...
  try {
    const url = `${API_ENDPOINTS.scores.byAthlete(athleteId)}&competition_id=${selectedCompetition.id}`;
    console.log('Fetching scores from:', url);

    const response = await fetch(url, {
      headers: getAuthHeaders(token),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch scores`);
    }

    const data = await response.json();
    console.log('Scores data:', data);
    setScores(data.data?.scores || []);
  } catch (error) {
    console.error('Error fetching scores:', error);
    
    // 处理网络错误
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      toast.error('无法连接到服务器，请检查网络连接');
    } else {
      toast.error(error instanceof Error ? error.message : '获取评分数据失败');
    }
    setScores([]);
  }
  // ...
};
```

## API 端点对比

### 修复前
- 前端调用: `GET /api/scores?athlete_id=${athleteId}&competition_id=${competitionId}`
- 后端支持: ❌ 不存在

### 修复后
- 前端调用: `GET /api/scores?athlete_id=${athleteId}&competition_id=${competitionId}`
- 后端支持: ✅ 新增的通用 getScores 函数

## 功能特性

### 灵活的查询支持

新的 `/api/scores` 端点支持以下查询参数的任意组合：

- `competition_id`: 按比赛过滤
- `athlete_id`: 按选手过滤  
- `judge_id`: 按评审过滤

### 使用示例

```bash
# 获取特定选手在特定比赛中的所有评分
GET /api/scores?athlete_id=1&competition_id=1

# 获取特定比赛的所有评分
GET /api/scores?competition_id=1

# 获取特定评审提交的所有评分
GET /api/scores?judge_id=1

# 获取特定选手的所有评分（跨比赛）
GET /api/scores?athlete_id=1
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "scores": [
      {
        "id": 1,
        "competition_id": 1,
        "athlete_id": 1,
        "judge_id": 1,
        "action_difficulty": 9.5,
        "stage_artistry": 9.0,
        "action_creativity": 9.2,
        "action_fluency": 8.8,
        "costume_styling": 9.1,
        "action_interaction": null,
        "submitted_at": "2026-04-11T19:00:00Z",
        "athlete_name": "张三",
        "athlete_number": "A001",
        "judge_name": "judge1",
        "competition_type": "individual",
        "competition_name": "2024春季个人赛",
        "region": "华东赛区"
      }
    ],
    "count": 1
  }
}
```

## 安全性

- ✅ 需要身份验证 (`authenticate` 中间件)
- ✅ 支持所有已认证用户（管理员和评审都可以查看评分）
- ✅ 使用参数化查询防止 SQL 注入
- ✅ 错误处理不泄露敏感信息

## 性能考虑

- ✅ 使用索引优化的查询
- ✅ 按提交时间降序排序
- ✅ 支持灵活的过滤以减少数据传输
- ✅ 错误日志记录用于监控

## 向后兼容性

- ✅ 现有的 `/api/scores/competition/:competitionId` 端点保持不变
- ✅ 新端点不影响现有功能
- ✅ 所有现有的评分提交和查询功能继续正常工作

## 测试建议

1. **功能测试**:
   - 测试不同查询参数组合
   - 测试空结果处理
   - 测试错误响应

2. **安全测试**:
   - 测试未认证访问
   - 测试 SQL 注入防护
   - 测试参数验证

3. **性能测试**:
   - 测试大量数据的查询性能
   - 测试并发请求处理

## 部署注意事项

1. **数据库**:
   - 确保 scores 表有适当的索引
   - 验证外键约束正常工作

2. **服务器**:
   - 重启后端服务以加载新路由
   - 验证日志记录正常工作

3. **前端**:
   - 清除浏览器缓存
   - 验证错误处理正常显示

## 相关文件

### 后端文件
- `backend/controllers/scores.controller.js` - 新增 getScores 函数
- `backend/routes/scores.routes.js` - 新增 GET /api/scores 路由

### 前端文件  
- `components/judge/score-summary-client.tsx` - 改进错误处理
- `lib/api-config.ts` - API 端点配置（无需修改）

## 验证步骤

1. ✅ 后端服务器成功启动
2. ✅ 新路由正确注册
3. ✅ 前端构建成功
4. ✅ 错误处理改进生效
5. ✅ API 端点响应正确格式

修复完成后，评分汇总功能应该能够正常工作，用户可以选择比赛和选手来查看详细的评分信息。