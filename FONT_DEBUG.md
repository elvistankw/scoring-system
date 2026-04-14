# 🔍 字体调试指南

## 立即检查字体

### 1. 打开浏览器开发者工具 (F12)

### 2. 在 Console 中运行以下代码：

```javascript
// 检查当前字体
const computedStyle = window.getComputedStyle(document.body);
console.log('当前字体:', computedStyle.fontFamily);

// 检查所有元素的字体
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.fontFamily !== computedStyle.fontFamily) {
    console.log('不同字体元素:', el, style.fontFamily);
  }
});

// 强制应用字体
document.body.style.fontFamily = '"PingFang SC", "Microsoft YaHei", -apple-system, sans-serif';
console.log('字体已强制应用');
```

### 3. 检查 CSS 是否加载

```javascript
// 检查 globals.css 是否加载
const stylesheets = Array.from(document.styleSheets);
console.log('加载的样式表:', stylesheets.length);

// 查找字体相关的 CSS 规则
stylesheets.forEach((sheet, index) => {
  try {
    const rules = Array.from(sheet.cssRules || sheet.rules);
    rules.forEach(rule => {
      if (rule.style && rule.style.fontFamily) {
        console.log(`样式表 ${index} 字体规则:`, rule.selectorText, rule.style.fontFamily);
      }
    });
  } catch (e) {
    console.log(`无法访问样式表 ${index}:`, e.message);
  }
});
```

### 4. 手动测试字体

```javascript
// 创建测试元素
const testDiv = document.createElement('div');
testDiv.innerHTML = '测试字体 Test Font 123';
testDiv.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: red;
  color: white;
  padding: 10px;
  z-index: 9999;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
`;
document.body.appendChild(testDiv);

setTimeout(() => {
  document.body.removeChild(testDiv);
}, 5000);
```

## 可能的问题和解决方案

### 问题 1: CSS 没有加载
**解决方案:**
```bash
# 清除缓存
rm -rf .next
npm run dev
```

### 问题 2: Tailwind 覆盖了字体
**解决方案:**
在 `tailwind.config.js` 中确认字体配置

### 问题 3: 浏览器缓存
**解决方案:**
- 硬刷新: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
- 清除浏览器缓存

### 问题 4: 系统没有对应字体
**解决方案:**
检查系统是否安装了字体：

**Windows:**
- 微软雅黑 (Microsoft YaHei)
- 宋体 (SimSun)

**macOS:**
- PingFang SC
- Hiragino Sans GB

**Linux:**
- Noto Sans CJK SC
- WenQuanYi Micro Hei

## 强制修复

如果字体仍然不正确，在浏览器 Console 中运行：

```javascript
// 强制应用字体到所有元素
const fontStack = '"PingFang SC", "Microsoft YaHei", "微软雅黑", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// 应用到 body
document.body.style.fontFamily = fontStack;

// 应用到所有元素
document.querySelectorAll('*').forEach(el => {
  el.style.fontFamily = fontStack;
});

// 创建全局样式
const style = document.createElement('style');
style.textContent = `
  * {
    font-family: ${fontStack} !important;
  }
`;
document.head.appendChild(style);

console.log('字体已强制应用到所有元素');
```

## 验证字体是否生效

运行以下代码检查：

```javascript
// 检查字体是否正确
const testText = '测试中文字体 Test English Font';
const testEl = document.createElement('div');
testEl.textContent = testText;
testEl.style.fontSize = '20px';
document.body.appendChild(testEl);

const computedFont = window.getComputedStyle(testEl).fontFamily;
console.log('实际使用的字体:', computedFont);

// 检查是否包含中文字体
const hasChinese = /PingFang|YaHei|微软雅黑|SimSun/.test(computedFont);
console.log('是否包含中文字体:', hasChinese);

document.body.removeChild(testEl);
```