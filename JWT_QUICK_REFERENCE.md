# JWT配置快速参考

## 🚀 快速开始

### 1. 生成安全密钥
```bash
cd backend
node generate-jwt-secret.js
```

### 2. 环境变量配置
在 `backend/.env` 文件中：
```env
# JWT配置
JWT_SECRET=T6dx48Si33N6p/HVVlbTGZF60E13eoo1usafzVq61Hk=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
JWT_ISSUER=scoring-system
JWT_AUDIENCE=scoring-users
```

### 3. 测试配置
```bash
node test-jwt-config.js
```

## 🔧 使用方法

### 在控制器中使用JWT
```javascript
const jwtUtils = require('../utils/jwt-utils');

// 生成令牌
const accessToken = jwtUtils.generateAccessToken({
  id: user.id,
  email: user.email,
  role: user.role
});

// 验证令牌
const decoded = await jwtUtils.verifyToken(token, 'access');
```

### 在中间件中使用
```javascript
const { authenticate, requireRole } = require('../middleware/auth');

// 需要认证
app.use('/api/protected', authenticate);

// 需要特定角色
app.use('/api/admin', authenticate, requireRole('admin'));
```

## 📊 当前配置状态

✅ **配置完成**
- 密钥长度: 44 字符 (安全)
- 访问令牌: 24小时过期
- 刷新令牌: 7天过期
- 算法: HS256
- 发行者: scoring-system

## 🔒 安全检查清单

- [x] 使用强密钥 (32+ 字符)
- [x] 设置合理的过期时间
- [x] 配置令牌类型验证
- [x] 实现刷新令牌机制
- [ ] 生产环境使用HTTPS
- [ ] 定期轮换JWT密钥

## 🚨 常见问题

### "JWT_SECRET environment variable is required"
**解决**: 运行 `node generate-jwt-secret.js` 生成密钥

### "Token has expired"
**解决**: 使用刷新令牌获取新的访问令牌

### "Invalid token"
**解决**: 检查JWT_SECRET是否正确，重新登录

## 📚 相关文件

- `backend/utils/jwt-utils.js` - JWT工具类
- `backend/middleware/auth.js` - 认证中间件
- `backend/generate-jwt-secret.js` - 密钥生成工具
- `backend/test-jwt-config.js` - 配置测试脚本
- `JWT_CONFIGURATION_GUIDE.md` - 完整配置指南