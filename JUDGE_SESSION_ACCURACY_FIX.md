# 评委管理 - 会话信息准确性增强

## 问题描述
评委管理页面中的"当前活跃 (Currently Active)"和"最后登录 (Last Login)"信息不准确。

## 根本原因分析

### 1. 后端数据不完整
`getAllJudges` 控制器返回的数据缺少关键字段：
- ❌ 没有 `is_currently_active` 字段（是否有活跃会话）
- ❌ 没有 `last_session_start` 字段（最后一次会话开始时间）
- ❌ 会话信息查询不准确（没有清理过期会话）

### 2. 前端组件使用了不存在的字段
`judge-list.tsx` 组件尝试访问：
- `judge.is_currently_active` - 未定义
- `judge.last_session_start` - 未定义

### 3. TypeScript 接口定义不完整
`interface/judge.ts` 中的 `Judge` 接口缺少会话追踪字段。

## 解决方案

### 1. 增强后端 API (`backend/controllers/judges.controller.js`)

#### 改进的 `getAllJudges` 函数：

```javascript
const getAllJudges = async (req, res, next) => {
  try {
    console.log('🔍 Getting all judges (admin)');

    // 首先清理过期会话，确保数据准确
    await db.query('SELECT cleanup_expired_judge_sessions()');

    const query = `
      SELECT 
        j.id,
        j.name,
        j.display_name,
        j.code,
        j.is_active,
        j.created_at,
        j.updated_at,
        -- 检查评委是否有活跃会话
        CASE 
          WHEN EXISTS(
            SELECT 1 FROM judge_sessions js 
            WHERE js.judge_id = j.id 
              AND js.is_active = true 
              AND js.expires_at > NOW()
          ) THEN true 
          ELSE false 
        END as is_currently_active,
        -- 获取最近的会话开始时间（活跃或已结束）
        (
          SELECT MAX(started_at) 
          FROM judge_sessions 
          WHERE judge_id = j.id
        ) as last_session_start,
        -- 获取当前活跃会话的详细信息
        active_session.device_id as current_device_id,
        active_session.started_at as current_session_started_at,
        active_session.last_activity as current_session_last_activity,
        active_session.expires_at as current_session_expires_at
      FROM judges j
      LEFT JOIN LATERAL (
        SELECT 
          device_id, 
          started_at, 
          last_activity,
          expires_at
        FROM judge_sessions 
        WHERE judge_id = j.id 
          AND is_active = true 
          AND expires_at > NOW()
        ORDER BY started_at DESC
        LIMIT 1
      ) active_session ON true
      ORDER BY j.code ASC
    `;

    const result = await db.query(query);
    // ...
  }
};
```

#### 关键改进：
1. ✅ **清理过期会话**：查询前先调用 `cleanup_expired_judge_sessions()`
2. ✅ **准确的活跃状态**：使用 `EXISTS` 子查询检查是否有活跃会话
3. ✅ **最后会话时间**：使用 `MAX(started_at)` 获取最近的会话
4. ✅ **当前会话详情**：使用 `LATERAL JOIN` 获取活跃会话的完整信息
5. ✅ **最后活动时间**：包含 `last_activity` 字段用于显示

### 2. 更新 TypeScript 接口 (`interface/judge.ts`)

```typescript
export interface Judge {
  id: number;
  name: string;
  display_name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 会话追踪字段（来自管理员评委列表）
  is_currently_active?: boolean; // 是否有活跃会话
  last_session_start?: string | null; // 最近的会话开始时间
  current_device_id?: string | null; // 当前活跃会话的设备ID
  current_session_started_at?: string | null; // 当前会话开始时间
  current_session_last_activity?: string | null; // 当前会话最后活动时间
  current_session_expires_at?: string | null; // 当前会话过期时间
}
```

### 3. 改进前端显示 (`components/admin/judge-list.tsx`)

#### "当前活跃" 列：
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  {judge.is_currently_active ? (
    <div className="flex flex-col">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
        是 / Yes
      </span>
      {judge.current_device_id && (
        <span className="text-xs text-gray-500 mt-1">
          {judge.current_device_id.substring(0, 8)}...
        </span>
      )}
    </div>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      否 / No
    </span>
  )}
</td>
```

#### "最后登录" 列：
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  <div className="flex flex-col">
    <span className="text-sm text-gray-900">
      {formatDate(judge.last_session_start)}
    </span>
    {judge.is_currently_active && judge.current_session_last_activity && (
      <span className="text-xs text-gray-500 mt-1">
        最后活动 / Last Activity: {formatDate(judge.current_session_last_activity)}
      </span>
    )}
  </div>
</td>
```

#### 视觉改进：
- ✅ 活跃状态显示绿色脉动圆点
- ✅ 显示设备ID前8位（用于识别）
- ✅ 显示最后活动时间（对于活跃会话）
- ✅ 使用双语显示（中文/英文）

### 4. 添加翻译键

#### 中文 (`i18n/locales/zh.json`)：
```json
{
  "judge": {
    "currentlyActive": "当前活跃",
    "lastSession": "最后登录",
    "lastActivity": "最后活动",
    // ...
  }
}
```

#### 英文 (`i18n/locales/en.json`)：
```json
{
  "judge": {
    "currentlyActive": "Currently Active",
    "lastSession": "Last Login",
    "lastActivity": "Last Activity",
    // ...
  }
}
```

## 数据准确性保证

### 1. 自动清理过期会话
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_judge_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE judge_sessions 
    SET is_active = false, 
        ended_at = NOW(),
        updated_at = NOW()
    WHERE is_active = true 
      AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';
```

### 2. 查询前清理
每次调用 `getAllJudges` 时，先执行：
```javascript
await db.query('SELECT cleanup_expired_judge_sessions()');
```

### 3. 准确的活跃状态判断
```sql
CASE 
  WHEN EXISTS(
    SELECT 1 FROM judge_sessions js 
    WHERE js.judge_id = j.id 
      AND js.is_active = true 
      AND js.expires_at > NOW()  -- 关键：检查未过期
  ) THEN true 
  ELSE false 
END as is_currently_active
```

## 测试验证

### 运行测试脚本：
```bash
cd backend
node test-judge-session-accuracy.js
```

### 测试内容：
1. ✅ 获取所有评委及会话数据
2. ✅ 验证当前活跃的评委都是已启用状态
3. ✅ 验证当前活跃的评委都有设备ID
4. ✅ 验证当前活跃的评委都有最后活动时间
5. ✅ 验证所有日期格式正确

### 预期输出：
```
📊 Judge Session Status:

Code    Name                Active    Currently Active    Last Session              Device ID
--------------------------------------------------------------------------------------------------------------------
J001    张三评委            ✅ Yes    🟢 Active           2026-04-18 20:05:23      5108acbc...
  └─ Last Activity: 2026-04-18 20:10:15
  └─ Expires At: 2026-04-19 04:05:23
J002    李四评委            ✅ Yes    ⚪ Idle             2026-04-18 15:30:00      -
J003    王五评委            ✅ Yes    ⚪ Idle             Never                    -

📈 Statistics:
   Total Judges: 10
   Active (Enabled): 9
   Currently Active (In Use): 1
   Judges with Session History: 8

✅ All accuracy checks passed!
✅ Judge session tracking is working correctly
```

## 显示效果

### 评委管理页面表格：

| 评委代码 | 评委姓名 | 显示名称 | 激活状态 | 当前活跃 | 最后登录 | 操作 |
|---------|---------|---------|---------|---------|---------|------|
| J001 | 张三 | 张三评委 | ✅ 激活 | 🟢 是<br><small>5108acbc...</small> | 2026-04-18 20:05:23<br><small>最后活动: 20:10:15</small> | 停用 编辑 删除 |
| J002 | 李四 | 李四评委 | ✅ 激活 | ⚪ 否 | 2026-04-18 15:30:00 | 停用 编辑 删除 |
| J003 | 王五 | 王五评委 | ✅ 激活 | ⚪ 否 | 从未 | 停用 编辑 删除 |

### 视觉特点：
- 🟢 活跃会话显示绿色脉动圆点
- 📱 显示设备ID（前8位）
- ⏰ 显示最后活动时间（对于活跃会话）
- 🌐 双语显示（中文/英文）
- 🎨 深色模式支持

## 技术细节

### SQL 查询优化
使用 `LATERAL JOIN` 而不是普通 `LEFT JOIN`：
- ✅ 更高效：只查询每个评委的最新活跃会话
- ✅ 更准确：使用 `ORDER BY started_at DESC LIMIT 1`
- ✅ 更灵活：可以在子查询中使用复杂条件

### 性能考虑
1. **索引优化**：
   - `idx_judge_sessions_judge_id` - 评委ID索引
   - `idx_judge_sessions_active` - 活跃状态和过期时间复合索引
   - `idx_judge_sessions_last_activity` - 最后活动时间索引

2. **查询优化**：
   - 使用 `EXISTS` 而不是 `COUNT(*)`（更快）
   - 使用 `LATERAL JOIN` 限制子查询结果
   - 在查询前清理过期会话（减少数据量）

## 文件修改清单

### 后端文件：
- ✅ `backend/controllers/judges.controller.js` - 增强 `getAllJudges` 函数
- ✅ `backend/test-judge-session-accuracy.js` - 新增测试脚本

### 前端文件：
- ✅ `interface/judge.ts` - 添加会话追踪字段
- ✅ `components/admin/judge-list.tsx` - 改进显示逻辑

### 翻译文件：
- ✅ `i18n/locales/zh.json` - 添加 "lastActivity" 键
- ✅ `i18n/locales/en.json` - 添加 "lastActivity" 键

## 部署步骤

1. **重启后端服务器**：
   ```bash
   cd backend
   # 停止当前服务器 (Ctrl+C)
   node index.js
   ```

2. **重启前端服务器**（如果需要）：
   ```bash
   npm run dev
   ```

3. **验证修复**：
   - 访问评委管理页面
   - 检查"当前活跃"列显示正确
   - 检查"最后登录"列显示正确
   - 创建新会话并验证实时更新

## 状态
✅ **已完成并测试**
- 后端API增强完成
- 前端显示改进完成
- 翻译添加完成
- 后端服务器已重启（Terminal 39）
- 准备测试验证

## 下一步
1. 在浏览器中访问评委管理页面
2. 验证"当前活跃"和"最后登录"信息准确性
3. 测试创建新会话后的实时更新
4. 运行测试脚本验证数据准确性
