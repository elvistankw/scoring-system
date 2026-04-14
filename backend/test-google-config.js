#!/usr/bin/env node
/**
 * Google API 配置测试脚本
 * 验证 Google Drive 和 Sheets API 是否正确配置
 */

require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

console.log('🔍 Google API 配置检查\n');

// 检查环境变量
console.log('📋 环境变量检查:');
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'FRONTEND_URL'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.log('\n❌ 缺少必要的环境变量！');
  console.log('请在 backend/.env 中配置所有必需的变量。');
  process.exit(1);
}

console.log('\n✅ 所有环境变量已配置\n');

// 测试 OAuth2 客户端初始化
console.log('🔧 测试 OAuth2 客户端初始化...');
try {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  console.log('✅ OAuth2 客户端初始化成功\n');

  // 生成测试授权 URL
  console.log('🔗 生成测试授权 URL...');
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: 'test-user-123',
    prompt: 'consent'
  });

  console.log('✅ 授权 URL 生成成功');
  console.log('\n📝 测试授权 URL:');
  console.log(authUrl);
  console.log('\n💡 提示：复制上面的 URL 到浏览器中测试授权流程\n');

} catch (error) {
  console.error('❌ OAuth2 客户端初始化失败:', error.message);
  process.exit(1);
}

// 检查 Google API 库
console.log('📚 检查 Google API 库...');
try {
  const drive = google.drive({ version: 'v3' });
  const sheets = google.sheets({ version: 'v4' });
  console.log('✅ Google Drive API 库加载成功');
  console.log('✅ Google Sheets API 库加载成功\n');
} catch (error) {
  console.error('❌ Google API 库加载失败:', error.message);
  process.exit(1);
}

// 配置建议
console.log('📋 下一步操作:\n');
console.log('1. 访问 Google Cloud Console:');
console.log('   https://console.cloud.google.com/\n');

console.log('2. 确保已启用以下 API:');
console.log('   ✓ Google Drive API');
console.log('   ✓ Google Sheets API');
console.log('   ✓ Google OAuth2 API\n');

console.log('3. 配置 OAuth 同意屏幕并添加范围:');
console.log('   ✓ https://www.googleapis.com/auth/drive.file');
console.log('   ✓ https://www.googleapis.com/auth/spreadsheets');
console.log('   ✓ https://www.googleapis.com/auth/userinfo.email\n');

console.log('4. 验证 OAuth 客户端重定向 URI:');
console.log(`   ✓ ${process.env.GOOGLE_REDIRECT_URI}\n`);

console.log('5. 重启后端服务器:');
console.log('   cd backend && npm start\n');

console.log('6. 用户需要在系统中完成 Google 账户授权\n');

console.log('✅ 配置检查完成！');
