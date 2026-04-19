# Score Range Helper Text Bilingual Display Update

## Summary
Successfully updated the score range helper text in the score input form to display bilingually using the BilingualText component.

## Current Implementation Status

### ✅ Already Implemented
The score input form was already using BilingualText for the helper text:

```tsx
{/* Helper Text */}
<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
  <BilingualText 
    translationKey="judge.scoreRangeNote"
    chineseSize="text-sm" 
    englishSize="text-xs"
  />
</p>
```

### ✅ Translation Added to BilingualText Component
Added the translation mapping to ensure proper bilingual display:

```typescript
'judge.scoreRangeNote': { 
  zh: '每个维度的评分范围为 0 到其权重百分比', 
  en: 'Each dimension\'s score range is 0 to its weight percentage' 
},
```

### ✅ Existing i18n Translations
The translations already exist in the i18n files:

**Chinese (zh.json):**
```json
"judge": {
  "scoreRangeNote": "每个维度的评分范围为 0 到其权重百分比"
}
```

**English (en.json):**
```json
"judge": {
  "scoreRangeNote": "Each dimension's score range is 0 to its weight percentage"
}
```

## Result

The helper text at the bottom of the score input form now displays bilingually:

**Chinese (larger):** 每个维度的评分范围为 0 到其权重百分比
**English (smaller):** Each dimension's score range is 0 to its weight percentage

## Font Sizing
- Chinese text: `text-sm` (larger)
- English text: `text-xs` (smaller)

## Files Modified

1. **components/shared/bilingual-text.tsx**
   - Added `judge.scoreRangeNote` translation mapping

## Quality Assurance
- ✅ No compilation errors
- ✅ Translation exists in both i18n files
- ✅ BilingualText component has the mapping
- ✅ Score input form already uses BilingualText
- ✅ Proper font sizing hierarchy maintained

## User Requirement Met
✅ "每个维度的评分范围为 0 到其权重百分比 / 每个维度的评分范围为 0 到其权重百分比 judge.scoring 显示双语" - The score range helper text now displays both Chinese and English simultaneously with proper font sizing hierarchy.

## Implementation Status: ✅ COMPLETE
The score range helper text bilingual display is now fully implemented and working correctly.