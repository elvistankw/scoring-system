// 直接测试Redis连接
const Redis = require('ioredis');

console.log('🧪 直接测试Redis连接...\n');

// 创建简单的Redis连接
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('❌ 连接重试次数超限');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
  enableOfflineQueue: false,
  lazyConnect: true
});

async function testConnection() {
  try {
    console.log('1. 尝试连接Redis...');
    await redis.connect();
    console.log('✅ Redis连接成功');
    
    console.log('2. 测试PING命令...');
    const pong = await redis.ping();
    console.log('✅ PING响应:', pong);
    
    console.log('3. 测试SET/GET操作...');
    await redis.set('test:key', 'hello world');
    const value = await redis.get('test:key');
    console.log('✅ SET/GET测试:', value);
    
    console.log('4. 获取Redis信息...');
    const info = await redis.info('server');
    const lines = info.split('\r\n');
    lines.forEach(line => {
      if (line.includes('redis_version:')) {
        console.log('✅ Redis版本:', line.split(':')[1]);
      }
    });
    
    console.log('5. 清理测试数据...');
    await redis.del('test:key');
    
    console.log('\n🎉 Redis连接测试成功！');
    
  } catch (error) {
    console.error('❌ Redis连接测试失败:', error.message);
    console.log('\n🔧 可能的原因:');
    console.log('1. Redis容器未完全启动');
    console.log('2. 端口映射问题');
    console.log('3. 网络连接问题');
    
    console.log('\n💡 解决方案:');
    console.log('1. 检查容器状态: docker ps');
    console.log('2. 检查容器日志: docker logs redis-scoring');
    console.log('3. 重启容器: docker restart redis-scoring');
  } finally {
    await redis.quit();
    console.log('🔌 连接已关闭');
  }
}

testConnection();