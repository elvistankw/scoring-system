#!/usr/bin/env node

/**
 * Redis安装助手脚本
 * 帮助用户在不同平台上安装和配置Redis
 */

const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Redis安装助手\n');

function detectPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  
  console.log(`检测到系统: ${platform} (${arch})\n`);
  
  return platform;
}

function showDockerInstructions() {
  console.log('📦 Docker安装方式 (推荐):\n');
  
  console.log('1. 拉取Redis镜像:');
  console.log('   docker pull redis:latest\n');
  
  console.log('2. 运行Redis容器:');
  console.log('   docker run --name redis-scoring -p 6379:6379 -d redis:latest\n');
  
  console.log('3. 测试连接:');
  console.log('   docker exec -it redis-scoring redis-cli ping\n');
  
  console.log('4. 查看容器状态:');
  console.log('   docker ps\n');
  
  console.log('5. 停止容器:');
  console.log('   docker stop redis-scoring\n');
  
  console.log('6. 启动容器:');
  console.log('   docker start redis-scoring\n');
}

function showWindowsInstructions() {
  console.log('🪟 Windows安装方式:\n');
  
  console.log('方式1: WSL2 + Ubuntu (推荐)');
  console.log('1. 安装WSL2:');
  console.log('   wsl --install');
  console.log('2. 在WSL2中安装Redis:');
  console.log('   sudo apt update');
  console.log('   sudo apt install redis-server');
  console.log('3. 启动Redis:');
  console.log('   sudo service redis-server start');
  console.log('4. 测试连接:');
  console.log('   redis-cli ping\n');
  
  console.log('方式2: Chocolatey');
  console.log('1. 安装Chocolatey (如果未安装):');
  console.log('   访问 https://chocolatey.org/install');
  console.log('2. 安装Redis:');
  console.log('   choco install redis-64');
  console.log('3. 启动Redis:');
  console.log('   redis-server\n');
  
  console.log('方式3: 手动安装');
  console.log('1. 下载Redis for Windows:');
  console.log('   https://github.com/microsoftarchive/redis/releases');
  console.log('2. 解压并运行redis-server.exe\n');
}

function showMacInstructions() {
  console.log('🍎 macOS安装方式:\n');
  
  console.log('使用Homebrew (推荐):');
  console.log('1. 安装Homebrew (如果未安装):');
  console.log('   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
  console.log('2. 安装Redis:');
  console.log('   brew install redis');
  console.log('3. 启动Redis服务:');
  console.log('   brew services start redis');
  console.log('4. 测试连接:');
  console.log('   redis-cli ping');
  console.log('5. 停止Redis服务:');
  console.log('   brew services stop redis\n');
}

function showLinuxInstructions() {
  console.log('🐧 Linux安装方式:\n');
  
  console.log('Ubuntu/Debian:');
  console.log('1. 更新包列表:');
  console.log('   sudo apt update');
  console.log('2. 安装Redis:');
  console.log('   sudo apt install redis-server');
  console.log('3. 启动服务:');
  console.log('   sudo systemctl start redis');
  console.log('   sudo systemctl enable redis');
  console.log('4. 测试连接:');
  console.log('   redis-cli ping\n');
  
  console.log('CentOS/RHEL/Fedora:');
  console.log('1. 安装Redis:');
  console.log('   sudo yum install redis  # CentOS 7');
  console.log('   sudo dnf install redis  # CentOS 8+/Fedora');
  console.log('2. 启动服务:');
  console.log('   sudo systemctl start redis');
  console.log('   sudo systemctl enable redis');
  console.log('3. 测试连接:');
  console.log('   redis-cli ping\n');
}

function showTestInstructions() {
  console.log('🧪 安装完成后测试:\n');
  
  console.log('1. 测试Redis连接:');
  console.log('   redis-cli ping');
  console.log('   (应该返回 PONG)\n');
  
  console.log('2. 测试评分系统Redis配置:');
  console.log('   cd backend');
  console.log('   node test-redis-config.js\n');
  
  console.log('3. 启动评分系统:');
  console.log('   npm start\n');
}

function showConfigurationTips() {
  console.log('⚙️ 配置建议:\n');
  
  console.log('1. 生产环境配置:');
  console.log('   - 设置Redis密码');
  console.log('   - 配置持久化');
  console.log('   - 限制内存使用');
  console.log('   - 启用日志记录\n');
  
  console.log('2. 性能优化:');
  console.log('   - 调整maxmemory设置');
  console.log('   - 配置合适的eviction策略');
  console.log('   - 监控内存使用情况\n');
  
  console.log('3. 安全设置:');
  console.log('   - 绑定到特定IP地址');
  console.log('   - 禁用危险命令');
  console.log('   - 使用防火墙保护\n');
}

async function main() {
  const platform = detectPlatform();
  
  console.log('请选择安装方式:\n');
  console.log('1. Docker (推荐，跨平台)');
  console.log('2. 本地安装 (根据系统平台)');
  console.log('3. 查看配置建议');
  console.log('4. 退出\n');
  
  rl.question('请输入选项 (1-4): ', (answer) => {
    console.log('');
    
    switch (answer) {
      case '1':
        showDockerInstructions();
        break;
      case '2':
        switch (platform) {
          case 'win32':
            showWindowsInstructions();
            break;
          case 'darwin':
            showMacInstructions();
            break;
          case 'linux':
            showLinuxInstructions();
            break;
          default:
            console.log('❌ 不支持的平台:', platform);
            console.log('建议使用Docker安装方式');
        }
        break;
      case '3':
        showConfigurationTips();
        break;
      case '4':
        console.log('👋 再见！');
        rl.close();
        return;
      default:
        console.log('❌ 无效选项，请重新运行脚本');
    }
    
    showTestInstructions();
    
    console.log('📚 更多信息:');
    console.log('- Redis官方文档: https://redis.io/documentation');
    console.log('- Docker Hub Redis: https://hub.docker.com/_/redis');
    console.log('- 评分系统Redis配置: REDIS_SETUP_GUIDE.md\n');
    
    rl.close();
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  detectPlatform,
  showDockerInstructions,
  showWindowsInstructions,
  showMacInstructions,
  showLinuxInstructions
};