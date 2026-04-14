# 降级到 Tailwind CSS v3 的步骤

Tailwind v4 目前还在 beta 阶段，可能存在兼容性问题。建议降级到稳定的 v3 版本。

## 步骤 1: 更新 package.json

```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

## 步骤 2: 创建 tailwind.config.js

创建文件 `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 步骤 3: 更新 postcss.config.mjs

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

## 步骤 4: 更新 app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 保持现有的 CSS 变量和自定义样式 */
```

## 步骤 5: 重新启动

```bash
rm -rf .next
npm run dev
```
