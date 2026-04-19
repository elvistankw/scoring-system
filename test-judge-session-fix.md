# 评委会话修复验证测试

## 测试目的
验证"点击比赛后弹出请先选择评委身份"的问题已经修复。

## 测试步骤

### 测试 1: 评委登录流程
1. 访问 `http://localhost:3000/zh/judge-landing`
2. 点击"开始评分"按钮
3. 从弹出的模态框中选择一个可用的评委身份
4. **预期结果**: 成功跳转到评委仪表板 (`/zh/judge-dashboard`)

### 测试 2: 查看比赛列表
1. 在评委仪表板页面
2. 查看比赛列表是否正常显示
3. **预期结果**: 
   - 可以看到比赛列表
   - 没有出现认证错误
   - 后端日志显示："✅ Current session found: [评委名称]"

### 测试 3: 点击比赛进入评分页面（核心测试）
1. 在评委仪表板页面
2. 点击一个"active"状态的比赛
3. **预期结果**: 
   - ✅ 成功跳转到评分页面 (`/zh/scoring`)
   - ✅ 不会弹出"请先选择评委身份"的错误提示
   - ✅ 不会被重定向回 judge-landing 页面
   - ✅ 可以看到选手列表

### 测试 4: 评分页面功能
1. 在评分页面
2. 选择一个选手
3. 输入评分
4. **预期结果**: 
   - 可以正常查看选手信息
   - 可以正常输入评分
   - 评委会话保持有效

### 测试 5: 页面刷新后会话保持
1. 在评分页面
2. 刷新浏览器 (F5)
3. **预期结果**: 
   - 评委会话仍然有效
   - 不会被重定向到登录页面
   - 可以继续评分

## 测试结果

### ✅ 修复前的问题
- ❌ 点击比赛后立即弹出"请先选择评委身份"
- ❌ 被重定向回 judge-landing 页面
- ❌ 无法进入评分页面

### ✅ 修复后的状态
- ✅ 点击比赛后正常跳转到评分页面
- ✅ 不再出现错误提示
- ✅ 评委会话正常工作
- ✅ 可以正常查看选手和评分

## 技术验证

### 后端日志验证
```
✅ Current session found: 吴十评委 (J008)
⚠️  Cache MISS for competitions list: active:all:all:judge:false
✅ Cached competitions list: active:all:all:judge:false
```

### 前端日志验证
- 没有 "Failed to fetch" 错误
- 没有 CORS 错误
- 页面正常加载

### CORS 头部验证
```javascript
// 修复后的 CORS 配置
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'x-judge-session-id',  // ✅ 已添加
  'x-device-id'          // ✅ 已添加
]
```

### React Hooks 依赖验证
```typescript
// 修复后的 useEffect
useEffect(() => {
  if (loadingSession) return;  // ✅ 检查加载状态
  
  if (!currentSession) {
    toast.error('请先选择评委身份');
    router.push(`/${locale}/judge-landing`);
    return;
  }
  // ...
}, [currentSession, loadingSession, router, locale]); // ✅ 包含所有依赖
```

## 结论

✅ **问题已完全修复**

修复涉及两个关键点：
1. **CORS 配置**: 添加了评委会话所需的自定义头部
2. **React Hooks**: 修复了 useEffect 的依赖数组，正确处理会话加载状态

现在评委可以：
- ✅ 正常登录并选择身份
- ✅ 查看比赛列表
- ✅ 点击比赛进入评分页面
- ✅ 正常进行评分操作
- ✅ 会话在页面刷新后保持有效

## 测试日期
2026-04-18

## 测试人员
Kiro AI Assistant
