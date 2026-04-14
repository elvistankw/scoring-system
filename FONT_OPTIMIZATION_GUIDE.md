# 🔤 字体优化指南 / Font Optimization Guide

## 概述

本项目已优化中英文字体显示，确保在不同操作系统和浏览器中都有良好的字体渲染效果。

## 字体配置

### 主要字体栈

```css
font-family: 
  /* 中文字体 */
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑",
  /* 英文字体 */
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
  /* 通用后备字体 */
  "Noto Sans", "Liberation Sans", sans-serif,
  /* Emoji 字体 */
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

### 不同系统的字体优先级

#### macOS / iOS
1. **PingFang SC** - 苹果系统默认中文字体
2. **Hiragino Sans GB** - 冬青黑体简体中文
3. **-apple-system** - 系统默认英文字体

#### Windows
1. **Microsoft YaHei** - 微软雅黑
2. **微软雅黑** - 中文名称兼容
3. **Segoe UI** - Windows 系统默认英文字体

#### Linux
1. **Noto Sans CJK SC** - Google Noto 字体
2. **Source Han Sans SC** - 思源黑体
3. **WenQuanYi Micro Hei** - 文泉驿微米黑
4. **Liberation Sans** - 开源字体

## 字体渲染优化

### CSS 优化设置

```css
body {
  /* 字体渲染优化 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  
  /* 中文字体优化 */
  font-feature-settings: "kern" 1;
  font-variant-ligatures: common-ligatures;
}
```

### 特殊字体类

#### 中文专用字体
```css
.font-chinese {
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", sans-serif;
}
```

#### 英文专用字体
```css
.font-english {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

#### 等宽字体（代码/数字）
```css
.font-mono {
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
  font-variant-numeric: tabular-nums;
}
```

## 使用方法

### 1. 默认字体
所有元素自动继承优化后的字体栈，无需额外设置。

### 2. 特殊用途字体
```tsx
// 中文专用
<p className="font-chinese">这是中文文本</p>

// 英文专用
<p className="font-english">This is English text</p>

// 等宽字体（代码、数字）
<code className="font-mono">const score = 28.5;</code>
```

### 3. 字重和字号
```tsx
// 字重
<h1 className="font-bold">粗体标题 Bold Title</h1>
<p className="font-medium">中等字重 Medium Weight</p>
<span className="font-light">轻字重 Light Weight</span>

// 字号
<h1 className="text-3xl">大标题 Large Title</h1>
<p className="text-base">正文 Body Text</p>
<small className="text-sm">小字 Small Text</small>
```

## 测试页面

访问字体测试页面查看渲染效果：
- 中文: `/zh/font-test`
- 英文: `/en/font-test`

## 字体加载优化

### 1. 字体预加载
在 `app/layout.tsx` 中添加：

```tsx
<head>
  <link
    rel="preload"
    href="/fonts/PingFangSC-Regular.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
</head>
```

### 2. 字体显示策略
```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* 快速显示后备字体，然后替换 */
}
```

## 常见问题

### Q: 中文字体显示不正确？

**A: 检查以下几点：**
1. 确认系统已安装对应字体
2. 清除浏览器缓存
3. 检查 CSS 是否正确加载

### Q: 字体在不同浏览器中显示不一致？

**A: 解决方案：**
1. 使用 Web 字体确保一致性
2. 设置合适的后备字体
3. 添加字体渲染优化 CSS

### Q: 字体加载慢？

**A: 优化方法：**
1. 使用字体预加载
2. 选择 `font-display: swap`
3. 压缩字体文件
4. 使用 CDN 加速

## 最佳实践

### ✅ 推荐做法

1. **使用系统字体**
   ```css
   font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
   ```

2. **设置合适的行高**
   ```css
   line-height: 1.6; /* 中文 */
   line-height: 1.5; /* 英文 */
   ```

3. **优化字体渲染**
   ```css
   -webkit-font-smoothing: antialiased;
   text-rendering: optimizeLegibility;
   ```

4. **使用相对单位**
   ```css
   font-size: 1rem; /* 而不是 16px */
   ```

### ❌ 避免做法

1. **不要硬编码字体**
   ```css
   /* ❌ 不好 */
   font-family: "Arial";
   
   /* ✅ 好 */
   font-family: -apple-system, BlinkMacSystemFont, sans-serif;
   ```

2. **不要忽略后备字体**
   ```css
   /* ❌ 不好 */
   font-family: "PingFang SC";
   
   /* ✅ 好 */
   font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
   ```

3. **不要使用过小的字号**
   ```css
   /* ❌ 不好 - 影响可读性 */
   font-size: 10px;
   
   /* ✅ 好 */
   font-size: 14px; /* 最小推荐字号 */
   ```

## 字体文件

### 推荐的 Web 字体

如果需要自定义字体，推荐使用：

1. **Noto Sans CJK** - Google 开源中文字体
2. **Source Han Sans** - Adobe 思源黑体
3. **Inter** - 现代英文字体
4. **JetBrains Mono** - 编程字体

### 字体格式优先级

```css
@font-face {
  font-family: 'CustomFont';
  src: 
    url('font.woff2') format('woff2'),    /* 现代浏览器 */
    url('font.woff') format('woff'),      /* 较老浏览器 */
    url('font.ttf') format('truetype');   /* 后备方案 */
}
```

## 相关文件

- `app/globals.css` - 全局字体配置
- `tailwind.config.js` - Tailwind 字体配置
- `app/[locale]/font-test/` - 字体测试页面
- `components/shared/` - 组件字体样式

## 性能监控

### 字体加载性能

```javascript
// 监控字体加载时间
document.fonts.ready.then(() => {
  console.log('所有字体加载完成');
});

// 检查特定字体是否可用
if (document.fonts.check('16px PingFang SC')) {
  console.log('PingFang SC 字体可用');
}
```

### Core Web Vitals

确保字体优化不影响：
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)  
- **CLS** (Cumulative Layout Shift)

## 更新日志

- ✅ 2024-04-13: 添加完整的中英文字体栈
- ✅ 2024-04-13: 优化字体渲染设置
- ✅ 2024-04-13: 添加系统特定字体优化
- ✅ 2024-04-13: 创建字体测试页面