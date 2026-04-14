# JWT配置完整指南

## 📋 目录

1. [JWT基础概念](#jwt基础概念)
2. [安全密钥生成](#安全密钥生成)
3. [环境变量配置](#环境变量配置)
4. [JWT中间件配置](#jwt中间件配置)
5. [令牌生成和验证](#令牌生成和验证)
6. [安全最佳实践](#安全最佳实践)
7. [故障排除](#故障排除)

## 🔐 JWT基础概念

### 什么是JWT？
JWT (JSON Web Token) 是一种开放标准 (RFC 7519)，用于在各方之间安全地传输信息。它由三部分组成：
- **Header（头部）**：包含令牌类型和签名算法
- **Payload（载荷）**：包含声明（用户信息、权限等）
- **Signature（签名）**：用于验证令牌的完整性

### JWT结构
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## 🔑 安全密钥生成

### 方法1：使用OpenSSL（推荐）
```bash
# 生成256位（32字节）的随机密钥
openssl rand -base64 32

# 示例输出
# K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

### 方法2：使用Node.js
```javascript
// 生成安全的JWT密钥
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);
```

### 方法3：在线生成器
访问 https://generate-secret.vercel.app/32 生成32字节的安全密钥

### 方法4：使用PowerShell（Windows）
```powershell
# 生成随机字节并转换为Base64
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## ⚙️ 环境变量配置

### 1. 更新 backend/.env 文件

```env
# JWT配置
JWT_SECRET=K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 可选：不同环境使用不同的密钥
JWT_ALGORITHM=HS256
JWT_ISSUER=scoring-system
JWT_AUDIENCE=scoring-users
```

### 2. 更新 backend/.env.example 文件

```env
# JWT配置
# 使用 openssl rand -base64 32 生成安全密钥
JWT_SECRET=your-secret-key-change-in-production-use-openssl-rand-base64-32
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 可选配置
JWT_ALGORITHM=HS256
JWT_ISSUER=scoring-system
JWT_AUDIENCE=scoring-users
```

### 3. 生产环境配置

```env
# 生产环境 - 使用更强的配置
JWT_SECRET=your-production-secret-key-must-be-very-long-and-random
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
JWT_ALGORITHM=HS256
JWT_ISSUER=scoring-system-prod
JWT_AUDIENCE=scoring-users-prod

# 启用更严格的安全设置
JWT_REQUIRE_HTTPS=true
JWT_SECURE_COOKIES=true
```

## 🛠️ JWT中间件配置

### 1. 创建JWT工具模块

创建 `backend/utils/jwt-utils.js`：

```javascript
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class JWTUtils {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.algorithm = process.env.JWT_ALGORITHM || 'HS256';
    this.issuer = process.env.JWT_ISSUER || 'scoring-system';
    this.audience = process.env.JWT_AUDIENCE || 'scoring-users';
    
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    if (this.secret.length < 32) {
      console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
    }
  }

  // 生成访问令牌
  generateAccessToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: 'access'
      },
      this.secret,
      {
        expiresIn: this.expiresIn,
        algorithm: this.algorithm,
        issuer: this.issuer,
        audience: this.audience
      }
    );
  }

  // 生成刷新令牌
  generateRefreshToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: 'refresh'
      },
      this.secret,
      {
        expiresIn: this.refreshExpiresIn,
        algorithm: this.algorithm,
        issuer: this.issuer,
        audience: this.audience
      }
    );
  }

  // 验证令牌
  async verifyToken(token, tokenType = 'access') {
    try {
      const decoded = await promisify(jwt.verify)(token, this.secret, {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience
      });

      // 检查令牌类型
      if (decoded.type !== tokenType) {
        throw new Error(`Invalid token type. Expected ${tokenType}, got ${decoded.type}`);
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not active');
      }
      throw error;
    }
  }

  // 解码令牌（不验证）
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }

  // 检查令牌是否即将过期
  isTokenExpiringSoon(token, thresholdMinutes = 15) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return false;
      
      const expirationTime = decoded.exp * 1000; // 转换为毫秒
      const currentTime = Date.now();
      const thresholdTime = thresholdMinutes * 60 * 1000; // 转换为毫秒
      
      return (expirationTime - currentTime) < thresholdTime;
    } catch (error) {
      return true; // 如果无法解码，认为需要刷新
    }
  }
}

module.exports = new JWTUtils();
```

### 2. 更新认证中间件

更新 `backend/middleware/auth.js`：

```javascript
const jwtUtils = require('../utils/jwt-utils');
const db = require('../db');
const { AppError } = require('./error-handler');

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access token is required', 401));
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证令牌
    const decoded = await jwtUtils.verifyToken(token, 'access');

    // 从数据库获取用户信息
    const userResult = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 401));
    }

    const user = userResult.rows[0];

    // 检查用户是否被禁用（如果有相关字段）
    // if (user.is_disabled) {
    //   return next(new AppError('Account is disabled', 401));
    // }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message.includes('expired')) {
      return next(new AppError('Token has expired', 401));
    } else if (error.message.includes('invalid')) {
      return next(new AppError('Invalid token', 401));
    }
    
    return next(new AppError('Authentication failed', 401));
  }
};

// 角色验证中间件
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }

    next();
  };
};

// 可选认证中间件（不强制要求认证）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await jwtUtils.verifyToken(token, 'access');
      
      const userResult = await db.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
        req.token = token;
        req.tokenPayload = decoded;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    console.warn('Optional authentication failed:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  optionalAuth,
  jwtUtils
};
```

## 🔄 令牌生成和验证

### 1. 更新认证控制器

更新 `backend/controllers/auth.controller.js` 中的登录逻辑：

```javascript
const bcrypt = require('bcrypt');
const { jwtUtils } = require('../middleware/auth');
const db = require('../db');
const { AppError } = require('../middleware/error-handler');

// 登录
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    // 查找用户
    const userResult = await db.query(
      'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('Invalid email or password', 401));
    }

    const user = userResult.rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // 生成令牌
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwtUtils.generateAccessToken(tokenPayload);
    const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

    // 可选：将刷新令牌存储到数据库
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // 返回用户信息和令牌
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (err) {
    next(err);
  }
};

// 刷新令牌
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // 验证刷新令牌
    const decoded = await jwtUtils.verifyToken(refreshToken, 'refresh');

    // 从数据库获取最新用户信息
    const userResult = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 401));
    }

    const user = userResult.rows[0];

    // 生成新的访问令牌
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = jwtUtils.generateAccessToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (err) {
    if (err.message.includes('expired')) {
      return next(new AppError('Refresh token has expired. Please login again.', 401));
    }
    next(err);
  }
};

module.exports = {
  login,
  refreshToken,
  // ... 其他方法
};
```

### 2. 添加令牌刷新路由

在 `backend/routes/auth.routes.js` 中添加：

```javascript
// 刷新令牌
router.post('/refresh', authController.refreshToken);

// 验证令牌
router.get('/verify', authenticate, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Token is valid',
    data: {
      user: req.user,
      tokenPayload: req.tokenPayload
    }
  });
});
```

## 🔒 安全最佳实践

### 1. 环境特定配置

```javascript
// backend/config/jwt-config.js
const getJWTConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    secret: process.env.JWT_SECRET,
    algorithm: 'HS256',
    issuer: 'scoring-system',
    audience: 'scoring-users'
  };

  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        expiresIn: '1h',
        refreshExpiresIn: '30d',
        requireHttps: true,
        secureCookies: true
      };
    
    case 'staging':
      return {
        ...baseConfig,
        expiresIn: '2h',
        refreshExpiresIn: '7d',
        requireHttps: true,
        secureCookies: true
      };
    
    default: // development
      return {
        ...baseConfig,
        expiresIn: '24h',
        refreshExpiresIn: '7d',
        requireHttps: false,
        secureCookies: false
      };
  }
};

module.exports = getJWTConfig;
```

### 2. 令牌黑名单（可选）

```javascript
// backend/utils/token-blacklist.js
const redis = require('../redis');

class TokenBlacklist {
  // 将令牌加入黑名单
  async addToBlacklist(token, expirationTime) {
    try {
      const key = `blacklist:${token}`;
      const ttl = Math.max(0, expirationTime - Date.now());
      
      if (ttl > 0) {
        await redis.setex(key, Math.ceil(ttl / 1000), 'blacklisted');
      }
    } catch (error) {
      console.error('Failed to add token to blacklist:', error);
    }
  }

  // 检查令牌是否在黑名单中
  async isBlacklisted(token) {
    try {
      const key = `blacklist:${token}`;
      const result = await redis.get(key);
      return result === 'blacklisted';
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false; // 如果Redis不可用，不阻止访问
    }
  }
}

module.exports = new TokenBlacklist();
```

### 3. 安全头部设置

```javascript
// backend/middleware/security-headers.js
const securityHeaders = (req, res, next) => {
  // 防止XSS攻击
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS重定向（生产环境）
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  
  next();
};

module.exports = securityHeaders;
```

## 🧪 测试JWT配置

### 1. 创建JWT测试脚本

创建 `backend/test-jwt-config.js`：

```javascript
const jwtUtils = require('./utils/jwt-utils');

async function testJWTConfiguration() {
  console.log('🧪 测试JWT配置...\n');

  try {
    // 1. 测试密钥配置
    console.log('1. 检查JWT密钥配置...');
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET环境变量未设置');
    }
    
    if (process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET长度不足32字符，建议使用更长的密钥');
    } else {
      console.log('✅ JWT密钥配置正确');
    }

    // 2. 测试令牌生成
    console.log('2. 测试令牌生成...');
    const testPayload = {
      id: 1,
      email: 'test@example.com',
      role: 'judge'
    };

    const accessToken = jwtUtils.generateAccessToken(testPayload);
    const refreshToken = jwtUtils.generateRefreshToken(testPayload);
    
    console.log('✅ 访问令牌生成成功');
    console.log('✅ 刷新令牌生成成功');

    // 3. 测试令牌验证
    console.log('3. 测试令牌验证...');
    
    const decodedAccess = await jwtUtils.verifyToken(accessToken, 'access');
    const decodedRefresh = await jwtUtils.verifyToken(refreshToken, 'refresh');
    
    console.log('✅ 访问令牌验证成功');
    console.log('✅ 刷新令牌验证成功');

    // 4. 测试令牌内容
    console.log('4. 验证令牌内容...');
    
    if (decodedAccess.id === testPayload.id && 
        decodedAccess.email === testPayload.email &&
        decodedAccess.role === testPayload.role) {
      console.log('✅ 令牌载荷正确');
    } else {
      throw new Error('令牌载荷不匹配');
    }

    // 5. 测试过期检查
    console.log('5. 测试过期检查...');
    
    const isExpiring = jwtUtils.isTokenExpiringSoon(accessToken, 15);
    console.log(`✅ 过期检查功能正常 (即将过期: ${isExpiring})`);

    // 6. 测试无效令牌
    console.log('6. 测试无效令牌处理...');
    
    try {
      await jwtUtils.verifyToken('invalid.token.here', 'access');
      throw new Error('应该抛出错误');
    } catch (error) {
      if (error.message.includes('Invalid token')) {
        console.log('✅ 无效令牌正确被拒绝');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 所有JWT配置测试通过！');
    console.log('\n📊 配置摘要:');
    console.log(`  密钥长度: ${process.env.JWT_SECRET.length} 字符`);
    console.log(`  访问令牌过期时间: ${process.env.JWT_EXPIRES_IN || '24h'}`);
    console.log(`  刷新令牌过期时间: ${process.env.JWT_REFRESH_EXPIRES_IN || '7d'}`);
    console.log(`  算法: ${process.env.JWT_ALGORITHM || 'HS256'}`);
    console.log(`  发行者: ${process.env.JWT_ISSUER || 'scoring-system'}`);

  } catch (error) {
    console.error('❌ JWT配置测试失败:', error.message);
    process.exit(1);
  }
}

testJWTConfiguration();
```

### 2. 运行测试

```bash
cd backend
node test-jwt-config.js
```

## 🔧 故障排除

### 常见问题和解决方案

#### 1. "JWT_SECRET environment variable is required"
**原因**: 未设置JWT_SECRET环境变量
**解决**: 在.env文件中添加JWT_SECRET

#### 2. "Token has expired"
**原因**: 令牌已过期
**解决**: 使用刷新令牌获取新的访问令牌

#### 3. "Invalid token"
**原因**: 令牌格式错误或被篡改
**解决**: 重新登录获取新令牌

#### 4. "Access denied"
**原因**: 用户角色权限不足
**解决**: 检查用户角色和路由权限要求

### 调试技巧

```javascript
// 添加调试日志
const debugJWT = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 JWT Debug Info:');
    console.log('  Authorization Header:', req.headers.authorization);
    console.log('  User:', req.user);
    console.log('  Token Payload:', req.tokenPayload);
  }
  next();
};

// 在需要调试的路由中使用
app.use('/api/protected-route', authenticate, debugJWT, protectedRouteHandler);
```

## 📚 参考资源

- [JWT.io](https://jwt.io/) - JWT调试工具
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT标准
- [OWASP JWT安全指南](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Node.js jsonwebtoken库文档](https://github.com/auth0/node-jsonwebtoken)

---

完成JWT配置后，你的评分系统将具备安全的用户认证和授权功能！