# Judge Landing Page - 动态背景海报

**日期:** 2026年4月19日  
**状态:** ✅ **完成**

## 需求
将 Judge Landing Page 的背景从固定的动画背景改为动态的比赛海报，每场比赛可以有自己的视觉效果。

## 核心概念

### UI 设计
- **页面正中间**: 一个大的 CTA 按钮 "开始评分 / Start Judging"
- **背景**: 不是写死的，而是从数据库读取当前比赛的海报
- **动态内容**: 每场比赛可以上传自己的海报图片

### 实现方式
```
Admin 上传比赛海报 → 存储在 events 表 → Judge 登录看到当前比赛的海报
```

## 实现内容

### 1. 创建 Events Hook (`hooks/use-events.ts`)

#### useActiveEvent Hook
```typescript
export function useActiveEvent() {
  // 获取当前活跃的 event
  // 公开访问，无需认证
  // 每分钟自动刷新
}
```

**特性:**
- ✅ 公开访问（无需认证）
- ✅ 自动刷新（每60秒）
- ✅ 使用 SWR 缓存
- ✅ 返回活跃 event 或默认值

#### useEvents Hook
```typescript
export function useEvents() {
  // 获取所有 events（Admin 专用）
}
```

### 2. 更新 Judge Landing Page

#### 主要改动

**之前:**
```tsx
<AnimatedBackground>
  {/* 固定的动画背景 */}
</AnimatedBackground>
```

**之后:**
```tsx
<div className="absolute inset-0 z-0">
  <Image
    src={posterUrl}  // 从 event 获取
    alt={eventName}
    fill
    className="object-cover"
    priority
  />
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
</div>
```

#### 新增功能

1. **动态背景图片**
   - 从活跃 event 获取 `poster_url`
   - 使用 Next.js Image 组件优化加载
   - 添加渐变遮罩提高文字可读性

2. **Event 信息显示**
   - 显示 event 名称
   - 显示 event 描述
   - 自动适配中英文

3. **更大的 CTA 按钮**
   - 从 `px-12 py-4 text-xl` 升级到 `px-16 py-6 text-2xl`
   - 添加 hover 缩放效果
   - 更醒目的渐变色

## 数据流

### 获取活跃 Event
```
Judge Landing Page
  ↓
useActiveEvent() hook
  ↓
GET /api/events/active
  ↓
Backend: getActiveEvent()
  ↓
SELECT * FROM events WHERE status = 'active'
  ↓
返回活跃 event 或默认值
```

### 默认值处理
如果没有活跃的 event，后端返回默认值：
```json
{
  "success": true,
  "data": {
    "id": null,
    "name": "扯铃比赛 / Diabolo Competition",
    "poster_url": "/default-event-poster.jpg",
    "background_video_url": null,
    "description": "欢迎参加扯铃比赛评分 / Welcome to Diabolo Competition Judging",
    "start_date": null,
    "end_date": null
  }
}
```

## Event 表结构

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  poster_url TEXT,                    -- 海报图片 URL
  background_video_url TEXT,          -- 背景视频 URL (未来功能)
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'inactive'
  description TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

## Admin 管理 Events

### 已有的 API 端点

1. **GET /api/events/active** - 获取活跃 event（公开）
2. **GET /api/events** - 获取所有 events（Admin）
3. **POST /api/events** - 创建 event（Admin）
4. **PUT /api/events/:id** - 更新 event（Admin）
5. **DELETE /api/events/:id** - 删除 event（Admin）
6. **POST /api/events/:id/activate** - 激活 event（Admin）

### Event 管理流程

```
Admin 创建 Event
  ↓
上传海报图片到 poster_url
  ↓
设置 status = 'active'
  ↓
系统自动将其他 events 设为 'inactive'
  ↓
Judge Landing Page 自动显示新海报
```

## 视觉效果

### 背景层次
```
1. 海报图片 (object-cover, fill)
2. 渐变遮罩 (from-black/60 via-black/50 to-black/70)
3. 内容层 (z-10)
```

### 文字可读性
- ✅ 深色渐变遮罩
- ✅ 文字阴影 (drop-shadow)
- ✅ 白色文字 + 半透明背景卡片

### 响应式设计
- ✅ 移动端: text-5xl
- ✅ 桌面端: text-7xl
- ✅ 图片自适应: object-cover

## 文件修改

### 新增文件
- `hooks/use-events.ts` - Events 数据获取 hook

### 修改文件
- `components/judge/judge-landing-client.tsx` - 使用动态背景

### 已存在（无需修改）
- `backend/controllers/events.controller.js` - Events API
- `backend/routes/events.routes.js` - Events 路由
- `backend/migrations/004_create_events_table.sql` - 数据库表
- `interface/event.ts` - TypeScript 接口
- `lib/api-config.ts` - API 端点配置

## 使用示例

### Admin 创建新比赛 Event

```javascript
POST /api/events
{
  "name": "2026 全国扯铃锦标赛 / 2026 National Diabolo Championship",
  "poster_url": "https://example.com/posters/2026-championship.jpg",
  "description": "欢迎参加2026年全国扯铃锦标赛 / Welcome to 2026 National Diabolo Championship",
  "start_date": "2026-05-01",
  "end_date": "2026-05-03"
}
```

### Admin 激活 Event

```javascript
POST /api/events/1/activate
```

系统会：
1. 将所有其他 events 设为 `inactive`
2. 将 event ID 1 设为 `active`
3. Judge Landing Page 自动显示新海报

### Judge 访问 Landing Page

```
访问 /judge-landing
  ↓
自动获取活跃 event
  ↓
显示 event 海报作为背景
  ↓
显示 event 名称和描述
  ↓
点击"开始评分"按钮
```

## 优势

### 1. 灵活性
- ✅ 每场比赛可以有独特的视觉风格
- ✅ 无需修改代码即可更换背景
- ✅ 支持多场比赛切换

### 2. 品牌一致性
- ✅ 比赛海报与实际比赛视觉统一
- ✅ 提升专业感和品牌认知

### 3. 用户体验
- ✅ 评委看到的是当前比赛的视觉
- ✅ 更有沉浸感和代入感
- ✅ 清晰知道正在评分的是哪场比赛

### 4. 技术优势
- ✅ 使用 Next.js Image 优化加载
- ✅ SWR 缓存减少请求
- ✅ 自动刷新保持最新
- ✅ 优雅降级（默认海报）

## 未来扩展

### 1. 背景视频支持
```typescript
{
  background_video_url: "https://example.com/videos/intro.mp4"
}
```

### 2. 多语言海报
```typescript
{
  poster_url_zh: "https://example.com/posters/zh.jpg",
  poster_url_en: "https://example.com/posters/en.jpg"
}
```

### 3. 动画效果
- 海报淡入淡出切换
- 视差滚动效果
- 粒子特效叠加

## 测试检查清单

- [ ] 有活跃 event 时显示其海报
- [ ] 无活跃 event 时显示默认海报
- [ ] Event 名称和描述正确显示
- [ ] 图片加载优化（priority, quality）
- [ ] 文字在深色和浅色海报上都可读
- [ ] 响应式设计在移动端正常
- [ ] "开始评分"按钮醒目且易点击
- [ ] Event 切换后自动更新（60秒内）

---

**状态**: ✅ 实现完成，等待测试和反馈
**下一步**: Admin 需要上传第一张比赛海报并激活 event
