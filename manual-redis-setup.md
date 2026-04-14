# 手动Redis设置指南

## 🔧 如果Docker暂时有问题

### 选项1: 等待Docker完全启动
1. 确保Docker Desktop已启动并完全加载
2. 重启PowerShell
3. 运行: `docker --version`
4. 如果成功，继续使用Docker方式

### 选项2: 手动Docker命令
如果Docker已启动但脚本有问题，可以手动运行：

```bash
# 1. 检查Docker
docker --version

# 2. 拉取Redis镜像
docker pull redis:latest

# 3. 启动Redis容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest

# 4. 测试连接
docker exec -it redis-scoring redis-cli ping

# 5. 测试评分系统
cd backend
node test-redis-config.js
```

### 选项3: 使用WSL2安装Redis
如果Docker有问题，可以使用WSL2：

```bash
# 1. 安装WSL2（如果未安装）
wsl --install

# 2. 在WSL2中安装Redis
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# 3. 测试连接
redis-cli ping

# 4. 测试评分系统
exit  # 退出WSL2
cd backend
node test-redis-config.js
```

## 🎯 验证Redis是否工作

无论使用哪种方式，最后都运行这个测试：

```bash
cd backend
node test-redis-config.js
```

如果看到"Redis连接成功"，说明设置完成！

## 💡 重要提示

**系统已经可以正常使用！** Redis只是性能增强功能：

- ✅ **无Redis**: 系统正常运行，所有功能可用
- 🚀 **有Redis**: 系统高性能运行，缓存加速

你可以：
1. 先继续使用系统（无Redis模式）
2. 有时间时再配置Redis获得性能提升