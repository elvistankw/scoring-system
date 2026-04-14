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

  // 获取令牌信息
  getTokenInfo(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) return null;

      return {
        header: decoded.header,
        payload: decoded.payload,
        isExpired: decoded.payload.exp ? (decoded.payload.exp * 1000 < Date.now()) : false,
        expiresAt: decoded.payload.exp ? new Date(decoded.payload.exp * 1000) : null,
        issuedAt: decoded.payload.iat ? new Date(decoded.payload.iat * 1000) : null
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = new JWTUtils();