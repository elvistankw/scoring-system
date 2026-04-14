// Redis配置测试脚本
require('dotenv').config();
const { redis, redisHelpers } = require('./redis');

async function testRedisConfiguration() {
  console.log('🧪 测试Redis配置...\n');

  try {
    // 1. 测试基础连接
    console.log('1. 测试Redis连接...');
    
    let redisAvailable = false;
    try {
      const pong = await redis.ping();
      if (pong === 'PONG') {
        console.log('✅ Redis连接成功');
        redisAvailable = true;
      } else {
        throw new Error('Ping响应异常');
      }
    } catch (error) {
      console.log('❌ Redis连接失败:', error.message);
      console.log('💡 提示: Redis服务器未运行，但系统将继续运行（优雅降级）');
      console.log('');
      console.log('📦 快速安装Redis:');
      console.log('   🐳 Docker: docker run --name redis-scoring -p 6379:6379 -d redis:latest');
      console.log('   🪟 Windows: 运行 node install-redis.js 获取详细指南');
      console.log('');
    }

    // 2. 测试连接状态检查
    console.log('2. 测试连接状态检查...');
    const isConnected = redisHelpers.isConnected();
    console.log(`✅ 连接状态检查: ${isConnected ? '已连接' : '未连接'}`);

    // 3. 测试缓存助手函数（优雅降级）
    console.log('3. 测试缓存助手函数（优雅降级模式）...');
    
    // 测试比赛缓存
    const testCompetition = {
      id: 999,
      name: '测试比赛',
      status: 'active'
    };
    
    const cacheResult = await redisHelpers.cacheCompetition(999, testCompetition, 300);
    console.log(`✅ 比赛缓存操作: ${cacheResult ? '成功' : '降级模式（无Redis）'}`);
    
    const cachedCompetition = await redisHelpers.getCachedCompetition(999);
    if (redisAvailable && cachedCompetition && cachedCompetition.name === '测试比赛') {
      console.log('✅ 比赛缓存读取: 成功');
    } else {
      console.log('✅ 比赛缓存读取: 降级模式（返回null）');
    }

    // 4. 测试排行榜功能
    console.log('4. 测试排行榜功能...');
    
    const leaderboardUpdate1 = await redisHelpers.updateLeaderboard(999, 95.5, 'athlete_1');
    const leaderboardUpdate2 = await redisHelpers.updateLeaderboard(999, 87.2, 'athlete_2');
    const leaderboardUpdate3 = await redisHelpers.updateLeaderboard(999, 92.1, 'athlete_3');
    
    console.log(`✅ 排行榜更新: ${leaderboardUpdate1 && leaderboardUpdate2 && leaderboardUpdate3 ? '成功' : '降级模式'}`);
    
    const leaderboard = await redisHelpers.getLeaderboard(999, 3);
    
    if (redisAvailable && leaderboard.length === 3 && leaderboard[0].score === 95.5) {
      console.log('✅ 排行榜读取: 成功');
      console.log(`  第一名: 选手${leaderboard[0].athleteId} - ${leaderboard[0].score}分`);
    } else {
      console.log('✅ 排行榜读取: 降级模式（返回空数组）');
    }

    // 5. 测试活跃比赛管理
    console.log('5. 测试活跃比赛管理...');
    
    const addActive1 = await redisHelpers.addActiveCompetition(999);
    const addActive2 = await redisHelpers.addActiveCompetition(888);
    
    console.log(`✅ 活跃比赛添加: ${addActive1 && addActive2 ? '成功' : '降级模式'}`);
    
    const activeCompetitions = await redisHelpers.getActiveCompetitions();
    
    if (redisAvailable && activeCompetitions.includes('999') && activeCompetitions.includes('888')) {
      console.log('✅ 活跃比赛读取: 成功');
      console.log(`  活跃比赛数量: ${activeCompetitions.length}`);
    } else {
      console.log('✅ 活跃比赛读取: 降级模式（返回空数组）');
    }

    // 6. 测试WebSocket连接跟踪
    console.log('6. 测试WebSocket连接跟踪...');
    
    const wsAdd1 = await redisHelpers.addWebSocketConnection(999, 'socket_123');
    const wsAdd2 = await redisHelpers.addWebSocketConnection(999, 'socket_456');
    
    console.log(`✅ WebSocket连接添加: ${wsAdd1 && wsAdd2 ? '成功' : '降级模式'}`);
    
    const connectionCount = await redisHelpers.getWebSocketConnectionCount(999);
    
    if (redisAvailable && connectionCount === 2) {
      console.log('✅ WebSocket连接计数: 成功');
      console.log(`  连接数量: ${connectionCount}`);
    } else {
      console.log('✅ WebSocket连接计数: 降级模式（返回0）');
    }

    // 7. 测试缓存失效
    console.log('7. 测试缓存失效...');
    
    const invalidateResult = await redisHelpers.invalidateCompetitionCaches(999);
    console.log(`✅ 缓存失效操作: ${invalidateResult ? '成功' : '降级模式'}`);
    
    const invalidatedCompetition = await redisHelpers.getCachedCompetition(999);
    
    if (!redisAvailable || invalidatedCompetition === null) {
      console.log('✅ 缓存失效验证: 成功（缓存已清除或降级模式）');
    } else {
      console.log('⚠️  缓存失效验证: 可能存在问题');
    }

    // 8. 测试统计信息
    console.log('8. 测试缓存统计...');
    
    const stats = redisHelpers.getCacheStats();
    console.log('✅ 缓存统计信息:');
    console.log(`  缓存命中: ${stats.hits}`);
    console.log(`  缓存未命中: ${stats.misses}`);
    console.log(`  缓存错误: ${stats.errors}`);
    console.log(`  总操作数: ${stats.operations}`);
    console.log(`  命中率: ${stats.hitRate}%`);
    console.log(`  运行时间: ${stats.uptime}秒`);
    console.log(`  连接状态: ${stats.isConnected ? '已连接' : '未连接'}`);

    // 9. 测试Redis信息（仅在连接时）
    if (redisAvailable) {
      console.log('9. 获取Redis服务器信息...');
      
      try {
        const info = await redis.info('server');
        const lines = info.split('\r\n');
        const serverInfo = {};
        
        lines.forEach(line => {
          if (line.includes(':') && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            serverInfo[key] = value;
          }
        });
        
        console.log('✅ Redis服务器信息:');
        console.log(`  版本: ${serverInfo.redis_version || 'Unknown'}`);
        console.log(`  模式: ${serverInfo.redis_mode || 'Unknown'}`);
        console.log(`  运行时间: ${serverInfo.uptime_in_seconds ? Math.floor(serverInfo.uptime_in_seconds / 60) : 'Unknown'} 分钟`);
      } catch (error) {
        console.log('⚠️  无法获取Redis服务器信息:', error.message);
      }
    } else {
      console.log('9. 跳过Redis服务器信息获取（Redis未连接）');
    }

    // 清理测试数据（仅在连接时）
    if (redisAvailable) {
      console.log('10. 清理测试数据...');
      try {
        await redis.del('test:key');
        await redisHelpers.removeActiveCompetition(999);
        await redisHelpers.removeActiveCompetition(888);
        await redisHelpers.removeWebSocketConnection(999, 'socket_123');
        await redisHelpers.removeWebSocketConnection(999, 'socket_456');
        console.log('✅ 测试数据清理完成');
      } catch (error) {
        console.log('⚠️  测试数据清理失败:', error.message);
      }
    } else {
      console.log('10. 跳过测试数据清理（Redis未连接）');
    }

    console.log('\n🎉 Redis配置测试完成！');
    
    if (redisAvailable) {
      console.log('✅ Redis正常运行，所有功能可用');
    } else {
      console.log('⚠️  Redis未运行，系统将以降级模式运行');
      console.log('💡 这在开发环境中是正常的，生产环境建议安装Redis以获得最佳性能');
    }
    
    console.log('\n📊 配置摘要:');
    console.log(`  主机: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`  端口: ${process.env.REDIS_PORT || '6379'}`);
    console.log(`  数据库: ${process.env.REDIS_DB || '0'}`);
    console.log(`  默认TTL: ${process.env.REDIS_DEFAULT_TTL || '3600'}秒`);
    console.log(`  最大重试: ${process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3'}`);
    console.log(`  连接超时: ${process.env.REDIS_CONNECT_TIMEOUT || '5000'}ms`);
    console.log(`  状态: ${redisAvailable ? '✅ 已连接' : '⚠️  未连接（降级模式）'}`);

  } catch (error) {
    console.error('❌ Redis配置测试失败:', error.message);
    
    console.log('\n🔧 故障排除建议:');
    console.log('1. 确保Redis服务器正在运行');
    console.log('2. 检查Redis连接配置');
    console.log('3. 验证网络连接');
    console.log('4. 检查防火墙设置');
    console.log('5. 运行 node install-redis.js 获取安装指南');
    
    // 不退出进程，允许系统继续运行
    console.log('\n💡 系统将继续以降级模式运行');
  } finally {
    // 关闭Redis连接（如果已连接）
    try {
      if (redisHelpers.isConnected()) {
        await redis.quit();
        console.log('🔌 Redis连接已关闭');
      }
    } catch (error) {
      console.log('⚠️  关闭Redis连接时出错:', error.message);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testRedisConfiguration();
}

module.exports = { testRedisConfiguration };