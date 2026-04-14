// 加载环境变量
require('dotenv').config();

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

    // 6. 测试令牌信息获取
    console.log('6. 测试令牌信息获取...');
    
    const tokenInfo = jwtUtils.getTokenInfo(accessToken);
    if (tokenInfo) {
      console.log('✅ 令牌信息获取成功');
      console.log(`  发行时间: ${tokenInfo.issuedAt}`);
      console.log(`  过期时间: ${tokenInfo.expiresAt}`);
      console.log(`  是否过期: ${tokenInfo.isExpired}`);
    }

    // 7. 测试无效令牌
    console.log('7. 测试无效令牌处理...');
    
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

    // 8. 测试令牌类型验证
    console.log('8. 测试令牌类型验证...');
    
    try {
      await jwtUtils.verifyToken(refreshToken, 'access'); // 用refresh令牌验证access
      throw new Error('应该抛出错误');
    } catch (error) {
      if (error.message.includes('Invalid token type')) {
        console.log('✅ 令牌类型验证正确');
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
    console.log(`  受众: ${process.env.JWT_AUDIENCE || 'scoring-users'}`);

    console.log('\n🔒 安全建议:');
    console.log('  ✓ 使用强密钥 (32+ 字符)');
    console.log('  ✓ 设置合理的过期时间');
    console.log('  ✓ 使用HTTPS传输令牌');
    console.log('  ✓ 定期轮换JWT密钥');
    console.log('  ✓ 不在客户端存储敏感信息');

  } catch (error) {
    console.error('❌ JWT配置测试失败:', error.message);
    
    console.log('\n🔧 故障排除建议:');
    if (error.message.includes('JWT_SECRET')) {
      console.log('  1. 确保.env文件中设置了JWT_SECRET');
      console.log('  2. 运行 node generate-jwt-secret.js 生成新密钥');
    }
    if (error.message.includes('Invalid token')) {
      console.log('  1. 检查JWT_SECRET是否正确');
      console.log('  2. 确保算法设置正确');
    }
    
    process.exit(1);
  }
}

testJWTConfiguration();