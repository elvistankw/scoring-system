# 默认路由设置为 Judge Landing Page

## 修改内容

将应用的默认路由从登录页面改为评委登录页面（Judge Landing Page）。

## 修改的文件

### 1. `app/page.tsx` - 根路径重定向
**之前**：重定向到 `/en`
**现在**：重定向到 `/zh/judge-landing`

```typescript
// Root page - redirects to default locale judge landing
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale judge landing page (zh is primary language)
  redirect('/zh/judge-landing');
}
```

### 2. `app/[locale]/page.tsx` - Locale 路径重定向
**之前**：重定向到 `/{locale}/sign-in`
**现在**：重定向到 `/{locale}/judge-landing`

```typescript
// Root locale page - redirects to judge landing
export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Redirect to judge landing page with locale
  redirect(`/${locale}/judge-landing`);
}
```

## 路由行为

### 访问根路径 `/`
- 自动重定向到 `/zh/judge-landing`
- 使用中文作为默认语言（因为这是扯铃比赛评分系统，主要用户是中文用户）

### 访问 `/{locale}` 路径
- `/zh` → 重定向到 `/zh/judge-landing`
- `/en` → 重定向到 `/en/judge-landing`
- 任何其他语言代码 → 重定向到该语言的 judge-landing 页面

## Judge Landing Page 功能

Judge Landing Page (`app/[locale]/(judge)/judge-landing/page.tsx`) 提供：

1. **动态背景**：显示当前活跃赛事的海报图片
2. **赛事信息**：显示赛事名称和描述
3. **评委身份选择**：
   - 如果没有活跃会话：显示"开始评分"按钮
   - 如果有活跃会话：显示当前评委身份和"继续评分"按钮
4. **设备识别**：基于设备ID的评委身份管理
5. **无需登录**：评委通过设备选择身份，无需传统登录

## 用户流程

### 评委用户（主要用户）
```
访问 / 或 /zh
  ↓
自动重定向到 /zh/judge-landing
  ↓
选择评委身份
  ↓
开始评分
```

### 管理员用户
```
访问 / 或 /zh
  ↓
自动重定向到 /zh/judge-landing
  ↓
点击右上角"管理员登录"链接
  ↓
跳转到 /zh/sign-in
  ↓
登录后进入管理后台
```

### 观众/大屏幕
```
直接访问特定路径：
- /zh/scoreboard - 实时比分大屏幕
- /zh/rankings - 排行榜
```

## 为什么选择 Judge Landing 作为默认页面？

### 1. **主要用户群体**
- 评委是系统的主要使用者
- 评委需要快速进入评分界面
- 评委可能不熟悉复杂的登录流程

### 2. **简化流程**
- 评委无需记住账号密码
- 基于设备的身份选择更直观
- 减少评委的操作步骤

### 3. **赛事氛围**
- Judge Landing 页面显示赛事海报
- 营造专业的比赛氛围
- 提供视觉冲击力

### 4. **灵活性**
- 管理员仍可通过链接访问登录页面
- 观众可直接访问大屏幕和排行榜
- 不影响其他用户类型的使用

## 其他入口点

### 管理员登录
- 路径：`/{locale}/sign-in`
- 访问方式：
  - 从 Judge Landing 页面点击"管理员登录"链接
  - 直接访问 URL

### 大屏幕显示
- 实时比分：`/{locale}/scoreboard`
- 排行榜：`/{locale}/rankings`
- 访问方式：直接访问 URL（无需登录）

### 评委控制台
- 评委仪表板：`/{locale}/judge-dashboard`
- 评分页面：`/{locale}/scoring`
- 评分汇总：`/{locale}/score-summary`
- 访问方式：从 Judge Landing 选择身份后自动导航

### 管理后台
- 管理仪表板：`/{locale}/admin-dashboard`
- 评委管理：`/{locale}/judges`
- 选手管理：`/{locale}/athletes`
- 访问方式：管理员登录后访问

## 测试验证

### 1. 测试根路径重定向
```bash
# 访问根路径
curl -I http://localhost:3000/

# 预期：重定向到 /zh/judge-landing
# HTTP/1.1 307 Temporary Redirect
# Location: /zh/judge-landing
```

### 2. 测试 locale 路径重定向
```bash
# 访问中文路径
curl -I http://localhost:3000/zh

# 预期：重定向到 /zh/judge-landing
# HTTP/1.1 307 Temporary Redirect
# Location: /zh/judge-landing

# 访问英文路径
curl -I http://localhost:3000/en

# 预期：重定向到 /en/judge-landing
# HTTP/1.1 307 Temporary Redirect
# Location: /en/judge-landing
```

### 3. 浏览器测试
1. 打开浏览器访问 `http://localhost:3000`
2. 应该自动跳转到 `http://localhost:3000/zh/judge-landing`
3. 看到评委登录页面，显示赛事海报和"开始评分"按钮

## 配置说明

### 默认语言
- 当前设置：中文 (`zh`)
- 原因：扯铃比赛主要在中文地区举办
- 修改方式：在 `app/page.tsx` 中更改重定向目标

### 支持的语言
- 中文 (`zh`)
- 英文 (`en`)
- 配置文件：`i18n/config.ts`

## 注意事项

### 1. SEO 考虑
- 根路径使用 307 临时重定向
- 保留了 metadata 配置
- 搜索引擎可以正确索引各个页面

### 2. 用户体验
- 评委用户：一步到位，直接进入评分流程
- 管理员用户：需要额外点击一次进入登录页面
- 观众用户：直接访问特定 URL

### 3. 安全性
- Judge Landing 页面是公开的（无需认证）
- 管理后台仍然需要登录认证
- 评委身份选择基于设备锁定机制

### 4. 性能
- 重定向是服务器端执行（Next.js redirect）
- 不会增加额外的客户端 JavaScript
- 重定向速度快，用户体验好

## 回滚方案

如果需要恢复到登录页面作为默认页面：

### `app/page.tsx`
```typescript
export default function RootPage() {
  redirect('/zh/sign-in'); // 或 '/en/sign-in'
}
```

### `app/[locale]/page.tsx`
```typescript
export default async function RootPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/sign-in`);
}
```

## 状态
✅ **已完成**
- 根路径重定向已修改
- Locale 路径重定向已修改
- Judge Landing 页面已存在并正常工作
- 准备测试验证

## 下一步
1. 重启 Next.js 开发服务器（如果正在运行）
2. 访问 `http://localhost:3000` 验证重定向
3. 确认 Judge Landing 页面正常显示
4. 测试从 Judge Landing 到其他页面的导航
