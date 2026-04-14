# Redis快速参考卡片

## 🚀 快速命令

### Docker管理
```bash
# 查看容器状态
docker ps

# 启动Redis
docker start redis-scoring

# 停止Redis
docker stop redis-scoring

# 重启Redis
docker restart redis-scoring

# 查看日志
docker logs redis-scoring

# 进入Redis CLI
docker exec -it redis-scoring redis-cli
```

### 测试和验证
```bash
# 快速验证（推荐）
cd backend && node verify-redis-final.js

# 简单测试
cd backend && node test-redis-simple.js

# 直接连接测试
cd backend && node test-direct-redis.js
```

### Redis CLI命令
```bash
# 进入CLI
docker exec -it redis-scoring redis-cli

# 测试连接
ping

# 查看所有键
keys *

# 查看键值
get key_name

# 删除键
del key_name

# 查看键的TTL
ttl key_name

# 查看内存使用
info memory

# 查看统计信息
info stats

# 退出CLI
exit
```

## 📊 缓存键命名规范

### 当前使用的键
```
# 比赛缓存
competition:{id}                    # 单个比赛数据
competitions:list:{filter}          # 比赛列表

# 排行榜
leaderboard:competition:{id}        # 有序集合

# 最新分数
latest_score:competition:{id}       # 最新分数数据

# 活跃比赛
active_competitions                 # 集合

# WebSocket连接
ws_connections:competition:{id}     # 连接集合

# 排名缓存
rankings:competition:{id}           # 排名数据
```

## 🔧 常见问题解决

### 问题1: Redis连接失败
```bash
# 检查容器状态
docker ps | grep redis-scoring

# 如果未运行，启动容器
docker start redis-scoring

# 测试连接
docker exec redis-scoring redis-cli ping
```

### 问题2: 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :6379

# 停止并删除容器
docker stop redis-scoring
docker rm redis-scoring

# 重新创建容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest
```

### 问题3: 缓存未命中
```bash
# 进入Redis CLI检查
docker exec -it redis-scoring redis-cli

# 查看所有键
keys *

# 检查特定键
exists competition:123

# 查看键的TTL
ttl competition:123
```

### 问题4: 内存使用过高
```bash
# 查看内存使用
docker exec redis-scoring redis-cli info memory

# 清理所有缓存（谨慎使用）
docker exec redis-scoring redis-cli flushdb

# 或重启容器
docker restart redis-scoring
```

## 📈 性能监控

### 实时监控
```bash
# 监控Redis统计
docker exec -it redis-scoring redis-cli --stat

# 监控容器资源
docker stats redis-scoring

# 监控Redis命令
docker exec -it redis-scoring redis-cli monitor
```

### 获取统计信息
```javascript
// 在Node.js代码中
const { redisHelpers } = require('./redis');

const stats = redisHelpers.getCacheStats();
console.log('缓存命中率:', stats.hitRate + '%');
console.log('总操作数:', stats.operations);
console.log('连接状态:', stats.isConnected);
```

## 🎯 最佳实践

### 1. 合理设置TTL
```javascript
// 短期数据（5分钟）
await redisHelpers.setLatestScore(id, data, 300);

// 中期数据（1小时）
await redisHelpers.cacheCompetition(id, data, 3600);

// 长期数据（2小时）
await redisHelpers.cacheRankings(id, data, 7200);
```

### 2. 及时失效缓存
```javascript
// 数据更新后立即失效相关缓存
await db.query('UPDATE competitions ...');
await redisHelpers.invalidateCompetitionCaches(competitionId);
```

### 3. 使用缓存助手
```javascript
// 推荐：使用封装好的助手函数
const competition = await redisHelpers.getCachedCompetition(id);

// 不推荐：直接使用redis客户端
const data = await redis.get(`competition:${id}`);
```

### 4. 监控缓存性能
```javascript
// 定期检查缓存命中率
setInterval(() => {
  const stats = redisHelpers.getCacheStats();
  if (stats.hitRate < 80) {
    console.warn('缓存命中率低于80%:', stats.hitRate);
  }
}, 60000); // 每分钟检查一次
```

## 🔐 生产环境配置

### 设置密码
```bash
# 停止当前容器
docker stop redis-scoring
docker rm redis-scoring

# 启动带密码的容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest redis-server --requirepass your_secure_password

# 更新.env文件
REDIS_PASSWORD=your_secure_password
```

### 数据持久化
```bash
# 启动带持久化的容器
docker run --name redis-scoring -p 6379:6379 -v redis-data:/data -d redis:latest redis-server --appendonly yes
```

### 内存限制
```bash
# 限制内存使用
docker run --name redis-scoring -p 6379:6379 -m 512m -d redis:latest redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## 📞 获取帮助

### 查看文档
- `REDIS_SETUP_COMPLETE.md` - 完整配置报告
- `DOCKER_REDIS_SETUP.md` - Docker设置指南
- `REDIS_CONFIGURATION_SUMMARY.md` - 配置摘要

### 运行测试
```bash
cd backend
node verify-redis-final.js
```

### 检查日志
```bash
# Redis容器日志
docker logs redis-scoring --tail 50

# 应用日志
# 查看应用启动时的Redis连接信息
```

---

**提示**: 将此文件保存为书签，方便日常查阅！