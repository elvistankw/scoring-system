# 🔧 主题故障排除指南

## 问题诊断步骤

### 1. 访问测试页面
打开浏览器访问: `http://localhost:3000/zh/theme-test`

这个页面会显示:
- 当前主题设置
- HTML 类名
- 各种颜色和组件的实际效果
- 调试信息

### 2. 检查浏览器控制台

打开浏览器开发者工具 (F12)，查看:

#### Console 标签
应该看到类似这样的日志:
```
Theme updated: { theme: 'light', resolved: 'light', classList: 'light' }
```

#### Elements 标签
检查 `<html>` 标签:
```html
<html lang="zh" class="light">
  <!-- 或者 -->
<html lang="zh" class="dark">
```

### 3. 检查 localStorage

在 Console 中运行:
```javascript
localStorage.getItem('scoring-system-theme')
```

应该返回: `"light"`, `"dark"`, 或 `"system"`

### 4. 手动测试主题切换

在 Console 中运行:
```javascript
// 切换到深色模式
document.documentElement.classList.remove('light');
document.documentElement.classList.add('dark');

// 切换到浅色模式
document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');
```

观察页面颜色是否改变。

### 5. 检查 CSS 变量

在 Console 中运行:
```javascript
// 检查当前背景色
getComputedStyle(document.documentElement).getPropertyValue('--background')

// 检查当前文字色
getComputedStyle(document.documentElement).getPropertyValue('--foreground')
```

## 常见问题和解决方案

### 问题 1: 主题切换不生效

**症状**: 点击主题切换按钮，页面颜色不变

**检查**:
1. 打开 Console，看是否有 "Theme updated" 日志
2. 检查 `<html>` 标签的 class 是否改变
3. 检查是否有 CSS 冲突

**解决方案**:
```bash
# 清除 .next 缓存
rm -rf .next
npm run dev
```

### 问题 2: 页面刷新后主题丢失

**症状**: 切换主题后刷新页面，主题恢复默认

**检查**:
```javascript
localStorage.getItem('scoring-system-theme')
```

**解决方案**:
- 确保浏览器允许 localStorage
- 检查是否在隐私模式/无痕模式

### 问题 3: 某些组件颜色不对

**症状**: 大部分组件正常，个别组件颜色错误

**检查**:
- 查看该组件的 className
- 确认是否使用了 `dark:` 前缀

**解决方案**:
更新组件样式，确保包含 dark mode 类名:
```tsx
// ❌ 错误
<div className="bg-white text-black">

// ✅ 正确
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

### 问题 4: Tailwind 类名不生效

**症状**: 使用了 Tailwind 类名但没有样式

**检查**:
```bash
# 查看 Tailwind 版本
npm list tailwindcss
```

**解决方案**:
```bash
# 重新安装依赖
npm install
npm run dev
```

### 问题 5: 首次加载闪烁

**症状**: 页面加载时先显示错误主题，然后切换

**原因**: 这是 SSR 和客户端主题不匹配

**解决方案**: 已在 `app/layout.tsx` 中添加了阻塞脚本，应该不会出现此问题。如果仍然闪烁，检查:
```tsx
// app/layout.tsx 中应该有这段代码
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      var theme = localStorage.getItem('scoring-system-theme') || 'system';
      // ...
    })();
  `
}} />
```

## 调试命令

### 检查 Tailwind 配置
```bash
# 查看 PostCSS 配置
cat postcss.config.mjs

# 查看 package.json 中的 Tailwind 版本
cat package.json | grep tailwind
```

### 检查编译输出
```bash
# 查看编译后的 CSS (开发模式)
# 打开浏览器开发者工具 -> Network -> 找到 globals.css
# 查看是否包含 .dark 选择器
```

### 强制重新编译
```bash
# 清除所有缓存
rm -rf .next
rm -rf node_modules/.cache

# 重新启动
npm run dev
```

## 验证清单

- [ ] `<html>` 标签有 `suppressHydrationWarning` 属性
- [ ] `<html>` 标签的 class 会根据主题改变 (`light` 或 `dark`)
- [ ] localStorage 中保存了主题设置
- [ ] ThemeProvider 正确包裹了应用
- [ ] 所有组件都使用了 `dark:` 前缀
- [ ] globals.css 中定义了 `.dark` 选择器
- [ ] PostCSS 配置正确
- [ ] Tailwind v4 正确安装

## 获取帮助

如果以上步骤都无法解决问题，请提供以下信息:

1. **浏览器信息**: Chrome/Firefox/Safari 版本
2. **Console 输出**: 完整的错误信息
3. **HTML 检查**: `<html>` 标签的完整内容
4. **localStorage**: `localStorage.getItem('scoring-system-theme')` 的返回值
5. **测试页面截图**: `/zh/theme-test` 页面的截图
6. **CSS 变量值**: 
   ```javascript
   {
     background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
     foreground: getComputedStyle(document.documentElement).getPropertyValue('--foreground')
   }
   ```

## 快速修复脚本

创建一个文件 `fix-theme.js`:
```javascript
// 在浏览器 Console 中运行
(function() {
  console.log('=== 主题诊断 ===');
  
  // 1. 检查 HTML 类名
  console.log('HTML class:', document.documentElement.className);
  
  // 2. 检查 localStorage
  console.log('localStorage theme:', localStorage.getItem('scoring-system-theme'));
  
  // 3. 检查 CSS 变量
  const styles = getComputedStyle(document.documentElement);
  console.log('CSS Variables:', {
    background: styles.getPropertyValue('--background'),
    foreground: styles.getPropertyValue('--foreground'),
  });
  
  // 4. 强制设置为 light mode
  console.log('强制设置为 light mode...');
  localStorage.setItem('scoring-system-theme', 'light');
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  
  console.log('完成！刷新页面查看效果。');
})();
```

## 相关文件

- `app/globals.css` - CSS 变量和样式定义
- `app/layout.tsx` - 根布局，包含主题初始化脚本
- `components/shared/theme-provider.tsx` - 主题切换逻辑
- `components/shared/providers.tsx` - Provider 包装器
- `postcss.config.mjs` - PostCSS 配置
- `package.json` - Tailwind 版本信息
