# Score Disappearing Bug - Fix Complete ✅

## Problem Description
When filling out all score fields, the scores would disappear from the form after the last field was filled. The scores were being saved to the database correctly, but the form inputs would reset to empty.

## Root Cause Analysis

### Issue 1: Missing judge_id Filter
The frontend was loading scores from ALL judges for a competition, not just the current judge. This caused the wrong scores to be loaded into the form.

**Solution**: Added `judge_id` parameter to the `getScores` API call to filter by current judge.

### Issue 2: Validation Returning Null
When not all fields were filled, `validateScores()` returned `scoreData: null`. This null value was passed to the parent component, which then passed it back as `existingScores`, triggering the form to reset.

**Solution**: Modified `validateScores()` to return partial score data (only filled fields) instead of null when validation fails.

### Issue 3: useEffect Overwriting Form State
The `useEffect` in `BatchScoreInputForm` would overwrite the current form state whenever `existingScores` changed, even if the user was actively filling out the form.

**Solution**: Implemented smart merging logic where current form values take precedence over incoming `existingScores`.

## Changes Made

### 1. lib/judge-api-client.ts
```typescript
// Added judge_id parameter
async getScores(params?: { 
  competition_id?: number; 
  athlete_id?: number; 
  judge_id?: number  // NEW
}): Promise<any>
```

### 2. components/judge/scoring-client.tsx
```typescript
// Pass judge_id when loading scores
const response = await judgeApiClient.getScores({
  competition_id: selectedCompetition.id,
  athlete_id: undefined,
  judge_id: currentSession.judge_id  // Filter by current judge
});
```

### 3. components/judge/batch-score-input-form.tsx

#### validateScores() - Return Partial Data
```typescript
// OLD: Returned null when validation failed
if (!allFieldsFilled) {
  return { isValid: false, scoreData: null };  // ❌ Causes form reset
}

// NEW: Return partial data with only filled fields
if (!allFieldsFilled) {
  return { 
    isValid: false, 
    scoreData: Object.keys(partialScoreData).length > 0 
      ? partialScoreData 
      : null 
  };  // ✅ Preserves filled fields
}
```

#### useEffect() - Smart Merging
```typescript
// Merge with current scores (current scores take precedence)
setScores(prevScores => {
  const mergedScores: Record<string, string> = { ...baseScores };
  
  // Keep any values that are already in the form
  Object.keys(prevScores).forEach(key => {
    if (prevScores[key] && prevScores[key] !== '') {
      mergedScores[key] = prevScores[key];  // ✅ Current form values win
    }
  });
  
  return hasChanged ? mergedScores : prevScores;
});
```

## Testing Checklist

- [x] Fill individual fields - scores save automatically
- [x] Fill all fields - scores remain visible in form
- [x] Refresh page - scores load from database correctly
- [x] Switch between athletes - each athlete's scores are preserved
- [x] Multiple judges - each judge only sees their own scores

## Technical Details

### Data Flow
1. User fills field → `handleInputChange` → `saveFieldPartially` (500ms debounce)
2. API saves to database → `updateParentWithCurrentScores`
3. Parent updates `athleteScores` Map → `existingScores` prop changes
4. `useEffect` merges `existingScores` with current form (current wins)
5. Form state preserved ✅

### Key Principles
- **Current form state always takes precedence** over incoming data
- **Partial scores are valid** - don't reset to null
- **Filter by judge_id** - each judge only sees their own scores
- **Debounced auto-save** - 500ms delay per field

## Files Modified
- `lib/judge-api-client.ts` - Added judge_id parameter
- `components/judge/scoring-client.tsx` - Pass judge_id when loading scores
- `components/judge/batch-score-input-form.tsx` - Smart validation and merging logic

## Status
✅ **FIXED** - Scores now persist correctly during input, after page refresh, and across judge sessions.

## Related Issues
- Score persistence after refresh (fixed in previous commit)
- Judge session authentication (fixed in TASK 2)
- Partial score updates (fixed in TASK 6)
