# Judge Identity System Design 评委身份系统设计

## 需求分析 Requirements Analysis

### 当前系统 Current System
- 评委身份通过 email + JWT 确定
- 直接登录后进入 judge dashboard
- 评委角色固定在用户表中

### 新需求 New Requirements
1. **统一评委账号**: 使用一个通用的 judge 账号登录
2. **身份选择界面**: 登录后显示开场界面，点击"开始"按钮
3. **评委角色选择**: 选择具体的评委身份（姓名）
4. **动态身份**: 评委身份不再固定，可以灵活选择

## 数据库设计 Database Design

### 需要新增的数据表 New Tables Required

#### 1. judges 表 (评委信息表)
```sql
CREATE TABLE judges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                    -- 评委姓名
    display_name VARCHAR(100),                     -- 显示名称
    code VARCHAR(20) UNIQUE NOT NULL,              -- 评委代码 (如: J001, J002)
    is_active BOOLEAN DEFAULT true,                -- 是否激活
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_judges_code ON judges(code);
CREATE INDEX idx_judges_active ON judges(is_active);
CREATE INDEX idx_judges_name ON judges(name);
```

#### 2. judge_sessions 表 (评委会话表)
```sql
CREATE TABLE judge_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,    -- 会话令牌
    judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- 登录的用户ID
    ip_address INET,                               -- IP地址
    user_agent TEXT,                               -- 浏览器信息
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,                 -- 会话过期时间
    is_active BOOLEAN DEFAULT true,
    ended_at TIMESTAMP,
    
    CONSTRAINT check_expires_after_start CHECK (expires_at > started_at)
);

-- 索引
CREATE INDEX idx_judge_sessions_token ON judge_sessions(session_token);
CREATE INDEX idx_judge_sessions_judge ON judge_sessions(judge_id);
CREATE INDEX idx_judge_sessions_active ON judge_sessions(is_active);
CREATE INDEX idx_judge_sessions_expires ON judge_sessions(expires_at);
```

### 修改现有表 Modify Existing Tables

#### 1. 修改 scores 表
```sql
-- 添加新字段
ALTER TABLE scores ADD COLUMN judge_session_id INTEGER REFERENCES judge_sessions(id) ON DELETE SET NULL;
ALTER TABLE scores ADD COLUMN judge_name VARCHAR(100); -- 冗余字段，便于查询

-- 添加索引
CREATE INDEX idx_scores_judge_session ON scores(judge_session_id);

-- 注意：保留原有的 judge_id 字段以兼容现有数据
```

#### 2. 修改 users 表 (可选)
```sql
-- 添加标识字段，标记这是评委通用账号
ALTER TABLE users ADD COLUMN is_judge_account BOOLEAN DEFAULT false;

-- 为评委通用账号添加标记
UPDATE users SET is_judge_account = true WHERE role = 'judge' AND email = 'judge@scoring-system.com';
```

## 系统流程设计 System Flow Design

### 1. 登录流程 Login Flow
```
1. 用户使用统一评委账号登录 (judge@scoring-system.com)
2. 验证账号密码，生成基础 JWT token
3. 重定向到评委身份选择页面 (/judge-identity-selection)
```

### 2. 身份选择流程 Identity Selection Flow
```
1. 显示开场界面，包含"开始评分"按钮
2. 点击"开始"后，显示可用评委列表
3. 选择具体评委身份 (如: 张三评委、李四评委)
4. 创建 judge_session 记录
5. 生成包含评委身份的新 JWT token
6. 重定向到 judge dashboard
```

### 3. 评分流程 Scoring Flow
```
1. 使用包含评委身份的 JWT token
2. 提交评分时记录 judge_session_id 和 judge_name
3. 保持会话活跃状态
```

### 4. 会话管理 Session Management
```
1. 会话自动过期 (默认8小时)
2. 支持手动结束会话
3. 支持切换评委身份 (结束当前会话，选择新身份)
```

## 技术实现方案 Technical Implementation

### 1. 后端 API 设计

#### 新增 API 端点
```javascript
// 获取可用评委列表
GET /api/judges/available

// 选择评委身份，创建会话
POST /api/judges/select-identity
{
  "judgeId": 1,
  "judgeCode": "J001"
}

// 获取当前评委会话信息
GET /api/judges/current-session

// 结束评委会话
POST /api/judges/end-session

// 切换评委身份
POST /api/judges/switch-identity
{
  "judgeId": 2,
  "judgeCode": "J002"
}
```

#### 修改现有 API
```javascript
// 修改评分提交 API
POST /api/scores/submit
{
  "competitionId": 1,
  "athleteId": 1,
  "scores": {...},
  "judgeSessionId": "session_token_here"  // 新增字段
}
```

### 2. 前端页面设计

#### 新增页面
1. **评委身份选择页面** `/judge-identity-selection`
   - 开场欢迎界面
   - "开始评分"按钮
   - 评委列表选择界面

2. **评委会话管理页面** `/judge-session-management`
   - 当前会话信息
   - 切换身份功能
   - 结束会话功能

#### 修改现有页面
1. **Judge Dashboard** - 显示当前评委身份
2. **评分页面** - 在评分记录中显示评委姓名
3. **评分汇总页面** - 按评委姓名分组显示

### 3. 中间件修改

#### 新增评委身份验证中间件
```javascript
// backend/middleware/judge-auth.js
const verifyJudgeSession = async (req, res, next) => {
  try {
    // 1. 验证基础 JWT token
    // 2. 提取 judge_session_id
    // 3. 验证会话是否有效
    // 4. 将评委信息附加到 req.judge
    next();
  } catch (error) {
    next(error);
  }
};
```

## 数据迁移方案 Data Migration Plan

### 1. 初始化评委数据
```sql
-- 插入示例评委数据
INSERT INTO judges (name, display_name, code, is_active) VALUES
('张三', '张三评委', 'J001', true),
('李四', '李四评委', 'J002', true),
('王五', '王五评委', 'J003', true),
('赵六', '赵六评委', 'J004', true),
('钱七', '钱七评委', 'J005', true);
```

### 2. 创建评委通用账号
```sql
-- 创建评委通用账号
INSERT INTO users (username, email, password_hash, role, is_judge_account) 
VALUES ('judge', 'judge@scoring-system.com', '$2b$10$...', 'judge', true);
```

### 3. 历史数据处理
```sql
-- 为现有评分记录添加评委姓名 (基于现有 judge_id)
UPDATE scores 
SET judge_name = u.username 
FROM users u 
WHERE scores.judge_id = u.id AND scores.judge_name IS NULL;
```

## 安全考虑 Security Considerations

### 1. 会话安全
- 会话令牌使用强随机生成
- 设置合理的过期时间
- 记录 IP 地址和 User-Agent 用于异常检测

### 2. 身份验证
- 双重验证：基础账号 + 评委身份
- 防止会话劫持
- 支持强制结束会话

### 3. 审计日志
- 记录评委身份选择操作
- 记录会话开始/结束时间
- 记录评分操作的评委身份

## 用户体验设计 User Experience Design

### 1. 开场界面设计
- 欢迎信息
- 系统介绍
- 大按钮"开始评分"
- 优雅的动画效果

### 2. 评委选择界面
- 卡片式评委列表
- 评委头像/代码显示
- 搜索/筛选功能
- 确认选择对话框

### 3. 会话状态显示
- 顶部显示当前评委身份
- 会话剩余时间提醒
- 快速切换身份入口

## 实施步骤 Implementation Steps

### Phase 1: 数据库设计
1. 创建新表 (judges, judge_sessions)
2. 修改现有表 (scores)
3. 数据迁移脚本

### Phase 2: 后端 API
1. 评委管理 API
2. 会话管理 API
3. 修改评分 API
4. 中间件更新

### Phase 3: 前端界面
1. 身份选择页面
2. 会话管理组件
3. 修改现有页面
4. 状态管理更新

### Phase 4: 测试与部署
1. 单元测试
2. 集成测试
3. 用户体验测试
4. 生产环境部署

## 配置管理 Configuration Management

### 环境变量
```env
# 评委会话配置
JUDGE_SESSION_EXPIRES_HOURS=8
JUDGE_SESSION_SECRET=your_session_secret_here
MAX_CONCURRENT_SESSIONS_PER_JUDGE=1

# 评委账号配置
JUDGE_ACCOUNT_EMAIL=judge@scoring-system.com
JUDGE_ACCOUNT_PASSWORD=secure_password_here
```

### 系统配置
```javascript
// config/judge-system.js
module.exports = {
  session: {
    expiresInHours: process.env.JUDGE_SESSION_EXPIRES_HOURS || 8,
    maxConcurrentSessions: process.env.MAX_CONCURRENT_SESSIONS_PER_JUDGE || 1,
    cleanupIntervalMinutes: 30
  },
  identity: {
    requireSelection: true,
    allowSwitching: true,
    sessionTimeout: true
  }
};
```

## 总结 Summary

这个设计方案实现了：

✅ **统一登录**: 使用一个评委账号登录
✅ **身份选择**: 登录后选择具体评委身份
✅ **会话管理**: 安全的评委会话管理
✅ **灵活切换**: 支持切换评委身份
✅ **数据完整性**: 保持评分记录的准确性
✅ **向后兼容**: 不影响现有数据和功能
✅ **安全性**: 多层身份验证和会话管理
✅ **用户体验**: 直观的界面和流程设计

**是否需要添加新数据表**: 是的，需要添加 `judges` 和 `judge_sessions` 两个新表来支持这个功能。