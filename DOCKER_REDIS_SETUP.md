# Docker Redis 快速设置指南

## 🐳 Docker Redis 安装和使用

既然你已经下载了Docker，现在让我们来设置Redis！

## 📋 步骤1: 确认Docker安装

### 检查Docker状态
1. **重启电脑**（如果刚安装Docker）
2. **启动Docker Desktop**
   - 在开始菜单中找到"Docker Desktop"
   - 点击启动，等待Docker引擎启动完成
   - 看到Docker图标在系统托盘中且不再转圈

### 验证Docker
打开命令提示符或PowerShell，运行：
```bash
docker --version
```

如果显示版本信息，说明Docker已准备就绪！

## 📋 步骤2: 启动Redis容器

### 方法1: 一键启动（推荐）
```bash
# 拉取并启动Redis容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest
```

### 方法2: 分步执行
```bash
# 1. 拉取Redis镜像
docker pull redis:latest

# 2. 启动Redis容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest
```

### 命令解释
- `--name redis-scoring`: 给容器命名为"redis-scoring"
- `-p 6379:6379`: 将容器的6379端口映射到主机的6379端口
- `-d`: 后台运行容器
- `redis:latest`: 使用最新版本的Redis镜像

## 📋 步骤3: 验证Redis运行

### 检查容器状态
```bash
# 查看运行中的容器
docker ps

# 应该看到类似输出：
# CONTAINER ID   IMAGE    COMMAND                  CREATED         STATUS         PORTS                    NAMES
# abc123def456   redis    "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   0.0.0.0:6379->6379/tcp   redis-scoring
```

### 测试Redis连接
```bash
# 进入Redis容器并测试
docker exec -it redis-scoring redis-cli ping

# 应该返回：PONG
```

## 📋 步骤4: 测试评分系统集成

现在Redis已经运行，让我们测试评分系统的集成：

```bash
# 进入后端目录
cd backend

# 测试Redis配置
node test-redis-config.js

# 测试系统集成
node test-redis-integration.js
```

## 🔧 Docker Redis 管理命令

### 基本操作
```bash
# 启动已停止的容器
docker start redis-scoring

# 停止容器
docker stop redis-scoring

# 重启容器
docker restart redis-scoring

# 查看容器日志
docker logs redis-scoring

# 删除容器（会丢失数据）
docker rm redis-scoring
```

### 进入Redis命令行
```bash
# 进入Redis CLI
docker exec -it redis-scoring redis-cli

# 在Redis CLI中可以执行：
# ping                    # 测试连接
# set test "hello"        # 设置键值
# get test                # 获取值
# keys *                  # 查看所有键
# exit                    # 退出CLI
```

### 查看Redis信息
```bash
# 查看Redis服务器信息
docker exec -it redis-scoring redis-cli info server

# 查看内存使用情况
docker exec -it redis-scoring redis-cli info memory
```

## 🛠️ 故障排除

### 问题1: Docker命令不识别
**解决方案**:
1. 确保Docker Desktop已启动
2. 重启命令提示符/PowerShell
3. 重启电脑（如果刚安装Docker）

### 问题2: 端口已被占用
**错误信息**: `port is already allocated`
**解决方案**:
```bash
# 查看占用6379端口的进程
netstat -ano | findstr :6379

# 停止可能存在的Redis容器
docker stop redis-scoring
docker rm redis-scoring

# 重新启动
docker run --name redis-scoring -p 6379:6379 -d redis:latest
```

### 问题3: 容器名称冲突
**错误信息**: `name is already in use`
**解决方案**:
```bash
# 删除现有容器
docker rm redis-scoring

# 或使用不同名称
docker run --name redis-scoring-new -p 6379:6379 -d redis:latest
```

## 🎯 快速验证脚本

创建一个快速验证脚本：

```bash
# 检查Docker
echo "检查Docker..."
docker --version

# 检查Redis容器
echo "检查Redis容器..."
docker ps | grep redis-scoring

# 测试Redis连接
echo "测试Redis连接..."
docker exec redis-scoring redis-cli ping

# 测试评分系统
echo "测试评分系统集成..."
cd backend && node test-redis-config.js
```

## 📊 性能监控

### 实时监控Redis
```bash
# 实时查看Redis统计信息
docker exec -it redis-scoring redis-cli --stat

# 监控Redis命令
docker exec -it redis-scoring redis-cli monitor
```

### 查看容器资源使用
```bash
# 查看容器资源使用情况
docker stats redis-scoring
```

## 🔄 数据持久化（可选）

如果你希望Redis数据在容器重启后保留：

```bash
# 停止当前容器
docker stop redis-scoring
docker rm redis-scoring

# 启动带数据持久化的容器
docker run --name redis-scoring -p 6379:6379 -v redis-data:/data -d redis:latest redis-server --appendonly yes
```

## 🎉 完成检查清单

- [ ] Docker Desktop已启动
- [ ] `docker --version` 命令成功
- [ ] Redis容器已启动 (`docker ps` 显示redis-scoring)
- [ ] Redis连接测试成功 (`docker exec -it redis-scoring redis-cli ping` 返回PONG)
- [ ] 评分系统测试通过 (`node test-redis-config.js` 显示连接成功)

## 🚀 下一步

完成上述步骤后，你的Redis就完全配置好了！评分系统现在将享受Redis缓存带来的性能提升。

### 性能提升预期
- 比赛列表查询: 10-50倍提升
- 排行榜显示: 5-20倍提升  
- 分数更新: 2-5倍提升
- WebSocket广播: 1.5-3倍提升

---

**需要帮助？** 如果遇到任何问题，请告诉我具体的错误信息，我会帮你解决！