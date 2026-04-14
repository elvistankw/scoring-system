#!/usr/bin/env node

/**
 * Redis密码配置脚本（跨平台）
 * 用于生产环境配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Redis密码配置脚本');
console.log('====================\n');

function generateSecurePassword() {
  // 生成32位安全密码
  return crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    console.log('选择密码设置方式:');
    console.log('1. 自动生成安全密码（推荐）');
    console.log('2. 手动输入密码');
    console.log('3. 取消（保持无密码状态）\n');
    
    const choice = await question('请选择 (1/2/3): ');
    
    let redisPassword;
    
    if (choice === '1') {
      redisPassword = generateSecurePassword();
      console.log('\n✅ 已生成安全密码:', redisPassword);
      console.log('⚠️  请妥善保存此密码！\n');
    } else if (choice === '2') {
      redisPassword = await question('\n请输入Redis密码: ');
      if (!redisPassword || redisPassword.trim() === '') {
        console.log('❌ 密码不能为空');
        process.exit(1);
      }
    } else {
      console.log('✅ 已取消，保持当前配置');
      process.exit(0);
    }
    
    console.log('\n2. 停止并删除现有Redis容器...');
    try {
      execSync('docker stop redis-scoring', { stdio: 'ignore' });
      execSync('docker rm redis-scoring', { stdio: 'ignore' });
      console.log('✅ 现有容器已删除');
    } catch (error) {
      console.log('⚠️  未找到现有容器（这是正常的）');
    }
    
    console.log('\n3. 启动带密码的Redis容器...');
    try {
      execSync(
        `docker run --name redis-scoring -p 6379:6379 -d redis:latest redis-server --requirepass "${redisPassword}"`,
        { stdio: 'inherit' }
      );
      console.log('✅ Redis容器已启动');
    } catch (error) {
      console.error('❌ Redis容器启动失败:', error.message);
      process.exit(1);
    }
    
    console.log('\n4. 更新.env文件...');
    
    // 备份原文件
    const envPath = './backend/.env';
    const backupPath = './backend/.env.backup';
    
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, backupPath);
      console.log('✅ 原配置已备份到', backupPath);
    }
    
    // 读取并更新.env文件
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/^REDIS_PASSWORD=.*/m, `REDIS_PASSWORD=${redisPassword}`);
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env文件已更新');
    
    console.log('\n5. 测试连接...');
    
    // 等待容器完全启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const result = execSync(
        `docker exec redis-scoring redis-cli -a "${redisPassword}" ping`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      
      if (result.trim() === 'PONG') {
        console.log('✅ Redis密码配置成功！\n');
        
        console.log('📋 配置摘要:');
        console.log('  容器名称: redis-scoring');
        console.log('  端口: 6379');
        console.log('  密码: ' + redisPassword);
        console.log('  密码长度:', redisPassword.length, '字符\n');
        
        console.log('⚠️  重要提示:');
        console.log('  1. 密码已保存到 backend/.env');
        console.log('  2. 原配置已备份到 backend/.env.backup');
        console.log('  3. 请勿将.env文件提交到Git');
        console.log('  4. 生产环境请使用环境变量或密钥管理服务\n');
        
        console.log('🧪 测试新配置:');
        console.log('  cd backend && node verify-redis-final.js\n');
        
        console.log('🔧 Redis CLI连接命令:');
        console.log(`  docker exec -it redis-scoring redis-cli -a "${redisPassword}"\n`);
        
      } else {
        console.log('❌ 连接测试失败');
      }
    } catch (error) {
      console.error('❌ 连接测试失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 配置过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };