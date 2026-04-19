# 评委管理输入验证加强 🔒

## 问题描述

用户反馈"评委管理创建和管理评委信息里的信息不可靠"，需要加强输入验证以确保数据质量和安全性。

## 实施的改进

### 1. 后端验证中间件 ✅

**文件**: `backend/middleware/validate-judge.js`

创建了专门的评委数据验证中间件，包含以下验证规则：

#### A. 评审名字验证 (`validateJudgeName`)
- ✅ **必填字段**
- ✅ **长度限制**: 2-50 个字符
- ✅ **允许字符**: 字母（任何语言）、数字、空格、连字符、撇号、句点
- ✅ **禁止 HTML 标签**: 防止 XSS 攻击
- ✅ **自动去除首尾空格**

```javascript
// ✅ 有效示例
"张三"
"John Smith"
"李明-Wang"
"O'Brien"

// ❌ 无效示例
"A"  // 太短
"<script>alert('xss')</script>"  // HTML 标签
"Test@#$%"  // 特殊字符
```

#### B. 显示名字验证 (`validateDisplayName`)
- ✅ **可选字段**
- ✅ **长度限制**: 2-50 个字符（如果提供）
- ✅ **允许字符**: 与评审名字相同
- ✅ **禁止 HTML 标签**
- ✅ **空字符串视为 null**

#### C. 评审代码验证 (`validateJudgeCode`)
- ✅ **必填字段**
- ✅ **长度限制**: 2-20 个字符
- ✅ **格式要求**:
  - 必须以字母开头
  - 只能包含大写字母、数字和连字符
  - 不能有连续的连字符
  - 不能以连字符结尾
- ✅ **自动转换为大写**

```javascript
// ✅ 有效示例
"J001"
"JUDGE-01"
"J-2024-001"
"EVAL-A1"

// ❌ 无效示例
"1J"  // 不能以数字开头
"j001"  // 会自动转换为 J001
"J--001"  // 连续连字符
"J001-"  // 以连字符结尾
"J@001"  // 特殊字符
```

#### D. 激活状态验证 (`validateIsActive`)
- ✅ **必须是布尔值**
- ✅ **默认值**: true（新建评审时）

### 2. 路由中间件应用 ✅

**文件**: `backend/routes/judges.routes.js`

在所有评委管理路由中应用验证中间件：

```javascript
// 创建评审 - 应用 validateCreateJudge
router.post('/', 
  authenticate,
  requireRole('admin'),
  validateCreateJudge,  // ← 新增
  createJudge
);

// 更新评审 - 应用 validateJudgeId 和 validateUpdateJudge
router.put('/:id', 
  authenticate,
  requireRole('admin'),
  validateJudgeId,      // ← 新增
  validateUpdateJudge,  // ← 新增
  updateJudge
);

// 删除评审 - 应用 validateJudgeId
router.delete('/:id', 
  authenticate,
  requireRole('admin'),
  validateJudgeId,      // ← 新增
  deleteJudge
);

// 切换激活状态 - 应用 validateJudgeId
router.post('/:id/toggle-active', 
  authenticate,
  requireRole('admin'),
  validateJudgeId,      // ← 新增
  toggleJudgeActive
);
```

### 3. 控制器更新 ✅

**文件**: `backend/controllers/judges.controller.js`

更新了 `createJudge` 和 `updateJudge` 方法：
- 移除了冗余的验证逻辑（已由中间件处理）
- 添加了注释说明数据已经过验证
- 保留了业务逻辑验证（如代码唯一性检查）

### 4. 前端表单验证 ✅

**文件**: `components/admin/judge-form.tsx`

添加了实时前端验证：

#### A. 验证函数
```typescript
// 评审名字验证
const validateName = (name: string): string | null => {
  // 长度检查
  // HTML 标签检查
  // 字符有效性检查
};

// 显示名字验证
const validateDisplayName = (displayName: string): string | null => {
  // 可选字段
  // 长度检查
  // HTML 标签检查
};

// 评审代码验证
const validateCode = (code: string): string | null => {
  // 长度检查
  // 格式检查（必须以字母开头）
  // 字符有效性检查
  // 连字符规则检查
};
```

#### B. 错误状态管理
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### C. 实时错误显示
- 输入框边框变红
- 显示双语错误消息
- 输入时自动清除错误

#### D. 提交前验证
- 验证所有字段
- 如有错误，阻止提交并显示错误
- 只有所有字段有效才允许提交

#### E. 用户体验改进
- 评审代码自动转换为大写
- 添加字段长度限制（maxLength）
- 添加格式提示文本
- 错误消息双语显示

### 5. 验证层级

系统现在有 **3 层验证**：

```
┌─────────────────────────────────────┐
│  第 1 层: 前端实时验证               │
│  - 即时反馈                          │
│  - 防止无效提交                      │
│  - 改善用户体验                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第 2 层: 输入清理中间件             │
│  - 移除 HTML 标签                    │
│  - 移除 JavaScript 代码              │
│  - 防止 XSS 攻击                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第 3 层: 验证中间件                 │
│  - 严格的格式验证                    │
│  - 长度限制                          │
│  - 字符白名单                        │
│  - 业务规则验证                      │
└─────────────────────────────────────┘
```

## 验证规则总结

### 评审名字 (name)
| 规则 | 值 |
|------|-----|
| 必填 | ✅ 是 |
| 最小长度 | 2 字符 |
| 最大长度 | 50 字符 |
| 允许字符 | 字母、数字、空格、`-`、`'`、`.` |
| 禁止 HTML | ✅ 是 |
| 自动去空格 | ✅ 是 |

### 显示名字 (display_name)
| 规则 | 值 |
|------|-----|
| 必填 | ❌ 否（可选） |
| 最小长度 | 2 字符（如果提供） |
| 最大长度 | 50 字符 |
| 允许字符 | 字母、数字、空格、`-`、`'`、`.` |
| 禁止 HTML | ✅ 是 |
| 自动去空格 | ✅ 是 |

### 评审代码 (code)
| 规则 | 值 |
|------|-----|
| 必填 | ✅ 是 |
| 最小长度 | 2 字符 |
| 最大长度 | 20 字符 |
| 格式 | 必须以字母开头 |
| 允许字符 | 大写字母、数字、`-` |
| 禁止连续 `-` | ✅ 是 |
| 禁止以 `-` 结尾 | ✅ 是 |
| 自动转大写 | ✅ 是 |
| 唯一性 | ✅ 数据库级别检查 |

### 激活状态 (is_active)
| 规则 | 值 |
|------|-----|
| 类型 | 布尔值 |
| 默认值 | true |
| 可选 | ✅ 是（更新时） |

## 测试用例

### 有效输入
```javascript
// ✅ 创建评审
{
  "name": "张三",
  "display_name": "评审张三",
  "code": "J001"
}

// ✅ 创建评审（英文）
{
  "name": "John Smith",
  "display_name": "Judge Smith",
  "code": "JUDGE-01"
}

// ✅ 创建评审（混合）
{
  "name": "李明-Wang",
  "display_name": "Judge Li-Wang",
  "code": "J-2024-001"
}
```

### 无效输入
```javascript
// ❌ 名字太短
{
  "name": "A",
  "display_name": "Judge A",
  "code": "J001"
}
// 错误: Judge name must be at least 2 characters

// ❌ 包含 HTML 标签
{
  "name": "<script>alert('xss')</script>",
  "display_name": "Test",
  "code": "J001"
}
// 错误: Judge name cannot contain HTML tags

// ❌ 代码格式错误
{
  "name": "张三",
  "display_name": "评审张三",
  "code": "1J"
}
// 错误: Judge code must start with a letter

// ❌ 代码包含特殊字符
{
  "name": "张三",
  "display_name": "评审张三",
  "code": "J@001"
}
// 错误: Judge code can only contain uppercase letters, numbers, and hyphens

// ❌ 代码连续连字符
{
  "name": "张三",
  "display_name": "评审张三",
  "code": "J--001"
}
// 错误: Judge code cannot contain consecutive hyphens
```

## 修改的文件

### 新增文件
- ✅ `backend/middleware/validate-judge.js` - 评委验证中间件
- ✅ `JUDGE_VALIDATION_ENHANCEMENT.md` - 本文档

### 修改文件
- ✅ `backend/routes/judges.routes.js` - 应用验证中间件
- ✅ `backend/controllers/judges.controller.js` - 更新控制器注释
- ✅ `components/admin/judge-form.tsx` - 添加前端验证

## 部署检查清单

- [ ] 重启 backend server
- [ ] 测试创建评审（有效输入）
- [ ] 测试创建评审（无效输入）
- [ ] 测试更新评审
- [ ] 验证错误消息显示正确
- [ ] 验证 XSS 攻击被阻止
- [ ] 验证代码唯一性检查
- [ ] 测试前端实时验证

## 安全改进

1. ✅ **防止 XSS 攻击** - 禁止 HTML 标签和脚本
2. ✅ **输入清理** - 自动移除危险字符
3. ✅ **长度限制** - 防止缓冲区溢出
4. ✅ **字符白名单** - 只允许安全字符
5. ✅ **格式验证** - 确保数据格式正确
6. ✅ **唯一性检查** - 防止重复代码

## 用户体验改进

1. ✅ **实时验证** - 输入时即时反馈
2. ✅ **双语错误消息** - 中英文错误提示
3. ✅ **视觉反馈** - 错误字段红色边框
4. ✅ **格式提示** - 显示期望的格式
5. ✅ **自动转换** - 代码自动转大写
6. ✅ **长度限制** - 防止输入过长内容

---

**状态**: ✅ 实施完成  
**优先级**: 🟡 中等 - 建议尽快部署  
**更新时间**: 2026-04-19  
**实施者**: Kiro AI Assistant  
**相关文档**: `XSS_SECURITY_FIX.md`, `SCORE_SUMMARY_BILINGUAL_FIX.md`
