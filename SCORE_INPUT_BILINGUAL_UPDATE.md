# Score Input Form Bilingual Display Update

## Summary
Successfully updated the score input form to display scoring dimension labels bilingually using the BilingualText component.

## Changes Made

### 1. Updated getDimensionLabel Function
**Before**: Returned a single translated string
```typescript
const getDimensionLabel = (field: string): string => {
  switch (field) {
    case 'action_difficulty':
      return t('score.actionDifficulty');
    // ...
  }
};
```

**After**: Returns a BilingualText component for bilingual display
```typescript
const getDimensionLabel = (field: string): ReactElement => {
  let translationKey: string;
  switch (field) {
    case 'action_difficulty':
      translationKey = 'score.actionDifficulty';
      break;
    // ...
  }
  
  return (
    <BilingualText 
      translationKey={translationKey}
      chineseSize="text-sm" 
      englishSize="text-xs"
    />
  );
};
```

### 2. Added Helper Function for Error Messages
Created `getDimensionLabelText()` function to provide plain text versions for error messages:
```typescript
const getDimensionLabelText = (field: string): string => {
  switch (field) {
    case 'action_difficulty':
      return t('score.actionDifficulty');
    // ...
  }
};
```

### 3. Updated Validation Function
Modified `validateScores()` to use the text version for error messages:
```typescript
toast.error(`${getDimensionLabelText(field)}: ${t('judge.fillAllScores')}`);
```

### 4. Added Score Dimension Translations
Added comprehensive scoring dimension translations to BilingualText component:
```typescript
'score.actionDifficulty': { zh: '动作难度', en: 'Action Difficulty' },
'score.stageArtistry': { zh: '舞台艺术', en: 'Stage Artistry' },
'score.actionCreativity': { zh: '动作创意', en: 'Action Creativity' },
'score.actionFluency': { zh: '动作流畅', en: 'Action Fluency' },
'score.costumeStyling': { zh: '服装造型', en: 'Costume Styling' },
'score.actionInteraction': { zh: '动作配合', en: 'Action Interaction' },
```

### 5. Added Required Imports
Added ReactElement import for proper TypeScript typing:
```typescript
import type { ReactElement } from 'react';
```

## Files Modified

1. **components/judge/score-input-form.tsx**
   - Updated getDimensionLabel function to return BilingualText component
   - Added getDimensionLabelText helper function
   - Updated validation function to use text version for errors
   - Added ReactElement import

2. **components/shared/bilingual-text.tsx**
   - Added comprehensive score dimension translations

## Result

Now all scoring dimension labels display bilingually:
- **动作难度 / Action Difficulty**
- **舞台艺术 / Stage Artistry** 
- **动作创意 / Action Creativity**
- **动作流畅 / Action Fluency**
- **服装造型 / Costume Styling**
- **动作配合 / Action Interaction**

## Font Sizing
- Chinese text: `text-sm` (larger)
- English text: `text-xs` (smaller)

## Quality Assurance
- ✅ No compilation errors
- ✅ Proper TypeScript typing
- ✅ Error messages still work with plain text
- ✅ All scoring dimensions covered
- ✅ Consistent with existing bilingual display patterns

## User Requirement Met
✅ "评分 getDimensionLabel(field) 显示双语 in score-input" - All scoring dimension labels now display both Chinese and English simultaneously with proper font sizing hierarchy.