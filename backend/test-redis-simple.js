// 简单的Redis连接测试
require('dotenv').config();
const { redis, redisHelpers } = require('./redis');

async function simpleTest() {
  console.log('🧪 简单Redis测试...\n');
  
  // 等待一下让Redis连接建立
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    console.log('1. 测试PING...');
    const pong = await redis.ping();
    console.log('✅ PING响应:', pong);
    
    console.log('2. 测试基础操作...');
    await redis.set('test:simple', 'hello redis');
    const value = await redis.get('test:simple');
    console.log('✅ SET/GET测试:', value);
    
    console.log('3. 测试缓存助手...');
    const testData = { id: 123, name: '测试比赛' };
    await redisHelpers.cacheCompetition(123, testData);
    const cached = await redisHelpers.getCachedCompetition(123);
    console.log('✅ 缓存助手测试:', cached ? cached.name : 'null');
    
    console.log('4. 测试排行榜...');
    await redisHelpers.updateLeaderboard(123, 95.5, 'athlete1');
    await redisHelpers.updateLeaderboard(123, 87.2, 'athlete2');
    const leaderboard = await redisHelpers.getLeaderboard(123, 2);
    console.log('✅ 排行榜测试:', leaderboard.length > 0 ? `${leaderboard.length}个选手` : '空');
    
    console.log('5. 获取统计信息...');
    const stats = redisHelpers.getCacheStats();
    console.log('✅ 缓存统计:');
    console.log(`  连接状态: ${stats.isConnected ? '已连接' : '未连接'}`);
    console.log(`  命中率: ${stats.hitRate}%`);
    console.log(`  总操作: ${stats.operations}`);
    
    // 清理
    await redis.del('test:simple');
    await redisHelpers.invalidateCompetitionCaches(123);
    
    console.log('\n🎉 Redis测试成功！所有功能正常工作');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

simpleTest();