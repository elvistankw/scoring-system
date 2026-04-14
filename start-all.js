#!/usr/bin/env node

/**
 * 启动前后端服务器
 * 同时启动Next.js前端和Express后端
 * 
 * 使用方法:
 *   npm run start-all        # 开发模式（默认）
 *   npm run start-all:prod   # 生产模式
 */

const { spawn } = require('child_process');
const path = require('path');

// 检查是否为生产模式
const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const mode = isProduction ? '生产' : '开发';

console.log(`🚀 启动评分系统 (${mode}模式)...\n`);

// 根据模式选择命令
const backendCommand = isProduction ? 'start' : 'dev';
const frontendCommand = isProduction ? 'start' : 'dev';

// 启动后端服务器
console.log(`1. 启动后端服务器 (端口 5000) - ${mode}模式...`);
const backend = spawn('npm', ['run', backendCommand], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: isProduction ? 'production' : 'development' }
});

backend.on('error', (error) => {
  console.error('❌ 后端启动失败:', error.message);
});

// 等待2秒后启动前端
setTimeout(() => {
  console.log(`\n2. 启动前端服务器 (端口 3000) - ${mode}模式...`);
  const frontend = spawn('npm', ['run', frontendCommand], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: isProduction ? 'production' : 'development' }
  });

  frontend.on('error', (error) => {
    console.error('❌ 前端启动失败:', error.message);
  });
}, 2000);

// 处理退出信号
process.on('SIGINT', () => {
  console.log('\n\n🛑 正在关闭服务器...');
  backend.kill();
  process.exit(0);
});

console.log('\n📋 服务器信息:');
console.log(`  模式: ${mode}`);
console.log('  前端: http://localhost:3000');
console.log('  后端: http://localhost:5000');
console.log('  后端健康检查: http://localhost:5000/health');
console.log('\n💡 提示:');
console.log('  - 按 Ctrl+C 停止所有服务器');
console.log(`  - 当前运行在${mode}模式`);
if (!isProduction) {
  console.log('  - 开发模式支持热重载');
  console.log('  - 使用 npm run start-all:prod 启动生产模式');
}
console.log('');