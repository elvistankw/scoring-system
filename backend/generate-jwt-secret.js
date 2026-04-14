#!/usr/bin/env node

/**
 * JWT密钥生成工具
 * 生成安全的JWT密钥并更新环境变量
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 JWT密钥生成工具\n');

// 生成安全的JWT密钥
function generateSecureJWTSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// 更新.env文件
function updateEnvFile(newSecret) {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env文件不存在，请先创建');
    return false;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 检查是否已有JWT_SECRET
    if (envContent.includes('JWT_SECRET=')) {
      // 替换现有的JWT_SECRET
      envContent = envContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET=${newSecret}`
      );
    } else {
      // 添加新的JWT_SECRET
      envContent += `\n# JWT Configuration\nJWT_SECRET=${newSecret}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    return true;
  } catch (error) {
    console.error('❌ 更新.env文件失败:', error.message);
    return false;
  }
}

// 主函数
function main() {
  try {
    // 生成新密钥
    const newSecret = generateSecureJWTSecret(32);
    
    console.log('✅ 生成新的JWT密钥:');
    console.log(`JWT_SECRET=${newSecret}\n`);
    
    console.log('📊 密钥信息:');
    console.log(`  长度: ${newSecret.length} 字符`);
    console.log(`  字节数: 32 bytes (256 bits)`);
    console.log(`  编码: Base64`);
    console.log(`  强度: 高安全性\n`);
    
    // 询问是否更新.env文件
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('是否要自动更新.env文件？(y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        if (updateEnvFile(newSecret)) {
          console.log('✅ .env文件已更新');
          console.log('🔄 请重启服务器以应用新配置');
        }
      } else {
        console.log('📝 请手动将上述JWT_SECRET添加到.env文件中');
      }
      
      console.log('\n🔒 安全提醒:');
      console.log('  1. 不要将JWT密钥提交到版本控制系统');
      console.log('  2. 生产环境使用不同的密钥');
      console.log('  3. 定期轮换JWT密钥');
      console.log('  4. 确保密钥长度至少32字符');
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ 生成JWT密钥失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureJWTSecret,
  updateEnvFile
};