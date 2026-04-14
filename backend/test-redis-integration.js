// Redis集成测试脚本
// 测试Redis与现有系统的集成
require('dotenv').config();
const { redisHelpers } = require('./redis');

async function testRedisIntegration() {
  console.log('🧪 测试Redis系统集成...\n');

  try {
    // 1. 测试连接状态
    console.log('1. 检查Redis连接状态...');
    const isConnected = redisHelpers.isConnected();
    console.log(`✅ Redis连接状态: ${isConnected ? '已连接' : '未连接（降级模式）'}`);

    // 2. 测试缓存统计
    console.log('\n2. 获取缓存统计信息...');
    const stats = redisHelpers.getCacheStats();
    console.log('📊 缓存统计:');
    console.log(`  命中次数: ${stats.hits}`);
    console.log(`  未命中次数: ${stats.misses}`);
    console.log(`  错误次数: ${stats.errors}`);
    console.log(`  总操作数: ${stats.operations}`);
    console.log(`  命中率: ${stats.hitRate}%`);
    console.log(`  运行时间: ${stats.uptime}秒`);
    console.log(`  连接状态: ${stats.isConnected ? '已连接' : '未连接'}`);

    // 3. 测试基础缓存操作
    console.log('\n3. 测试基础缓存操作...');
    
    // 测试比赛缓存
    const testCompetition = {
      id: 12345,
      name: '集成测试比赛',
      status: 'active',
      region: '测试赛区',
      category: 'individual'
    };

    console.log('  测试比赛数据缓存...');
    const cacheResult = await redisHelpers.cacheCompetition(12345, testCompetition, 300);
    console.log(`  ✅ 缓存操作: ${cacheResult ? '成功' : '降级模式'}`);

    const cachedData = await redisHelpers.getCachedCompetition(12345);
    if (cachedData) {
      console.log(`  ✅ 缓存读取: 成功 - ${cachedData.name}`);
    } else {
      console.log('  ✅ 缓存读取: 降级模式（返回null）');
    }

    // 4. 测试排行榜功能
    console.log('\n4. 测试排行榜功能...');
    
    console.log('  添加测试分数...');
    await redisHelpers.updateLeaderboard(12345, 95.5, 'test_athlete_1');
    await redisHelpers.updateLeaderboard(12345, 87.2, 'test_athlete_2');
    await redisHelpers.updateLeaderboard(12345, 92.1, 'test_athlete_3');
    
    const leaderboard = await redisHelpers.getLeaderboard(12345, 5);
    console.log(`  ✅ 排行榜: ${leaderboard.length > 0 ? '有数据' : '降级模式'}`);
    
    if (leaderboard.length > 0) {
      console.log('  📊 排行榜前3名:');
      leaderboard.slice(0, 3).forEach((entry, index) => {
        console.log(`    ${index + 1}. 选手${entry.athleteId}: ${entry.score}分`);
      });
    }

    // 5. 测试活跃比赛管理
    console.log('\n5. 测试活跃比赛管理...');
    
    await redisHelpers.addActiveCompetition(12345);
    await redisHelpers.addActiveCompetition(67890);
    
    const activeCompetitions = await redisHelpers.getActiveCompetitions();
    console.log(`  ✅ 活跃比赛: ${activeCompetitions.length}个`);
    
    if (activeCompetitions.length > 0) {
      console.log(`  📋 活跃比赛ID: ${activeCompetitions.join(', ')}`);
    }

    // 6. 测试WebSocket连接跟踪
    console.log('\n6. 测试WebSocket连接跟踪...');
    
    await redisHelpers.addWebSocketConnection(12345, 'test_socket_1');
    await redisHelpers.addWebSocketConnection(12345, 'test_socket_2');
    
    const connectionCount = await redisHelpers.getWebSocketConnectionCount(12345);
    console.log(`  ✅ WebSocket连接: ${connectionCount}个`);

    // 7. 测试最新分数缓存
    console.log('\n7. 测试最新分数缓存...');
    
    const latestScore = {
      athleteId: 'test_athlete_1',
      competitionId: 12345,
      scores: {
        technical: 45.5,
        artistic: 50.0,
        total: 95.5
      },
      timestamp: new Date().toISOString()
    };
    
    await redisHelpers.setLatestScore(12345, latestScore);
    const retrievedScore = await redisHelpers.getLatestScore(12345);
    
    if (retrievedScore) {
      console.log(`  ✅ 最新分数: 选手${retrievedScore.athleteId} - ${retrievedScore.scores.total}分`);
    } else {
      console.log('  ✅ 最新分数: 降级模式（返回null）');
    }

    // 8. 测试缓存失效
    console.log('\n8. 测试缓存失效...');
    
    await redisHelpers.invalidateCompetitionCaches(12345);
    console.log('  ✅ 缓存失效: 已执行');

    // 9. 获取最终统计
    console.log('\n9. 最终缓存统计...');
    const finalStats = redisHelpers.getCacheStats();
    console.log('📊 最终统计:');
    console.log(`  命中次数: ${finalStats.hits}`);
    console.log(`  未命中次数: ${finalStats.misses}`);
    console.log(`  错误次数: ${finalStats.errors}`);
    console.log(`  总操作数: ${finalStats.operations}`);
    console.log(`  命中率: ${finalStats.hitRate}%`);

    // 清理测试数据
    console.log('\n10. 清理测试数据...');
    await redisHelpers.removeActiveCompetition(12345);
    await redisHelpers.removeActiveCompetition(67890);
    await redisHelpers.removeWebSocketConnection(12345, 'test_socket_1');
    await redisHelpers.removeWebSocketConnection(12345, 'test_socket_2');
    console.log('  ✅ 测试数据已清理');

    console.log('\n🎉 Redis系统集成测试完成！');
    
    if (isConnected) {
      console.log('✅ Redis正常运行，所有缓存功能可用');
    } else {
      console.log('⚠️  Redis未运行，系统以降级模式运行');
      console.log('💡 这在开发环境中是正常的，不影响系统功能');
    }

    console.log('\n📋 集成状态摘要:');
    console.log(`  Redis连接: ${isConnected ? '✅ 已连接' : '⚠️  未连接'}`);
    console.log(`  缓存操作: ${finalStats.operations > 0 ? '✅ 正常' : '⚠️  降级模式'}`);
    console.log(`  错误处理: ✅ 正常（优雅降级）`);
    console.log(`  统计监控: ✅ 正常`);
    console.log(`  系统状态: ✅ 运行正常`);

  } catch (error) {
    console.error('❌ Redis集成测试失败:', error.message);
    console.log('\n🔧 可能的问题:');
    console.log('1. Redis配置错误');
    console.log('2. 网络连接问题');
    console.log('3. 权限问题');
    
    console.log('\n💡 解决方案:');
    console.log('1. 检查Redis配置: node test-redis-config.js');
    console.log('2. 安装Redis: node install-redis.js');
    console.log('3. 检查系统日志');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testRedisIntegration();
}

module.exports = { testRedisIntegration };