# Judge User Menu - "退出登录" 改为 "退出会话"

**日期:** 2026年4月19日  
**状态:** ✅ **完成**

## 需求
将评审（judge）用户菜单中的"退出登录"文本改为"退出会话"（End Session），以更准确地反映设备会话系统的特性。

## 实现内容

### 1. 添加新的翻译键

#### 中文翻译 (i18n/locales/zh.json)
```json
"judge": {
  ...
  "endSession": "退出会话",
  "endSessionSuccess": "已成功退出会话",
  "endSessionError": "退出会话失败，请重试"
}
```

#### 英文翻译 (i18n/locales/en.json)
```json
"judge": {
  ...
  "endSession": "End Session",
  "endSessionSuccess": "Session ended successfully",
  "endSessionError": "Failed to end session, please try again"
}
```

### 2. 更新 BilingualText 组件映射

在 `components/shared/bilingual-text.tsx` 中添加：
```typescript
'judge.endSession': { zh: '退出会话', en: 'End Session' }
```

### 3. 更新 Judge 页面组件

#### Judge Dashboard (components/judge/judge-dashboard-client.tsx)
- 将按钮注释从 `{/* Logout Button */}` 改为 `{/* End Session Button */}`
- 将翻译键从 `common.logout` 改为 `judge.endSession`

#### Score Summary (components/judge/score-summary-client.tsx)
- 将按钮注释从 `{/* Logout Button */}` 改为 `{/* End Session Button */}`
- 将翻译键从 `common.logout` 改为 `judge.endSession`

## 修改的文件

1. `i18n/locales/zh.json` - 添加中文翻译
2. `i18n/locales/en.json` - 添加英文翻译
3. `components/shared/bilingual-text.tsx` - 添加翻译映射
4. `components/judge/judge-dashboard-client.tsx` - 更新按钮文本
5. `components/judge/score-summary-client.tsx` - 更新按钮文本

## 显示效果

### 之前
- 中文: "退出登录 / Logout"
- 英文: "Logout"

### 之后
- 中文: "退出会话 / End Session"
- 英文: "End Session"

## 设计理由

### 为什么改为"退出会话"？

1. **准确性**: Judge 使用的是设备会话系统（device-based session），不是传统的用户登录系统
2. **区分性**: 
   - Admin 使用传统登录 → "退出登录" (Logout)
   - Judge 使用设备会话 → "退出会话" (End Session)
3. **用户体验**: 更清晰地传达操作的实际效果 - 结束当前设备上的评审会话

### 技术背景

Judge 系统使用两种身份验证方式：
- **设备会话**: Judge 在设备上选择身份，创建会话，无需密码
- **传统登录**: Admin 使用用户名/密码登录

"退出会话"更准确地描述了 Judge 的操作 - 结束设备上的会话，而不是传统意义上的"登出"。

## 测试检查清单

- [ ] Judge Dashboard 页面显示"退出会话 / End Session"
- [ ] Score Summary 页面显示"退出会话 / End Session"
- [ ] 中文环境下显示正确
- [ ] 英文环境下显示正确
- [ ] 点击按钮后正确结束会话
- [ ] Admin 页面仍然显示"退出登录 / Logout"（未修改）

## 相关文件位置

### 翻译文件
- `i18n/locales/zh.json` - 中文翻译
- `i18n/locales/en.json` - 英文翻译

### 组件文件
- `components/judge/judge-dashboard-client.tsx` - 评审控制台
- `components/judge/score-summary-client.tsx` - 评分汇总
- `components/shared/bilingual-text.tsx` - 双语文本组件

### 未修改的文件
- `components/shared/user-menu.tsx` - Admin 用户菜单（保持"退出登录"）
- `components/admin/admin-user-menu.tsx` - Admin 专用菜单（保持"退出登录"）

## 注意事项

1. **Admin vs Judge**: Admin 页面继续使用 `common.logout`，只有 Judge 页面使用 `judge.endSession`
2. **一致性**: 所有 Judge 相关页面都应使用 `judge.endSession`
3. **未来扩展**: 如果添加新的 Judge 页面，记得使用 `judge.endSession` 而不是 `common.logout`

---

**状态**: ✅ 所有更改已完成，等待测试验证
