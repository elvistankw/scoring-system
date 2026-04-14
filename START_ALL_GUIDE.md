# 🚀 start-all.js 使用指南

## 问题说明

之前的 `start-all.js` 使用 `npm start` 命令，这会启动**生产模式**：
- 前端：`next start`（需要先 build）
- 后端：`node index.js`（生产模式）

这导致：
- ❌ 前端没有热重载
- ❌ 后端没有自动重启
- ❌ 需要每次修改后重新 build

## 解决方案

现在 `start-all.js` 已更新，支持两种模式：

### 1. 开发模式（默认）

```bash
npm run start-all
```

**特点**：
- ✅ 前端热重载（修改代码自动刷新）
- ✅ 后端自动重启（使用 nodemon）
- ✅ 无需 build
- ✅ 适合开发调试

**运行的命令**：
- 前端：`npm run dev` → `next dev`
- 后端：`npm run dev` → `nodemon index.js`

### 2. 生产模式

```bash
npm run start-all:prod
```

**特点**：
- ✅ 优化的生产构建
- ✅ 更快的响应速度
- ✅ 更小的内存占用
- ✅ 适合生产环境

**运行的命令**：
- 前端：`npm run start` → `next start`
- 后端：`npm run start` → `node index.js`

**注意**：生产模式需要先 build：
```bash
npm run build
```

## 使用场景

### 开发时（推荐）

```bash
# 方式 1: 使用 start-all（推荐）
npm run start-all

# 方式 2: 分别启动（更灵活）
# 终端 1
cd backend && npm run dev

# 终端 2
npm run dev
```

### 本地测试生产版本

```bash
# 1. 先构建前端
npm run build

# 2. 启动生产模式
npm run start-all:prod
```

### 生产部署

```bash
# 使用 Docker Compose（推荐）
docker-compose -f docker-compose.prod.yml up -d

# 或使用 PM2
pm2 start ecosystem.config.js
```

## 版本差异对比

### 开发模式 vs 生产模式

| 特性 | 开发模式 | 生产模式 |
|------|----------|----------|
| 热重载 | ✅ 是 | ❌ 否 |
| 自动重启 | ✅ 是 | ❌ 否 |
| 构建优化 | ❌ 否 | ✅ 是 |
| 启动速度 | 慢 | 快 |
| 内存占用 | 高 | 低 |
| 调试信息 | 详细 | 精简 |
| Source Maps | ✅ 是 | ❌ 否 |
| 适用场景 | 开发调试 | 生产部署 |

## 常见问题

### Q1: 为什么 `npm run start-all` 启动很慢？

**A**: 开发模式需要编译代码，首次启动较慢（30-60秒）。后续修改会快速热重载。

### Q2: 修改代码后没有自动刷新？

**A**: 确保使用的是开发模式：
```bash
npm run start-all  # 不是 npm run start-all:prod
```

### Q3: 生产模式启动失败？

**A**: 需要先构建前端：
```bash
npm run build
npm run start-all:prod
```

### Q4: 如何查看当前运行模式？

**A**: 启动时会显示：
```
🚀 启动评分系统 (开发模式)...
```
或
```
🚀 启动评分系统 (生产模式)...
```

### Q5: 如何停止服务？

**A**: 按 `Ctrl+C` 停止所有服务器。

## 推荐工作流

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

### 生产部署

```bash
# 使用 Docker（推荐）
docker-compose -f docker-compose.prod.yml up -d

# 或使用 PM2
npm run build
pm2 start ecosystem.config.js
```

## 技术细节

### start-all.js 工作原理

```javascript
// 1. 检测模式
const isProduction = process.argv.includes('--prod');

// 2. 选择命令
const backendCommand = isProduction ? 'start' : 'dev';
const frontendCommand = isProduction ? 'start' : 'dev';

// 3. 启动后端
spawn('npm', ['run', backendCommand], { cwd: 'backend' });

// 4. 2秒后启动前端
setTimeout(() => {
  spawn('npm', ['run', frontendCommand]);
}, 2000);
```

### 环境变量

开发模式：
```env
NODE_ENV=development
```

生产模式：
```env
NODE_ENV=production
```

## 最佳实践

### ✅ 推荐

1. **开发时使用开发模式**
   ```bash
   npm run start-all
   ```

2. **分别启动以便查看日志**
   ```bash
   # 终端 1
   cd backend && npm run dev
   
   # 终端 2
   npm run dev
   ```

3. **生产部署使用 Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### ❌ 不推荐

1. **开发时使用生产模式**
   - 没有热重载
   - 调试困难

2. **生产环境使用开发模式**
   - 性能差
   - 内存占用高
   - 不安全

3. **直接使用 `node start-all.js`**
   - 使用 `npm run start-all` 更规范

## 总结

- **开发**: `npm run start-all` （默认，推荐）
- **生产测试**: `npm run start-all:prod` （需要先 build）
- **生产部署**: 使用 Docker 或 PM2

现在你可以愉快地开发了！ 🎉

---

**更新日期**: 2026-04-13
**版本**: 2.0.0
