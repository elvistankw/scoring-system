# 管理员评分管理功能

## 功能概述
在管理员编辑比赛页面添加了"评分管理"标签页，允许管理员查看、编辑和删除选手的评分记录。

## 新增文件

### 1. 前端组件
**文件**: `components/admin/competition-scores-manager.tsx`

**功能**:
- 显示比赛中所有参赛选手列表
- 选择选手后显示该选手的所有评分记录
- 编辑评分记录（修改各项评分维度）
- 删除评分记录
- 根据比赛类型显示相应的评分维度

**特性**:
- ✅ 响应式设计，适配桌面和平板
- ✅ 实时更新，修改后立即刷新
- ✅ 删除前确认提示
- ✅ 根据比赛类型动态显示评分字段
- ✅ 支持深色模式

### 2. 后端API端点

#### 更新评分
```
PUT /api/scores/:id
```

**权限**: 仅管理员
**功能**: 更新指定评分记录的各项评分维度
**验证**: 
- 评分范围验证（0-30分）
- 字段类型验证
- 自动更新 `updated_at` 时间戳
- 清除相关缓存

#### 删除评分
```
DELETE /api/scores/:id
```

**权限**: 仅管理员
**功能**: 删除指定的评分记录
**安全**: 
- 删除前确认
- 清除相关缓存
- 返回成功/失败状态

## 修改的文件

### 1. 前端组件
**文件**: `components/admin/competition-edit-client.tsx`

**修改内容**:
- 添加第三个标签页 "评分管理"
- 更新 `activeTab` 状态类型: `'info' | 'athletes' | 'scores'`
- 导入并渲染 `CompetitionScoresManager` 组件

### 2. 后端控制器
**文件**: `backend/controllers/scores.controller.js`

**新增函数**:
- `updateScore(req, res, next)` - 更新评分
- `deleteScore(req, res, next)` - 删除评分

**功能特性**:
- 动态构建 UPDATE 查询
- 只更新提供的字段
- 验证评分范围
- 自动清除 Redis 缓存

### 3. 后端路由
**文件**: `backend/routes/scores.routes.js`

**新增路由**:
```javascript
router.put('/:id', authenticate, requireRole('admin'), updateScore);
router.delete('/:id', authenticate, requireRole('admin'), deleteScore);
```

## 使用流程

### 管理员操作步骤

1. **进入比赛编辑页面**
   ```
   /zh/admin-dashboard/competitions/[id]
   ```

2. **切换到"评分管理"标签页**
   - 点击顶部的"评分管理"标签

3. **选择选手**
   - 从选手列表中点击要查看的选手
   - 系统自动加载该选手的所有评分记录

4. **查看评分**
   - 显示评委姓名、提交时间
   - 显示各项评分维度的分数
   - 根据比赛类型显示相应字段

5. **编辑评分**
   - 点击评分记录右上角的"编辑"按钮
   - 修改各项评分维度
   - 点击"保存"提交更改
   - 或点击"取消"放弃更改

6. **删除评分**
   - 点击评分记录右上角的"删除"按钮
   - 确认删除操作
   - 评分记录被永久删除

## 评分字段映射

### 个人赛 (Individual)
- 动作难度 (action_difficulty)
- 舞台艺术 (stage_artistry)
- 动作创意 (action_creativity)
- 动作流畅 (action_fluency)
- 服装造型 (costume_styling)

### 双人赛 (Duo)
- 动作难度 (action_difficulty)
- 舞台艺术 (stage_artistry)
- 动作互动 (action_interaction)
- 动作创意 (action_creativity)
- 服装造型 (costume_styling)

### 团体赛 (Team)
- 动作难度 (action_difficulty)
- 舞台艺术 (stage_artistry)
- 动作互动 (action_interaction)
- 动作创意 (action_creativity)
- 服装造型 (costume_styling)

### 挑战赛 (Challenge)
- 动作难度 (action_difficulty)
- 动作创意 (action_creativity)
- 动作流畅 (action_fluency)

## API 请求示例

### 更新评分
```javascript
PUT /api/scores/123
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action_difficulty": 25.5,
  "stage_artistry": 28.0,
  "action_creativity": 26.5,
  "action_fluency": 27.0,
  "costume_styling": 24.5
}
```

**响应**:
```json
{
  "success": true,
  "message": "Score updated successfully",
  "data": {
    "score": {
      "id": 123,
      "competition_id": 1,
      "athlete_id": 45,
      "judge_id": 10,
      "action_difficulty": 25.5,
      "stage_artistry": 28.0,
      "action_creativity": 26.5,
      "action_fluency": 27.0,
      "costume_styling": 24.5,
      "updated_at": "2026-04-19T12:34:56.789Z"
    }
  }
}
```

### 删除评分
```javascript
DELETE /api/scores/123
Authorization: Bearer <admin_token>
```

**响应**:
```json
{
  "success": true,
  "message": "Score deleted successfully"
}
```

## 安全性

### 权限控制
- ✅ 只有管理员可以访问评分管理功能
- ✅ 使用 JWT token 验证身份
- ✅ 使用 `requireRole('admin')` 中间件

### 数据验证
- ✅ 评分范围验证（0-30分）
- ✅ 字段类型验证
- ✅ SQL 参数化查询防止注入

### 缓存管理
- ✅ 更新/删除后自动清除 Redis 缓存
- ✅ 确保数据一致性

## 错误处理

### 前端
- 网络错误提示
- 权限错误提示
- 操作成功/失败 Toast 通知

### 后端
- 404: 评分记录不存在
- 400: 无效的评分值
- 401: 未授权
- 403: 权限不足

## 测试步骤

1. **登录管理员账号**
   ```
   /zh/sign-in
   ```

2. **进入比赛管理**
   ```
   /zh/admin-dashboard
   ```

3. **选择一个比赛**
   - 点击"查看详情"

4. **切换到评分管理标签**
   - 验证选手列表显示
   - 验证评分记录显示

5. **测试编辑功能**
   - 修改评分值
   - 保存并验证更新成功
   - 刷新页面验证数据持久化

6. **测试删除功能**
   - 删除一条评分记录
   - 验证删除成功
   - 验证记录不再显示

## 注意事项

1. **数据完整性**
   - 删除评分会影响选手的平均分和排名
   - 建议谨慎使用删除功能

2. **缓存更新**
   - 修改评分后会自动清除缓存
   - 实时大屏幕会在下次刷新时显示新数据

3. **审计日志**
   - 建议添加操作日志记录管理员的修改操作
   - 可以追踪谁在什么时候修改了哪些评分

## 未来改进

- [ ] 添加批量编辑功能
- [ ] 添加评分历史记录（修改前后对比）
- [ ] 添加操作审计日志
- [ ] 添加评分统计分析
- [ ] 支持导出评分数据到 Excel
- [ ] 添加评分异常检测（如异常高分或低分）

## 相关文件

### 前端
- `components/admin/competition-edit-client.tsx` - 比赛编辑主组件
- `components/admin/competition-scores-manager.tsx` - 评分管理组件
- `hooks/use-athletes.ts` - 选手数据 hook
- `lib/api-config.ts` - API 配置

### 后端
- `backend/controllers/scores.controller.js` - 评分控制器
- `backend/routes/scores.routes.js` - 评分路由
- `backend/middleware/auth.js` - 认证中间件

## 日期
2026-04-19
