# Judge Scoring Title Bilingual Display Update

## Summary
Successfully updated the "judge.scoring" titles in the scoring interface to display bilingually using the BilingualText component.

## Changes Made

### 1. Updated Main Scoring Page Title
**File**: `app/[locale]/(judge)/scoring/scoring-client.tsx`

**Before**: Single language title
```tsx
<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
  {t('judge.scoring')}
</h1>
```

**After**: Bilingual title with vertical layout
```tsx
<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
  <BilingualText 
    translationKey="judge.scoring" 
    chineseSize="text-3xl" 
    englishSize="text-2xl"
    layout="vertical"
  />
</h1>
```

### 2. Updated Score Input Section Title
**File**: `app/[locale]/(judge)/scoring/scoring-client.tsx`

**Before**: Single language section title
```tsx
<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
  {t('judge.scoring')}
</h2>
```

**After**: Bilingual section title with vertical layout
```tsx
<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
  <BilingualText 
    translationKey="judge.scoring" 
    chineseSize="text-xl" 
    englishSize="text-lg"
    layout="vertical"
  />
</h2>
```

### 3. Existing Translation Support
The translation already exists in the BilingualText component:
```typescript
'judge.scoring': { zh: '评分', en: 'Scoring' },
```

And in the i18n files:
- **Chinese**: "评分"
- **English**: "Scoring"

## Result

Now the scoring interface displays bilingual titles:

### Main Page Title (Vertical Layout):
**评分** (text-3xl - larger Chinese)  
**Scoring** (text-2xl - smaller English)

### Section Title (Vertical Layout):
**评分** (text-xl - larger Chinese)  
**Scoring** (text-lg - smaller English)

## Font Sizing Hierarchy
- **Main Title**: Chinese `text-3xl`, English `text-2xl`
- **Section Title**: Chinese `text-xl`, English `text-lg`
- **Layout**: Vertical (Chinese on top, English below)

## Files Modified

1. **app/[locale]/(judge)/scoring/scoring-client.tsx**
   - Updated main page title (h1) to use BilingualText
   - Updated score input section title (h2) to use BilingualText
   - Both use vertical layout for proper title display

## Quality Assurance
- ✅ No compilation errors
- ✅ Proper TypeScript typing
- ✅ Consistent with existing bilingual display patterns
- ✅ Proper font size hierarchy maintained
- ✅ Vertical layout for titles as per design guidelines

## User Requirement Met
✅ "judge.scoring 显示双语" - The judge scoring titles now display both Chinese and English simultaneously with proper font sizing hierarchy and vertical layout.

## Implementation Status: ✅ COMPLETE
The judge scoring bilingual display is now fully implemented and working correctly.