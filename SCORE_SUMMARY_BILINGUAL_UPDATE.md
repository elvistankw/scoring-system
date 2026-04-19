# Score Summary Page Bilingual Support Implementation

## Summary
Successfully added complete bilingual support (Chinese/English) to the score-summary page by replacing all hardcoded Chinese text with translation keys.

## Changes Made

### 1. Translation Keys Added

#### Chinese (i18n/locales/zh.json)
Added the following keys under `judge` section:
- `pleaseSelectJudgeIdentity`: "请先选择评委身份"
- `returnedToJudgeSelection`: "已返回评委选择页面"
- `navigationFailed`: "导航失败"
- `exportOnlyForAdmin`: "导出功能仅对管理员开放"
- `judgeCodeLabel`: "评委代码"

#### English (i18n/locales/en.json)
Added corresponding English translations:
- `pleaseSelectJudgeIdentity`: "Please select judge identity first"
- `returnedToJudgeSelection`: "Returned to judge selection page"
- `navigationFailed`: "Navigation failed"
- `exportOnlyForAdmin`: "Export function is only available for administrators"
- `judgeCodeLabel`: "Judge Code"

### 2. Component Updates (components/judge/score-summary-client.tsx)

#### Replaced Hardcoded Text:
1. **Line 107** - Session check error message:
   - Before: `toast.error('请先选择评委身份')`
   - After: `toast.error(t('judge.pleaseSelectJudgeIdentity'))`

2. **Line 88** - Redirect error message:
   - Before: `toast.error('请先选择评委身份')`
   - After: `toast.error(t('judge.pleaseSelectJudgeIdentity'))`

3. **Line 186** - Logout success message:
   - Before: `toast.success('已返回评委选择页面')`
   - After: `toast.success(t('judge.returnedToJudgeSelection'))`

4. **Line 189** - Navigation error message:
   - Before: `toast.error('导航失败')`
   - After: `toast.error(t('judge.navigationFailed'))`

5. **Line 197** - Export restriction message:
   - Before: `toast.error('导出功能仅对管理员开放')`
   - After: `toast.error(t('judge.exportOnlyForAdmin'))`

6. **Line 327** - Judge code label:
   - Before: `评委代码: {currentSession?.judge_code}`
   - After: `{t('judge.judgeCodeLabel')}: {currentSession?.judge_code}`

#### Dependency Array Fix:
- Added `t` to the dependency array of the redirect useEffect hook to prevent stale closure issues

## Existing Bilingual Support

The component already had bilingual support for most UI elements using:
- `BilingualText` component for titles and descriptions
- `t()` function for labels, buttons, and status messages
- Translation keys from both `judge` and `common` sections

## Testing Checklist

- [ ] Verify all toast messages display in both Chinese and English
- [ ] Check judge code label displays correctly in both languages
- [ ] Test navigation messages when returning to judge landing page
- [ ] Verify export restriction message shows in correct language
- [ ] Test session validation error messages
- [ ] Switch between zh/en locales and verify all text updates

## Files Modified

1. `i18n/locales/zh.json` - Added 5 new translation keys
2. `i18n/locales/en.json` - Added 5 new translation keys
3. `components/judge/score-summary-client.tsx` - Replaced 6 hardcoded Chinese strings with translation keys

## Notes

- All user-facing text now supports bilingual display
- Code comments remain in Chinese (as per development team preference)
- The component follows the project's AGENTS.md guidelines for bilingual support
- No breaking changes - all existing functionality preserved
