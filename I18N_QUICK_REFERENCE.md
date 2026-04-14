# 🌍 i18n 快速参考指南

## 快速开始

### 1. 在服务端组件使用

```tsx
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  
  return <h1>{dict.common.welcome}</h1>;
}
```

### 2. 在客户端组件使用

```tsx
'use client';
import { useTranslation } from '@/i18n/use-dictionary';

export function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('common.submit')}</button>;
}
```

### 3. 添加语言切换器

```tsx
import { LanguageSwitcher } from '@/components/shared/language-switcher';

<LanguageSwitcher currentLocale={locale} />
```

## 常用翻译 Key

### 通用操作
```tsx
t('common.loading')      // 加载中... / Loading...
t('common.submit')       // 提交 / Submit
t('common.cancel')       // 取消 / Cancel
t('common.save')         // 保存 / Save
t('common.delete')       // 删除 / Delete
t('common.edit')         // 编辑 / Edit
t('common.create')       // 创建 / Create
t('common.search')       // 搜索 / Search
```

### 认证
```tsx
t('auth.signIn')         // 登录 / Sign In
t('auth.signUp')         // 注册 / Sign Up
t('auth.email')          // 邮箱 / Email
t('auth.password')       // 密码 / Password
t('auth.signInSuccess')  // 登录成功 / Sign in successful
```

### 管理员
```tsx
t('admin.dashboard')              // 管理员控制台 / Admin Dashboard
t('admin.competitionManagement')  // 比赛管理 / Competition Management
t('admin.athleteManagement')      // 选手管理 / Athlete Management
```

### 选手
```tsx
t('athlete.athletes')      // 选手列表 / Athletes
t('athlete.name')          // 姓名 / Name
t('athlete.athleteNumber') // 选手编号 / Athlete Number
t('athlete.teamName')      // 团队名称 / Team Name
```

### 比赛
```tsx
t('competition.competitions')  // 比赛列表 / Competitions
t('competition.individual')    // 个人 / Individual
t('competition.duoTeam')       // 双人/团队 / Duo/Team
t('competition.challenge')     // 挑战 / Challenge
t('competition.active')        // 进行中 / Active
```

### 评分
```tsx
t('score.actionDifficulty')  // 动作难度 / Action Difficulty
t('score.stageArtistry')     // 舞台艺术 / Stage Artistry
t('score.actionCreativity')  // 动作创意 / Action Creativity
t('score.totalScore')        // 总分 / Total Score
```

### 通知
```tsx
t('notification.success')  // 操作成功 / Operation successful
t('notification.error')    // 操作失败 / Operation failed
t('notification.saved')    // 已保存 / Saved
```

## 文件位置

```
i18n/
├── locales/
│   ├── zh.json          # 中文翻译
│   └── en.json          # 英文翻译
├── config.ts            # 配置
├── get-dictionary.ts    # 服务端加载器
└── use-dictionary.tsx   # 客户端 Hook
```

## 添加新翻译

### 步骤 1: 编辑 zh.json
```json
{
  "mySection": {
    "myKey": "我的翻译"
  }
}
```

### 步骤 2: 编辑 en.json
```json
{
  "mySection": {
    "myKey": "My Translation"
  }
}
```

### 步骤 3: 使用
```tsx
t('mySection.myKey')
```

## URL 结构

- 中文: `/zh/page-name`
- 英文: `/en/page-name`

## 测试页面

访问 `/zh/i18n-demo` 或 `/en/i18n-demo` 查看完整示例

## 支持的语言

- 🇨🇳 中文 (zh) - 默认
- 🇺🇸 English (en)

## 常见问题

**Q: 翻译没有显示？**
A: 检查 key 是否正确，清除缓存 `rm -rf .next`

**Q: 如何获取当前语言？**
A: 从 params 中获取: `const { locale } = await params`

**Q: 如何处理动态内容？**
A: 使用模板字符串: `` `${t('common.welcome')}, ${name}!` ``

## 相关文档

- 📖 完整文档: `i18n/README.md`
- 🎨 主题指南: `THEME_DESIGN_GUIDE.md`
- 🔧 故障排除: `THEME_TROUBLESHOOTING.md`
