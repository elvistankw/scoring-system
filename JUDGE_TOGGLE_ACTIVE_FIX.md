# Judge Toggle Active 错误修复

**日期:** 2026年4月19日  
**状态:** ✅ **已修复**

## 问题
在评委管理页面点击"停用"或"激活"按钮时，出现错误：
```
Cannot read properties of undefined (reading 'is_active')
```

## 根本原因

### 数据结构不匹配
**后端返回:**
```javascript
res.status(200).json({
  success: true,
  message: 'Judge activated/deactivated successfully',
  data: updatedJudge  // 直接返回judge对象
});
```

**前端期望:**
```typescript
const result = await response.json();
return result.data.judge;  // ❌ 错误：期望data.judge
```

**实际应该是:**
```typescript
const result = await response.json();
return result.data;  // ✅ 正确：data直接是judge对象
```

## 修复内容

### 修改文件: `hooks/use-judges.ts`

#### 1. toggleJudgeActive 函数
```typescript
// 之前 (错误)
return result.data.judge;

// 之后 (正确)
return result.data;  // Backend returns data directly, not data.judge
```

#### 2. createJudge 函数
```typescript
// 之前 (错误)
return result.data.judge;

// 之后 (正确)
return result.data;  // Backend returns data directly, not data.judge
```

#### 3. updateJudge 函数
```typescript
// 之前 (错误)
return result.data.judge;

// 之后 (正确)
return result.data;  // Backend returns data directly, not data.judge
```

## 后端响应格式

所有judge操作的后端响应格式统一为：

### createJudge
```json
{
  "success": true,
  "message": "Judge created successfully",
  "data": {
    "id": 1,
    "name": "张三",
    "display_name": "Judge Zhang",
    "code": "J001",
    "is_active": true,
    "created_at": "2026-04-19T...",
    "updated_at": "2026-04-19T..."
  }
}
```

### updateJudge
```json
{
  "success": true,
  "message": "Judge updated successfully",
  "data": {
    "id": 1,
    "name": "张三",
    "display_name": "Judge Zhang",
    "code": "J001",
    "is_active": true,
    "created_at": "2026-04-19T...",
    "updated_at": "2026-04-19T..."
  }
}
```

### toggleJudgeActive
```json
{
  "success": true,
  "message": "Judge activated successfully",
  "data": {
    "id": 1,
    "name": "张三",
    "display_name": "Judge Zhang",
    "code": "J001",
    "is_active": true,
    "created_at": "2026-04-19T...",
    "updated_at": "2026-04-19T..."
  }
}
```

## 为什么会出现这个错误？

1. **前端代码期望嵌套结构**: `result.data.judge`
2. **后端返回扁平结构**: `result.data` (直接是judge对象)
3. **访问不存在的属性**: `undefined.is_active` → 报错

## 错误流程

```
用户点击"停用"按钮
  ↓
调用 toggleJudgeActive(judge.id)
  ↓
后端返回: { success: true, data: { id: 1, is_active: false, ... } }
  ↓
前端尝试访问: result.data.judge  // ❌ undefined
  ↓
前端尝试访问: updatedJudge.is_active  // ❌ Cannot read properties of undefined
  ↓
错误显示在UI
```

## 修复后的流程

```
用户点击"停用"按钮
  ↓
调用 toggleJudgeActive(judge.id)
  ↓
后端返回: { success: true, data: { id: 1, is_active: false, ... } }
  ↓
前端正确访问: result.data  // ✅ { id: 1, is_active: false, ... }
  ↓
前端正确访问: updatedJudge.is_active  // ✅ false
  ↓
显示成功提示: "评委已停用"
```

## 测试检查清单

- [ ] 点击"激活"按钮，评委状态变为激活
- [ ] 点击"停用"按钮，评委状态变为停用
- [ ] 停用评委后，所有活跃会话被结束
- [ ] 创建新评委成功
- [ ] 编辑评委信息成功
- [ ] 删除评委成功（如果没有活跃会话）
- [ ] 所有操作都显示正确的成功/错误提示

## 相关文件

### 修改的文件
- `hooks/use-judges.ts` - 修复了3个函数的返回值访问

### 未修改的文件
- `backend/controllers/judges.controller.js` - 后端响应格式正确，无需修改
- `components/admin/judge-list.tsx` - 前端UI组件，无需修改

## 注意事项

### API响应格式一致性
确保所有API端点的响应格式保持一致：
- ✅ 推荐: `{ success: true, data: object }`
- ❌ 避免: `{ success: true, data: { object: object } }`

### TypeScript类型定义
如果有TypeScript接口定义，确保与实际响应格式匹配：
```typescript
interface JudgeResponse {
  success: boolean;
  message: string;
  data: Judge;  // 直接是Judge对象，不是 { judge: Judge }
}
```

## 其他可能受影响的操作

已检查并修复的操作：
- ✅ createJudge - 已修复
- ✅ updateJudge - 已修复
- ✅ toggleJudgeActive - 已修复
- ✅ deleteJudge - 不返回judge对象，无需修改

---

**状态**: ✅ 所有修复已完成，等待测试验证
