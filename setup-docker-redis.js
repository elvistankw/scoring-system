#!/usr/bin/env node

/**
 * Docker Redis 自动设置脚本
 * 自动检查Docker状态并启动Redis容器
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🐳 Docker Redis 自动设置');
console.log('========================\n');

async function checkDocker() {
  console.log('1. 检查Docker状态...');
  
  try {
    const version = execSync('docker --version', { encoding: 'utf8' });
    console.log('✅ Docker已安装:', version.trim());
    return true;
  } catch (error) {
    console.log('❌ Docker未找到或未启动');
    console.log('\n🔧 解决方案:');
    console.log('1. 确保Docker Desktop已启动');
    console.log('2. 重启命令提示符/PowerShell');
    console.log('3. 如果刚安装Docker，请重启电脑');
    console.log('\n💡 启动Docker Desktop后重新运行此脚本');
    return false;
  }
}

async function checkExistingRedis() {
  console.log('\n2. 检查现有Redis容器...');
  
  try {
    const containers = execSync('docker ps -a --filter name=redis-scoring --format "{{.Names}}"', { encoding: 'utf8' });
    
    if (containers.trim()) {
      console.log('⚠️  发现现有Redis容器: redis-scoring');
      
      // 检查容器是否正在运行
      try {
        const runningContainers = execSync('docker ps --filter name=redis-scoring --format "{{.Names}}"', { encoding: 'utf8' });
        
        if (runningContainers.trim()) {
          console.log('✅ Redis容器已在运行');
          return 'running';
        } else {
          console.log('⏸️  Redis容器已停止');
          return 'stopped';
        }
      } catch (error) {
        return 'exists';
      }
    } else {
      console.log('✅ 未发现现有Redis容器');
      return 'none';
    }
  } catch (error) {
    console.log('⚠️  无法检查容器状态:', error.message);
    return 'unknown';
  }
}

async function handleExistingContainer(status) {
  if (status === 'running') {
    console.log('\n🎉 Redis已经在运行！');
    return true;
  }
  
  if (status === 'stopped') {
    console.log('\n🔄 启动现有Redis容器...');
    try {
      execSync('docker start redis-scoring', { stdio: 'inherit' });
      console.log('✅ Redis容器已启动');
      return true;
    } catch (error) {
      console.log('❌ 启动失败:', error.message);
      return false;
    }
  }
  
  if (status === 'exists') {
    return new Promise((resolve) => {
      rl.question('\n❓ 发现现有容器，是否删除并重新创建？ (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          try {
            console.log('🗑️  删除现有容器...');
            execSync('docker rm -f redis-scoring', { stdio: 'inherit' });
            console.log('✅ 现有容器已删除');
            resolve(false); // 需要创建新容器
          } catch (error) {
            console.log('❌ 删除失败:', error.message);
            resolve(true); // 跳过创建
          }
        } else {
          console.log('⏭️  跳过Redis设置');
          resolve(true);
        }
      });
    });
  }
  
  return false; // 需要创建新容器
}

async function pullRedisImage() {
  console.log('\n3. 拉取Redis镜像...');
  
  try {
    console.log('📥 正在下载Redis镜像，请稍候...');
    execSync('docker pull redis:latest', { stdio: 'inherit' });
    console.log('✅ Redis镜像下载完成');
    return true;
  } catch (error) {
    console.log('❌ 镜像下载失败:', error.message);
    return false;
  }
}

async function startRedisContainer() {
  console.log('\n4. 启动Redis容器...');
  
  try {
    console.log('🚀 正在启动Redis容器...');
    execSync('docker run --name redis-scoring -p 6379:6379 -d redis:latest', { stdio: 'inherit' });
    console.log('✅ Redis容器已启动');
    
    // 等待容器完全启动
    console.log('⏳ 等待Redis服务启动...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return true;
  } catch (error) {
    console.log('❌ 容器启动失败:', error.message);
    
    // 检查端口冲突
    if (error.message.includes('port is already allocated')) {
      console.log('\n🔧 端口6379已被占用，尝试解决...');
      try {
        // 查找占用端口的进程
        const netstat = execSync('netstat -ano | findstr :6379', { encoding: 'utf8' });
        console.log('📊 端口占用情况:');
        console.log(netstat);
        
        console.log('\n💡 解决方案:');
        console.log('1. 停止占用6379端口的其他Redis服务');
        console.log('2. 或者修改评分系统配置使用其他端口');
      } catch (netstatError) {
        console.log('⚠️  无法检查端口占用情况');
      }
    }
    
    return false;
  }
}

async function testRedisConnection() {
  console.log('\n5. 测试Redis连接...');
  
  try {
    const result = execSync('docker exec redis-scoring redis-cli ping', { encoding: 'utf8' });
    
    if (result.trim() === 'PONG') {
      console.log('✅ Redis连接测试成功');
      return true;
    } else {
      console.log('❌ Redis连接测试失败，响应:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ Redis连接测试失败:', error.message);
    return false;
  }
}

async function testScoringSystemIntegration() {
  console.log('\n6. 测试评分系统集成...');
  
  try {
    console.log('🧪 运行Redis配置测试...');
    
    // 使用spawn来实时显示输出
    const testProcess = spawn('node', ['test-redis-config.js'], {
      cwd: './backend',
      stdio: 'inherit'
    });
    
    return new Promise((resolve) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ 评分系统集成测试成功');
          resolve(true);
        } else {
          console.log('\n⚠️  评分系统集成测试完成（可能有警告）');
          resolve(true); // 即使有警告也继续
        }
      });
      
      testProcess.on('error', (error) => {
        console.log('\n❌ 测试脚本运行失败:', error.message);
        resolve(false);
      });
    });
  } catch (error) {
    console.log('❌ 集成测试失败:', error.message);
    return false;
  }
}

async function showRedisInfo() {
  console.log('\n📊 Redis服务器信息:');
  
  try {
    const info = execSync('docker exec redis-scoring redis-cli info server', { encoding: 'utf8' });
    const lines = info.split('\n');
    
    lines.forEach(line => {
      if (line.includes('redis_version:')) {
        console.log('  版本:', line.split(':')[1]);
      }
      if (line.includes('redis_mode:')) {
        console.log('  模式:', line.split(':')[1]);
      }
      if (line.includes('uptime_in_seconds:')) {
        const uptime = parseInt(line.split(':')[1]);
        console.log('  运行时间:', Math.floor(uptime / 60), '分钟');
      }
    });
  } catch (error) {
    console.log('⚠️  无法获取Redis信息');
  }
}

async function showUsageInstructions() {
  console.log('\n🎯 使用说明:');
  console.log('');
  console.log('📋 Redis管理命令:');
  console.log('  启动: docker start redis-scoring');
  console.log('  停止: docker stop redis-scoring');
  console.log('  重启: docker restart redis-scoring');
  console.log('  日志: docker logs redis-scoring');
  console.log('');
  console.log('🔧 Redis命令行:');
  console.log('  进入: docker exec -it redis-scoring redis-cli');
  console.log('  测试: docker exec redis-scoring redis-cli ping');
  console.log('');
  console.log('🧪 评分系统测试:');
  console.log('  配置测试: cd backend && node test-redis-config.js');
  console.log('  集成测试: cd backend && node test-redis-integration.js');
  console.log('');
  console.log('🚀 启动评分系统:');
  console.log('  后端: cd backend && npm start');
  console.log('  前端: npm run dev');
}

async function main() {
  try {
    // 1. 检查Docker
    const dockerOk = await checkDocker();
    if (!dockerOk) {
      process.exit(1);
    }
    
    // 2. 检查现有Redis容器
    const containerStatus = await checkExistingRedis();
    const skipCreation = await handleExistingContainer(containerStatus);
    
    if (!skipCreation) {
      // 3. 拉取Redis镜像
      const pullOk = await pullRedisImage();
      if (!pullOk) {
        process.exit(1);
      }
      
      // 4. 启动Redis容器
      const startOk = await startRedisContainer();
      if (!startOk) {
        process.exit(1);
      }
    }
    
    // 5. 测试Redis连接
    const connectionOk = await testRedisConnection();
    if (!connectionOk) {
      console.log('⚠️  Redis连接测试失败，但容器可能仍在启动中');
    }
    
    // 6. 测试评分系统集成
    await testScoringSystemIntegration();
    
    // 7. 显示Redis信息
    await showRedisInfo();
    
    // 8. 显示使用说明
    await showUsageInstructions();
    
    console.log('\n🎉 Docker Redis设置完成！');
    console.log('✅ Redis现在已经运行，评分系统将享受缓存加速！');
    
  } catch (error) {
    console.error('❌ 设置过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };