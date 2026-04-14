# 🚀 评分系统启动指南

## 快速启动

### 方法1: 一键启动（推荐）

#### 开发模式（默认）
```bash
npm run start-all
```

**特点**：
- ✅ 前端热重载（修改代码自动刷新）
- ✅ 后端自动重启（使用 nodemon）
- ✅ 适合开发调试

#### 生产模式
```bash
# 先构建前端
npm run build

# 启动生产模式
npm run start-all:prod
```

**特点**：
- ✅ 优化的生产构建
- ✅ 更快的响应速度
- ✅ 适合生产环境测试

### 方法2: 分别启动（更灵活）

**终端1 - 启动后端：**
```bash
cd backend

# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

**终端2 - 启动前端：**
```bash
# 开发模式（热重载）
npm run dev

# 或生产模式（需要先 build）
npm run build
npm start
```

### 方法3: 使用启动脚本（旧方式）

```bash
node start-all.js          # 开发模式
node start-all.js --prod   # 生产模式
```

---

## 📋 服务器地址

启动成功后，访问以下地址：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000
- **后端健康检查**: http://localhost:5000/health
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

---

## 🎯 推荐工作流

### 日常开发

```bash
# 1. 启动开发服务器
npm run start-all

# 2. 修改代码
# 前端会自动热重载
# 后端会自动重启

# 3. 测试功能
# 访问 http://localhost:3000

# 4. 停止服务
# Ctrl+C
```

### 发布前测试

```bash
# 1. 构建生产版本
npm run build

# 2. 启动生产模式测试
npm run start-all:prod

# 3. 测试所有功能

# 4. 如果有问题，回到开发模式修复
npm run start-all
```

---

## 🔧 常见问题

### 问题1: 端口已被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**

#### 方案A: 检查并停止占用端口的进程

```bash
# 查看占用3000端口的进程
netstat -ano | findstr :3000

# 停止进程（替换PID为实际进程ID）
taskkill /F /PID <PID>
```

#### 方案B: 使用不同端口

编辑 `package.json`：
```json
{
  "scripts": {
    "start": "next start -p 3001"
  }
}
```

### 问题2: 后端无法连接数据库

**检查清单：**
1. PostgreSQL是否运行？
   ```bash
   # 检查PostgreSQL服务
   # Windows: 服务管理器中查看PostgreSQL服务
   ```

2. 数据库配置是否正确？
   ```bash
   # 检查backend/.env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=scoring
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

3. 数据库是否已创建？
   ```bash
   # 连接PostgreSQL并创建数据库
   psql -U postgres
   CREATE DATABASE scoring;
   ```

### 问题3: Redis连接失败

**检查Redis容器：**
```bash
# 查看Redis容器状态
docker ps | grep redis-scoring

# 如果未运行，启动容器
docker start redis-scoring

# 如果容器不存在，创建新容器
docker run --name redis-scoring -p 6379:6379 -d redis:latest
```

### 问题4: 前端无法连接后端

**检查后端是否运行：**
```bash
# 测试后端API
curl http://localhost:5000/api/health

# 或在浏览器访问
http://localhost:5000/api/health
```

**检查前端API配置：**
```typescript
// lib/api-config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

---

## 🎯 完整启动流程

### 1. 启动依赖服务

#### PostgreSQL
```bash
# Windows: 在服务管理器中启动PostgreSQL服务
# 或使用命令行
net start postgresql-x64-14
```

#### Redis
```bash
# 启动Redis容器
docker start redis-scoring

# 验证Redis运行
docker exec redis-scoring redis-cli ping
```

### 2. 启动后端服务器

```bash
cd backend
npm start
```

**预期输出：**
```
✅ Redis connected successfully
📊 Redis info: localhost:6379 DB:0
✅ Database connected successfully
✅ WebSocket server initialized
🚀 Server running on port 5000
```

### 3. 启动前端服务器

```bash
# 在项目根目录
npm start
```

**预期输出：**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### 4. 验证系统运行

**打开浏览器访问：**
- http://localhost:3000

**测试功能：**
1. 访问首页
2. 尝试登录
3. 查看比赛列表
4. 测试实时评分

---

## 🔄 重启服务器

### 重启后端
```bash
# 在backend目录
Ctrl+C  # 停止服务器
npm start  # 重新启动
```

### 重启前端
```bash
# 在项目根目录
Ctrl+C  # 停止服务器
npm start  # 重新启动
```

### 重启Redis
```bash
docker restart redis-scoring
```

---

## 🛑 停止服务器

### 停止前后端
```bash
# 在运行服务器的终端按
Ctrl+C
```

### 停止Redis
```bash
docker stop redis-scoring
```

### 停止PostgreSQL
```bash
# Windows服务管理器中停止PostgreSQL服务
# 或使用命令行
net stop postgresql-x64-14
```

---

## 📊 服务器状态检查

### 检查所有服务

```bash
# 检查前端 (3000端口)
netstat -ano | findstr :3000

# 检查后端 (5000端口)
netstat -ano | findstr :5000

# 检查Redis (6379端口)
netstat -ano | findstr :6379

# 检查PostgreSQL (5432端口)
netstat -ano | findstr :5432
```

### 快速健康检查

```bash
# 后端健康检查
curl http://localhost:5000/api/health

# Redis健康检查
docker exec redis-scoring redis-cli ping

# 前端健康检查
curl http://localhost:3000
```

---

## 🎨 开发模式 vs 生产模式

### 开发模式（当前）
```bash
# 前端 - 热重载
npm run dev

# 后端 - 自动重启
cd backend
npm run dev  # 如果配置了nodemon
```

### 生产模式
```bash
# 前端 - 构建并启动
npm run build
npm start

# 后端 - 直接启动
cd backend
npm start
```

---

## 💡 提示和技巧

### 1. 使用多个终端
- 终端1: 后端服务器
- 终端2: 前端服务器
- 终端3: 运行测试/命令

### 2. 查看日志
```bash
# 后端日志
cd backend
npm start | tee backend.log

# 前端日志
npm start | tee frontend.log
```

### 3. 快速重启
```bash
# 创建重启脚本
# restart.sh 或 restart.bat
```

### 4. 环境变量
```bash
# 开发环境
NODE_ENV=development npm start

# 生产环境
NODE_ENV=production npm start
```

---

## 🆘 获取帮助

### 查看日志
- 后端日志：终端输出
- 前端日志：浏览器控制台 + 终端输出
- Redis日志：`docker logs redis-scoring`

### 测试脚本
```bash
# 测试Redis
cd backend && node verify-redis-final.js

# 测试数据库连接
cd backend && node test-db-connection.js

# 测试JWT配置
cd backend && node test-jwt-config.js
```

### 重置环境
```bash
# 停止所有服务
# 清理node_modules
rm -rf node_modules backend/node_modules

# 重新安装依赖
npm install
cd backend && npm install

# 重启服务
```

---

**快速参考：**
```bash
# 启动后端
cd backend && npm start

# 启动前端
npm start

# 访问应用
http://localhost:3000
```