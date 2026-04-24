// @ts-nocheck
/**
 * 页面卡死自动诊断工具
 * Auto-diagnosis Tool for Page Freeze Issues
 * 
 * 使用方法:
 * node diagnose-page-freeze.js [url]
 * 
 * 示例:
 * node diagnose-page-freeze.js http://localhost:3000
 */

const http = require('http');
const https = require('https');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = 10000;

    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          headers: res.headers,
          size: data.length,
          time: Date.now()
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function diagnose(url = 'http://localhost:3000') {
  log('\n🔍 页面卡死诊断工具 / Page Freeze Diagnosis Tool\n', 'cyan');
  log(`目标 URL: ${url}\n`, 'blue');

  const issues = [];
  const warnings = [];
  const suggestions = [];

  // 1. 检查前端服务器
  log('1️⃣  检查前端服务器...', 'yellow');
  const frontendResult = await checkEndpoint(url);
  
  if (!frontendResult.success) {
    issues.push('前端服务器无法访问');
    log(`   ❌ 前端服务器无法访问: ${frontendResult.error}`, 'red');
    suggestions.push('运行: npm run dev');
  } else {
    log(`   ✅ 前端服务器正常 (状态码 ${frontendResult.status})`, 'green');
    if (frontendResult.status !== 200) {
      warnings.push(`前端返回非200状态码: ${frontendResult.status}`);
    }
  }

  // 2. 检查后端 API
  log('\n2️⃣  检查后端 API...', 'yellow');
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const apiResult = await checkEndpoint(`${backendUrl}/api/competitions/public`);
  
  if (!apiResult.success) {
    issues.push('后端 API 无法访问');
    log(`   ❌ 后端 API 无法访问: ${apiResult.error}`, 'red');
    suggestions.push('运行: cd backend && npm start');
  } else {
    log(`   ✅ 后端 API 正常 (状态码 ${apiResult.status})`, 'green');
  }

  // 3. 检查常见问题
  log('\n3️⃣  检查常见问题...', 'yellow');

  // 检查 .next 目录
  const fs = require('fs');
  const path = require('path');
  const nextDir = path.join(process.cwd(), '.next');
  
  if (fs.existsSync(nextDir)) {
    const stats = fs.statSync(nextDir);
    const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    
    if (ageInHours > 24) {
      warnings.push('.next 目录超过24小时未更新');
      log('   ⚠️  .next 目录可能过期', 'yellow');
      suggestions.push('运行: rm -rf .next && npm run dev');
    } else {
      log('   ✅ .next 目录正常', 'green');
    }
  } else {
    warnings.push('.next 目录不存在');
    log('   ⚠️  .next 目录不存在', 'yellow');
    suggestions.push('运行: npm run dev');
  }

  // 检查 node_modules
  const nodeModulesDir = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    issues.push('node_modules 目录不存在');
    log('   ❌ node_modules 目录不存在', 'red');
    suggestions.push('运行: npm install');
  } else {
    log('   ✅ node_modules 目录存在', 'green');
  }

  // 检查环境变量
  log('\n4️⃣  检查环境变量...', 'yellow');
  const envFile = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envFile)) {
    warnings.push('.env.local 文件不存在');
    log('   ⚠️  .env.local 文件不存在', 'yellow');
    suggestions.push('创建 .env.local 文件并配置 NEXT_PUBLIC_API_URL');
  } else {
    log('   ✅ .env.local 文件存在', 'green');
    
    // 读取并检查关键配置
    const envContent = fs.readFileSync(envFile, 'utf8');
    if (!envContent.includes('NEXT_PUBLIC_API_URL')) {
      warnings.push('.env.local 缺少 NEXT_PUBLIC_API_URL');
      log('   ⚠️  缺少 NEXT_PUBLIC_API_URL 配置', 'yellow');
    }
  }

  // 5. 检查端口占用
  log('\n5️⃣  检查端口占用...', 'yellow');
  
  const checkPort = (port) => {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.once('error', () => resolve(true)); // 端口被占用
      server.once('listening', () => {
        server.close();
        resolve(false); // 端口空闲
      });
      server.listen(port);
    });
  };

  const port3000InUse = await checkPort(3000);
  const port5000InUse = await checkPort(5000);

  if (port3000InUse) {
    log('   ✅ 端口 3000 正在使用 (前端)', 'green');
  } else {
    warnings.push('端口 3000 未被使用');
    log('   ⚠️  端口 3000 未被使用', 'yellow');
    suggestions.push('前端服务器可能未运行');
  }

  if (port5000InUse) {
    log('   ✅ 端口 5000 正在使用 (后端)', 'green');
  } else {
    warnings.push('端口 5000 未被使用');
    log('   ⚠️  端口 5000 未被使用', 'yellow');
    suggestions.push('后端服务器可能未运行');
  }

  // 6. 生成报告
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 诊断报告 / Diagnosis Report', 'cyan');
  log('='.repeat(60), 'cyan');

  if (issues.length === 0 && warnings.length === 0) {
    log('\n✅ 未发现明显问题！', 'green');
    log('\n如果页面仍然卡死，请尝试:', 'yellow');
    log(' 1. 硬刷新浏览器 (Ctrl+Shift+R)', 'yellow');
    log(' 2. 清除浏览器缓存', 'yellow');
    log(' 3. 检查浏览器控制台错误', 'yellow');
    log(' 4. 查看 PAGE_FREEZE_AUTO_FIX_GUIDE.md', 'yellow');
  } else {
    if (issues.length > 0) {
      log('\n❌ 发现严重问题:', 'red');
      issues.forEach((issue, i) => log(`   ${i + 1}. ${issue}`, 'red'));
    }

    if (warnings.length > 0) {
      log('\n⚠️  发现警告:', 'yellow');
      warnings.forEach((warning, i) => log(`   ${i + 1}. ${warning}`, 'yellow'));
    }

    if (suggestions.length > 0) {
      log('\n💡 建议的修复步骤:', 'cyan');
      suggestions.forEach((suggestion, i) => log(`   ${i + 1}. ${suggestion}`, 'cyan'));
    }
  }

  log('\n📚 更多信息请查看: PAGE_FREEZE_AUTO_FIX_GUIDE.md\n', 'blue');
}

// 运行诊断
const url = process.argv[2] || 'http://localhost:3000';
diagnose(url).catch(console.error);
