# 🎨 主题设计指南 (Theme Design Guide)

## 概述

本项目支持完整的 Light Mode 和 Dark Mode，使用 CSS 变量实现主题切换。

## 配色方案

### Light Mode (浅色模式)
- **背景色**: 白色系 (#ffffff, #f9fafb, #f3f4f6)
- **文字色**: 深灰色系 (#111827, #374151, #6b7280)
- **卡片色**: 白色背景 + 浅灰边框
- **强调色**: 蓝色 (#3b82f6)

### Dark Mode (深色模式)
- **背景色**: 黑色系 (#0a0a0a, #1f1f1f, #2a2a2a)
- **文字色**: 浅灰色系 (#f9fafb, #e5e7eb, #9ca3af)
- **卡片色**: 深灰背景 + 深色边框
- **强调色**: 亮蓝色 (#3b82f6, #60a5fa)

## CSS 变量使用

### 背景色
```css
background: var(--background);           /* 主背景 */
background: var(--background-secondary); /* 次级背景 */
background: var(--background-tertiary);  /* 三级背景 */
```

### 文字颜色
```css
color: var(--foreground);           /* 主文字 */
color: var(--foreground-secondary); /* 次级文字 */
color: var(--foreground-muted);     /* 弱化文字 */
```

### 卡片样式
```css
background: var(--card-background);
border: 1px solid var(--card-border);
```

或使用工具类：
```html
<div class="card">卡片内容</div>
```

### 输入框样式
```css
background: var(--input-background);
border: 1px solid var(--input-border);
```

或使用工具类：
```html
<input class="input" type="text" />
```

### 按钮样式
```html
<!-- 主按钮 -->
<button class="btn-primary">提交</button>

<!-- 次级按钮 -->
<button class="btn-secondary">取消</button>
```

## Tailwind 类名使用

### 推荐的 Tailwind 类名组合

#### 卡片组件
```html
<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
  <h3 class="text-gray-900 dark:text-gray-100">标题</h3>
  <p class="text-gray-600 dark:text-gray-400">描述文字</p>
</div>
```

#### 输入框
```html
<input 
  type="text"
  class="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
/>
```

#### 按钮
```html
<!-- 主按钮 -->
<button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
  提交
</button>

<!-- 次级按钮 -->
<button class="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-colors">
  取消
</button>
```

#### 文字颜色
```html
<h1 class="text-gray-900 dark:text-gray-100">主标题</h1>
<p class="text-gray-700 dark:text-gray-300">正文</p>
<span class="text-gray-500 dark:text-gray-400">辅助文字</span>
```

## 组件示例

### 评审打分卡片
```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-all">
  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
    选手信息
  </h3>
  <div className="space-y-2">
    <p className="text-gray-700 dark:text-gray-300">姓名: 张三</p>
    <p className="text-gray-600 dark:text-gray-400">编号: A001</p>
  </div>
</div>
```

### 大屏幕显示
```tsx
<div className="min-h-screen bg-white dark:bg-gray-950 p-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
      实时比分
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 比分卡片 */}
    </div>
  </div>
</div>
```

### 表单输入
```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      选手姓名
    </label>
    <input
      type="text"
      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="请输入姓名"
    />
  </div>
</form>
```

## 状态颜色

### 成功状态
```html
<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg p-4">
  操作成功！
</div>
```

### 警告状态
```html
<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-lg p-4">
  请注意！
</div>
```

### 错误状态
```html
<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
  操作失败！
</div>
```

## 响应式设计

### 平板适配 (iPad)
```tsx
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">标题</h1>
</div>
```

### 大屏幕适配 (1080P/4K)
```tsx
<div className="text-base lg:text-lg xl:text-xl 2xl:text-2xl">
  大屏幕文字
</div>
```

## 主题切换

### 使用 ThemeToggle 组件
```tsx
import { ThemeToggle } from '@/components/shared/theme-provider';

<ThemeToggle className="fixed top-4 right-4" />
```

### 使用 useTheme Hook
```tsx
import { useTheme } from '@/components/shared/theme-provider';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      切换主题
    </button>
  );
}
```

## 最佳实践

### ✅ 推荐做法
1. 使用 `dark:` 前缀为所有颜色类添加深色模式样式
2. 使用语义化的颜色变量（如 `--foreground` 而不是 `--text-color`）
3. 确保文字和背景有足够的对比度（WCAG AA 标准）
4. 使用 `transition-colors` 实现平滑的主题切换

### ❌ 避免做法
1. 不要硬编码颜色值（如 `#000000`）
2. 不要忘记为深色模式添加对应样式
3. 不要使用过于鲜艳的颜色（影响阅读体验）
4. 不要在 Light Mode 使用浅色文字配白色背景

## 测试清单

- [ ] Light Mode 下背景是白色，文字是深色
- [ ] Dark Mode 下背景是深色，文字是浅色
- [ ] 卡片在两种模式下都清晰可见
- [ ] 输入框在两种模式下都易于识别
- [ ] 按钮在两种模式下都有明显的悬停效果
- [ ] 主题切换动画流畅
- [ ] 在平板和大屏幕上显示正常

## 参考资源

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
