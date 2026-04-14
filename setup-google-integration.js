#!/usr/bin/env node

/**
 * Google Workspace 集成自动设置脚本
 * 自动创建必要的文件和配置
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置Google Workspace集成...\n');

// 检查是否在正确的目录
if (!fs.existsSync('backend') || !fs.existsSync('package.json')) {
  console.error('❌ 请在项目根目录运行此脚本');
  process.exit(1);
}

// 1. 安装必要的依赖
console.log('📦 安装后端依赖...');
const { execSync } = require('child_process');

try {
  execSync('npm install googleapis google-auth-library', { 
    cwd: 'backend',
    stdio: 'inherit' 
  });
  console.log('✅ 后端依赖安装完成\n');
} catch (error) {
  console.error('❌ 依赖安装失败:', error.message);
  process.exit(1);
}

// 2. 创建Google服务模块
console.log('📝 创建Google服务模块...');
const googleServiceCode = `const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.drive = google.drive({ version: 'v3' });
    this.sheets = google.sheets({ version: 'v4' });
  }

  // 获取OAuth授权URL
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  // 处理OAuth回调
  async handleCallback(code) {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    return tokens;
  }

  // 上传文件到Google Drive
  async uploadToDrive(fileBuffer, fileName, mimeType, userTokens, targetEmail) {
    this.oauth2Client.setCredentials(userTokens);
    
    const drive = google.drive({ 
      version: 'v3', 
      auth: this.oauth2Client 
    });

    const fileMetadata = {
      name: fileName,
      parents: ['root']
    };

    const media = {
      mimeType: mimeType,
      body: fileBuffer
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink'
    });

    // 如果指定了目标邮箱，共享文件
    if (targetEmail && targetEmail !== userTokens.email) {
      await drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'writer',
          type: 'user',
          emailAddress: targetEmail
        }
      });
    }

    return response.data;
  }

  // 创建Google Sheets
  async createSheet(title, data, userTokens) {
    this.oauth2Client.setCredentials(userTokens);
    
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: this.oauth2Client 
    });

    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: title
        }
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;

    if (data && data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        resource: {
          values: data
        }
      });
    }

    return {
      spreadsheetId: spreadsheetId,
      url: \`https://docs.google.com/spreadsheets/d/\${spreadsheetId}/edit\`
    };
  }

  // 获取用户信息
  async getUserInfo(userTokens) {
    this.oauth2Client.setCredentials(userTokens);
    
    const oauth2 = google.oauth2({ 
      version: 'v2', 
      auth: this.oauth2Client 
    });

    const response = await oauth2.userinfo.get();
    return response.data;
  }
}

module.exports = new GoogleService();`;

fs.writeFileSync('backend/services/google-service.js', googleServiceCode);
console.log('✅ Google服务模块创建完成');

// 3. 创建Google OAuth路由
console.log('📝 创建Google OAuth路由...');
const googleAuthRoutesCode = `const express = require('express');
const router = express.Router();
const googleService = require('../services/google-service');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

// 获取Google授权URL
router.get('/auth-url', authenticate, async (req, res, next) => {
  try {
    const authUrl = googleService.getAuthUrl(req.user.id);
    res.json({
      status: 'success',
      data: { auth_url: authUrl }
    });
  } catch (error) {
    next(error);
  }
});

// 处理Google OAuth回调
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.redirect(\`\${process.env.FRONTEND_URL}/auth/error?message=授权失败\`);
    }

    const tokens = await googleService.handleCallback(code);
    const userInfo = await googleService.getUserInfo(tokens);

    // 保存用户的Google令牌到数据库
    await db.query(
      \`INSERT INTO user_google_tokens (user_id, access_token, refresh_token, google_email, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
       access_token = $2, refresh_token = $3, google_email = $4, expires_at = $5, updated_at = CURRENT_TIMESTAMP\`,
      [
        userId,
        tokens.access_token,
        tokens.refresh_token,
        userInfo.email,
        new Date(tokens.expiry_date)
      ]
    );

    res.redirect(\`\${process.env.FRONTEND_URL}/auth/google-success\`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(\`\${process.env.FRONTEND_URL}/auth/error?message=授权处理失败\`);
  }
});

// 检查Google授权状态
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT google_email, expires_at FROM user_google_tokens WHERE user_id = $1',
      [req.user.id]
    );

    const isAuthorized = result.rows.length > 0 && new Date(result.rows[0].expires_at) > new Date();

    res.json({
      status: 'success',
      data: {
        is_authorized: isAuthorized,
        google_email: result.rows[0]?.google_email || null,
        expires_at: result.rows[0]?.expires_at || null
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;`;

fs.writeFileSync('backend/routes/google-auth.routes.js', googleAuthRoutesCode);
console.log('✅ Google OAuth路由创建完成');

// 4. 创建数据库迁移文件
console.log('📝 创建数据库迁移文件...');
const migrationCode = `-- Google集成数据库迁移
-- 创建用户Google令牌表

CREATE TABLE IF NOT EXISTS user_google_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    google_email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON user_google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_expires_at ON user_google_tokens(expires_at);

-- 添加注释
COMMENT ON TABLE user_google_tokens IS '用户Google OAuth令牌存储表';
COMMENT ON COLUMN user_google_tokens.user_id IS '关联的用户ID';
COMMENT ON COLUMN user_google_tokens.access_token IS 'Google访问令牌';
COMMENT ON COLUMN user_google_tokens.refresh_token IS 'Google刷新令牌';
COMMENT ON COLUMN user_google_tokens.google_email IS '用户的Google邮箱';
COMMENT ON COLUMN user_google_tokens.expires_at IS '令牌过期时间';`;

fs.writeFileSync('backend/migrations/002_google_integration.sql', migrationCode);
console.log('✅ 数据库迁移文件创建完成');

// 5. 创建前端Google授权组件
console.log('📝 创建前端Google授权组件...');
const googleAuthButtonCode = `'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface GoogleAuthButtonProps {
  onAuthSuccess?: () => void;
  className?: string;
}

export function GoogleAuthButton({ onAuthSuccess, className }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch(\`\${API_ENDPOINTS.auth.login.replace('/login', '/google')}/auth-url\`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('获取授权链接失败');
      }

      const data = await response.json();
      
      // 在新窗口中打开Google授权页面
      const authWindow = window.open(
        data.data.auth_url,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // 监听授权完成
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          // 检查授权状态
          checkAuthStatus();
        }
      }, 1000);

    } catch (error) {
      console.error('Google授权失败:', error);
      toast.error('Google授权失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(\`\${API_ENDPOINTS.auth.login.replace('/login', '/google')}/status\`, {
        headers: getAuthHeaders(token!),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.is_authorized) {
          toast.success('Google账户授权成功！');
          onAuthSuccess?.();
        }
      }
    } catch (error) {
      console.error('检查授权状态失败:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={\`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 \${className}\`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {isLoading ? '授权中...' : '连接Google账户'}
    </button>
  );
}`;

// 确保components/shared目录存在
if (!fs.existsSync('components/shared')) {
  fs.mkdirSync('components/shared', { recursive: true });
}

fs.writeFileSync('components/shared/google-auth-button.tsx', googleAuthButtonCode);
console.log('✅ Google授权组件创建完成');

// 6. 创建环境变量模板
console.log('📝 创建环境变量模板...');
const envTemplate = `
# Google OAuth配置 (需要从Google Cloud Console获取)
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Google服务账户 (可选)
GOOGLE_SERVICE_ACCOUNT_EMAIL=scoring-system-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_PROJECT_ID=your-project-id

# 应用配置
FRONTEND_URL=http://localhost:3000
`;

fs.appendFileSync('backend/.env.example', envTemplate);
console.log('✅ 环境变量模板已添加到 .env.example');

// 7. 创建设置说明文件
console.log('📝 创建快速设置说明...');
const quickSetupGuide = `# Google集成快速设置指南

## 🎯 下一步操作

### 1. 配置Google Cloud Console
1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 启用以下API：
   - Google Drive API
   - Google Sheets API
   - Google OAuth2 API

### 2. 创建OAuth凭据
1. 转到"API和服务" > "凭据"
2. 创建OAuth 2.0客户端ID
3. 添加重定向URI：http://localhost:5000/api/auth/google/callback
4. 下载凭据JSON文件

### 3. 更新环境变量
复制 backend/.env.example 到 backend/.env，并填入：
\`\`\`
GOOGLE_CLIENT_ID=你的客户端ID
GOOGLE_CLIENT_SECRET=你的客户端密钥
\`\`\`

### 4. 运行数据库迁移
\`\`\`bash
cd backend
psql -U postgres -d scoring -f migrations/002_google_integration.sql
\`\`\`

### 5. 更新路由配置
在 backend/index.js 中添加：
\`\`\`javascript
const googleAuthRoutes = require('./routes/google-auth.routes');
app.use('/api/auth/google', googleAuthRoutes);
\`\`\`

### 6. 重启服务器
\`\`\`bash
npm run dev
\`\`\`

## 🧪 测试
1. 登录评分系统
2. 进入评分汇总页面
3. 点击"连接Google账户"按钮
4. 完成授权流程
5. 测试Excel导出功能

## 📚 详细文档
查看 GOOGLE_WORKSPACE_INTEGRATION_GUIDE.md 获取完整教程。
`;

fs.writeFileSync('GOOGLE_INTEGRATION_QUICK_SETUP.md', quickSetupGuide);
console.log('✅ 快速设置指南创建完成');

// 8. 创建测试脚本
console.log('📝 创建Google集成测试脚本...');
const testScript = `// Google集成功能测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testGoogleIntegration() {
  console.log('🧪 测试Google集成功能...\\n');

  try {
    // 1. 登录获取token
    console.log('1. 登录系统...');
    const loginResponse = await axios.post(\`\${API_BASE}/auth/login\`, {
      email: 'judge@test.com',
      password: 'judge123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 检查Google授权状态
    console.log('2. 检查Google授权状态...');
    const statusResponse = await axios.get(\`\${API_BASE}/auth/google/status\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    
    console.log('Google授权状态:', statusResponse.data.data);

    // 3. 获取授权URL
    console.log('3. 获取Google授权URL...');
    const authUrlResponse = await axios.get(\`\${API_BASE}/auth/google/auth-url\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    
    console.log('✅ 授权URL获取成功');
    console.log('授权链接:', authUrlResponse.data.data.auth_url);

    console.log('\\n🎉 Google集成基础功能测试通过！');
    console.log('\\n📝 下一步：');
    console.log('1. 访问上面的授权链接完成Google授权');
    console.log('2. 测试Excel导出功能');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示：请确保后端服务器正在运行 (npm run dev)');
    }
  }
}

testGoogleIntegration();`;

fs.writeFileSync('backend/test-google-integration.js', testScript);
console.log('✅ Google集成测试脚本创建完成');

console.log('\n🎉 Google Workspace集成设置完成！\n');

console.log('📋 已创建的文件：');
console.log('  ✓ backend/services/google-service.js - Google API服务');
console.log('  ✓ backend/routes/google-auth.routes.js - OAuth路由');
console.log('  ✓ backend/migrations/002_google_integration.sql - 数据库迁移');
console.log('  ✓ components/shared/google-auth-button.tsx - 前端授权组件');
console.log('  ✓ backend/test-google-integration.js - 测试脚本');
console.log('  ✓ GOOGLE_INTEGRATION_QUICK_SETUP.md - 快速设置指南');
console.log('  ✓ GOOGLE_WORKSPACE_INTEGRATION_GUIDE.md - 完整教程');

console.log('\n🚀 下一步操作：');
console.log('1. 查看 GOOGLE_INTEGRATION_QUICK_SETUP.md 完成Google Cloud配置');
console.log('2. 运行数据库迁移：psql -U postgres -d scoring -f backend/migrations/002_google_integration.sql');
console.log('3. 更新 backend/.env 文件添加Google凭据');
console.log('4. 在 backend/index.js 中添加Google路由');
console.log('5. 重启服务器测试功能');

console.log('\n📚 详细教程请查看：GOOGLE_WORKSPACE_INTEGRATION_GUIDE.md');