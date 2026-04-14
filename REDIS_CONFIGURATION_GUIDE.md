# Redis配置完整指南

## 📋 目录

1. [Redis基础概念](#redis基础概念)
2. [Redis安装](#redis安装)
3. [环境变量配置](#环境变量配置)
4. [Redis连接配置](#redis连接配置)
5. [缓存策略实现](#缓存策略实现)
6. [性能优化](#性能优化)
7. [监控和调试](#监控和调试)
8. [故障排除](#故障排除)

## 🔍 Redis基础概念

### 什么是Redis？
Redis (Remote Dictionary Server) 是一个开源的内存数据结构存储系统，可以用作：
- **缓存** - 提高数据访问速度
- **消息队列** - 异步任务处理
- **会话存储** - 用户会话管理
- **实时数据** - 排行榜、计数器等

### 在评分系统中的作用
- 缓存比赛数据和选手信息
- 存储实时评分数据
- 缓存排行榜和统计信息
- 提高API响应速度

## 🚀 Redis安装

### Windows安装

#### 方法1：使用WSL2（推荐）
```bash
# 安装WSL2
wsl --install

# 在WSL2中安装Redis
sudo apt update
sudo apt install redis-server

# 启动Redis服务
sudo service redis-server start

# 测试连接
redis-cli ping
```

#### 方法2：使用Docker
```bash
# 拉取Redis镜像
docker pull redis:latest

# 运行Redis容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest

# 测试连接
docker exec -it redis-scoring redis-cli ping
```

#### 方法3：使用Redis for Windows
```bash
# 下载并安装 Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# 或使用Chocolatey
choco install redis-64

# 启动Redis服务
redis-server
```

### macOS安装
```bash
# 使用Homebrew
brew install redis

# 启动Redis服务
brew services start redis

# 测试连接
redis-cli ping
```

### Linux安装
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis
# 或
sudo dnf install redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis

# 测试连接
redis-cli ping
```

## ⚙️ 环境变量配置

### 1. 更新 backend/.env 文件

```env
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_USERNAME=
REDIS_FAMILY=4
REDIS_KEEPALIVE=30000

# Redis连接池配置
REDIS_MAX_RETRIES_PER_REQUEST=3
REDIS_RETRY_DELAY_ON_FAILURE=100
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RECONNECT_ATTEMPTS=10

# Redis缓存配置
REDIS_DEFAULT_TTL=3600
REDIS_ENABLE_OFFLINE_QUEUE=false
REDIS_LAZY_CONNECT=true

# 生产环境配置
REDIS_TLS_ENABLED=false
REDIS_CLUSTER_MODE=false
```

### 2. 更新 backend/.env.example 文件

```env
# Redis配置
# 本地开发环境
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 生产环境示例
# REDIS_HOST=your-redis-host.com
# REDIS_PORT=6379
# REDIS_PASSWORD=your-secure-password
# REDIS_DB=0
# REDIS_TLS_ENABLED=true

# Redis连接选项
REDIS_MAX_RETRIES_PER_REQUEST=3
REDIS_RETRY_DELAY_ON_FAILURE=100
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RECONNECT_ATTEMPTS=10

# 缓存配置
REDIS_DEFAULT_TTL=3600
REDIS_ENABLE_OFFLINE_QUEUE=false
REDIS_LAZY_CONNECT=true
```

### 3. 生产环境配置

```env
# 生产环境Redis配置
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6380
REDIS_PASSWORD=your-very-secure-password-here
REDIS_DB=0
REDIS_USERNAME=scoring-app
REDIS_TLS_ENABLED=true

# 高可用配置
REDIS_CLUSTER_MODE=true
REDIS_CLUSTER_NODES=redis1.example.com:6379,redis2.example.com:6379,redis3.example.com:6379

# 性能配置
REDIS_MAX_RETRIES_PER_REQUEST=5
REDIS_RETRY_DELAY_ON_FAILURE=200
REDIS_COMMAND_TIMEOUT=5000
REDIS_CONNECT_TIMEOUT=10000
```

## 🔧 Redis连接配置

### 1. 检查当前Redis配置

首先让我检查当前的Redis配置：