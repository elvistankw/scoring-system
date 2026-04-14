// Clear competition list cache to force refresh with athlete_count
const { redis } = require('./redis');

async function clearCache() {
  console.log('🧹 清除比赛列表缓存...\n');

  try {
    // Get all keys matching competition list pattern
    const keys = await redis.keys('competitions:list:*');
    
    if (keys.length === 0) {
      console.log('ℹ️  没有找到缓存的比赛列表');
      process.exit(0);
    }

    console.log(`📋 找到 ${keys.length} 个缓存键：`);
    keys.forEach(key => console.log(`   - ${key}`));
    console.log('');

    // Delete all keys
    for (const key of keys) {
      await redis.del(key);
      console.log(`✅ 已删除: ${key}`);
    }

    console.log(`\n✅ 成功清除 ${keys.length} 个缓存键`);
    console.log('💡 下次请求时将从数据库重新加载，包含 athlete_count 字段');

    process.exit(0);
  } catch (error) {
    console.error('❌ 清除缓存失败:', error.message);
    process.exit(1);
  }
}

clearCache();
