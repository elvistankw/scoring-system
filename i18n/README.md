# 🌍 i18n 国际化系统使用指南

## 概述

本项目使用自定义的 i18n 系统，支持中文 (zh) 和英文 (en) 两种语言。

## 文件结构

```
i18n/
├── locales/
│   ├── zh.json          # 中文翻译
│   └── en.json          # 英文翻译
├── config.ts            # i18n 配置
├── get-dictionary.ts    # 服务端字典加载器
├── use-dictionary.tsx   # 客户端字典 Hook (JSX)
└── README.md            # 本文件
```

## 支持的语言

- **zh** (中文) - 默认语言 🇨🇳
- **en** (English) - 英文 🇺🇸

## 使用方法

### 1. 在服务端组件中使用

```tsx
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';

export default async function MyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div>
      <h1>{dict.common.welcome}</h1>
      <p>{dict.metadata.home.description}</p>
    </div>
  );
}
```

### 2. 在客户端组件中使用

```tsx
'use client';

import { useTranslation } from '@/i18n/use-dictionary';

export function MyComponent() {
  const { t, dict } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{dict.auth.signIn}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### 3. 使用语言切换器

```tsx
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export function Header({ locale }: { locale: Locale }) {
  return (
    <header>
      <LanguageSwitcher currentLocale={locale} />
    </header>
  );
}
```

## 翻译文件结构

### zh.json / en.json

```json
{
  "common": {
    "loading": "加载中..." / "Loading...",
    "submit": "提交" / "Submit",
    ...
  },
  "auth": {
    "signIn": "登录" / "Sign In",
    "signUp": "注册" / "Sign Up",
    ...
  },
  "admin": {
    "dashboard": "管理员控制台" / "Admin Dashboard",
    ...
  },
  ...
}
```

## 添加新翻译

### 步骤 1: 在 zh.json 中添加中文

```json
{
  "myFeature": {
    "title": "我的功能",
    "description": "这是一个新功能"
  }
}
```

### 步骤 2: 在 en.json 中添加对应的英文

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is a new feature"
  }
}
```

### 步骤 3: 在组件中使用

```tsx
const { t } = useTranslation();

<h1>{t('myFeature.title')}</h1>
<p>{t('myFeature.description')}</p>
```

## 翻译分类

### common
通用词汇：按钮、操作、状态等

### auth
认证相关：登录、注册、验证等

### admin
管理员功能：控制台、管理等

### athlete
选手相关：选手信息、管理等

### competition
比赛相关：比赛信息、类型、状态等

### judge
评审相关：评分、评审控制台等

### score
评分相关：评分项、分数等

### display
展示相关：大屏幕、排行榜等

### metadata
页面元数据：标题、描述等

### validation
表单验证：错误提示等

### notification
通知消息：成功、失败、警告等

## 最佳实践

### ✅ 推荐做法

1. **使用语义化的 key**
   ```tsx
   // ✅ 好
   t('auth.signIn')
   
   // ❌ 不好
   t('button1')
   ```

2. **保持翻译文件同步**
   - 在 zh.json 添加翻译后，立即在 en.json 添加对应翻译
   - 确保两个文件的结构完全一致

3. **使用嵌套结构组织翻译**
   ```json
   {
     "athlete": {
       "form": {
         "name": "姓名",
         "number": "编号"
       }
     }
   }
   ```

4. **为长文本提供 fallback**
   ```tsx
   t('some.long.key', 'Default text if key not found')
   ```

### ❌ 避免做法

1. **不要硬编码文本**
   ```tsx
   // ❌ 不好
   <button>提交</button>
   
   // ✅ 好
   <button>{t('common.submit')}</button>
   ```

2. **不要在翻译中包含 HTML**
   ```json
   // ❌ 不好
   {
     "message": "<strong>警告</strong>: 操作失败"
   }
   
   // ✅ 好
   {
     "warning": "警告",
     "operationFailed": "操作失败"
   }
   ```

3. **不要使用过长的 key**
   ```tsx
   // ❌ 不好
   t('admin.dashboard.competition.management.form.submit.button.text')
   
   // ✅ 好
   t('common.submit')
   ```

## URL 结构

- 中文: `/zh/...`
- 英文: `/en/...`

示例:
- `/zh/admin-dashboard` - 中文管理员控制台
- `/en/admin-dashboard` - 英文管理员控制台

## 语言切换

用户可以通过以下方式切换语言:

1. **使用 LanguageSwitcher 组件**
   - 点击语言选择器
   - 选择目标语言
   - 自动跳转到对应语言的页面

2. **直接修改 URL**
   - 将 URL 中的 `/zh/` 改为 `/en/`
   - 或反之

## 类型安全

使用 TypeScript 确保类型安全:

```tsx
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';

// Dictionary 类型包含所有翻译的类型定义
// Locale 类型限制为 'zh' | 'en'
```

## 测试翻译

### 检查翻译完整性

```bash
# 比较两个翻译文件的 key
node scripts/check-i18n.js
```

### 手动测试

1. 访问 `/zh/...` 查看中文
2. 访问 `/en/...` 查看英文
3. 使用语言切换器测试切换功能

## 常见问题

### Q: 如何添加新语言？

A: 
1. 在 `i18n/locales/` 创建新的 JSON 文件 (如 `ja.json`)
2. 在 `i18n/config.ts` 的 `locales` 数组中添加新语言
3. 在 `i18n/get-dictionary.ts` 添加导入逻辑
4. 更新 `localeNames` 和 `localeFlags`

### Q: 翻译没有生效？

A:
1. 检查 key 是否正确
2. 确认翻译文件格式正确 (有效的 JSON)
3. 清除 `.next` 缓存: `rm -rf .next`
4. 重启开发服务器

### Q: 如何处理动态内容？

A: 使用模板字符串或参数:

```tsx
// 方法 1: 模板字符串
const message = `${t('common.welcome')}, ${username}!`;

// 方法 2: 分离静态和动态部分
<span>{t('common.welcome')}, {username}!</span>
```

### Q: 如何处理复数形式？

A: 在翻译文件中提供不同的 key:

```json
{
  "athlete": {
    "count": {
      "zero": "没有选手",
      "one": "1 个选手",
      "other": "{count} 个选手"
    }
  }
}
```

## 相关文件

- `components/shared/language-switcher.tsx` - 语言切换组件
- `components/shared/providers.tsx` - Provider 包装器
- `app/[locale]/layout.tsx` - Locale 布局
- `i18n/config.ts` - i18n 配置
- `i18n/get-dictionary.ts` - 字典加载器
- `i18n/use-dictionary.tsx` - 客户端 Hook

## 贡献指南

添加新翻译时:

1. ✅ 确保中英文同步
2. ✅ 使用语义化的 key
3. ✅ 保持 JSON 格式正确
4. ✅ 测试两种语言
5. ✅ 更新相关文档
