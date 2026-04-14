# ⚙️ Settings Modal 使用指南

## 概述

Settings Modal 现在集成了主题切换和语言切换功能。

## 使用方法

### 1. 导入组件

```tsx
import { SettingsModal } from '@/components/shared/settings-modal';
import type { Locale } from '@/i18n/config';
```

### 2. 在组件中使用

```tsx
'use client';

import { useState } from 'react';
import { SettingsModal } from '@/components/shared/settings-modal';

export function MyComponent({ locale }: { locale: Locale }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSettingsOpen(true)}>
        打开设置
      </button>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLocale={locale}
      />
    </>
  );
}
```

### 3. 在服务端组件中获取 locale

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return <MyClientComponent locale={locale as Locale} />;
}
```

## 功能

### 主题切换
- ☀️ **浅色模式** - 明亮清晰的界面
- 🌙 **深色模式** - 护眼舒适的界面
- 💻 **跟随系统** - 自动跟随系统设置

### 语言切换
- 🇨🇳 **中文** - 简体中文
- 🇺🇸 **English** - 英文

## Props

```typescript
interface SettingsModalProps {
  isOpen: boolean;        // 是否打开模态框
  onClose: () => void;    // 关闭回调函数
  currentLocale: Locale;  // 当前语言 ('zh' | 'en')
}
```

## 示例：在布局中使用

```tsx
// app/[locale]/(admin)/layout.tsx
'use client';

import { useState } from 'react';
import { SettingsModal } from '@/components/shared/settings-modal';
import type { Locale } from '@/i18n/config';

export default function AdminLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div>
      <header>
        <button onClick={() => setIsSettingsOpen(true)}>
          <svg>...</svg> {/* 设置图标 */}
        </button>
      </header>

      <main>{children}</main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLocale={locale}
      />
    </div>
  );
}
```

## 特性

### ✅ 响应式设计
- 在移动端、平板和桌面端都有良好的显示效果
- 最大高度限制，内容可滚动

### ✅ 无障碍支持
- 键盘导航支持
- ARIA 标签
- 焦点管理

### ✅ 平滑过渡
- 主题切换有平滑的过渡动画
- 语言切换后自动跳转到对应语言的页面

### ✅ 持久化
- 主题设置保存到 localStorage
- 语言设置通过 URL 路径保存

## 样式定制

Settings Modal 使用 Tailwind CSS 类名，可以通过修改组件源码来定制样式：

```tsx
// components/shared/settings-modal.tsx

// 修改模态框宽度
<div className="max-w-md w-full"> // 改为 max-w-lg

// 修改按钮样式
<button className="px-4 py-2 ...">
```

## 注意事项

1. **必须传入 currentLocale**
   - SettingsModal 需要知道当前语言才能正确显示和切换

2. **在客户端组件中使用**
   - SettingsModal 是客户端组件（'use client'）
   - 需要在客户端组件中使用

3. **语言切换会刷新页面**
   - 切换语言后会跳转到新的 URL
   - 页面会重新加载以应用新语言

## 相关文件

- `components/shared/settings-modal.tsx` - Settings Modal 组件
- `components/shared/theme-provider.tsx` - 主题提供者
- `components/shared/language-switcher.tsx` - 独立的语言切换器（如果需要）
- `i18n/config.ts` - i18n 配置
- `i18n/locales/zh.json` - 中文翻译
- `i18n/locales/en.json` - 英文翻译
