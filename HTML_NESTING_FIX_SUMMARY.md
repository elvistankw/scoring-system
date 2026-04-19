# HTML Nesting Issue Fix - BilingualText Component

## Issue Description
The application was experiencing hydration errors due to invalid HTML nesting where `<div>` elements (created by BilingualText with vertical layout) were being nested inside `<p>` elements.

## Error Details
```
Error: <p> cannot contain a nested <div>
Error: In HTML, <div> cannot be a descendant of <p>
```

This occurred because:
1. BilingualText component with `layout="vertical"` creates `<div>` elements
2. These were being wrapped in `<p>` elements in the score-summary-client.tsx
3. HTML specification doesn't allow block elements (`<div>`) inside inline elements (`<p>`)

## Root Cause
In `components/judge/score-summary-client.tsx` around line 636:

```tsx
// ❌ INVALID HTML - div inside p
<p className="text-lg font-medium mb-2">
  <BilingualText 
    translationKey="judge.selectAthleteFirst" 
    layout="vertical"  // This creates <div> elements
  />
</p>
```

## Solution Applied
Changed `<p>` elements to `<div>` elements where BilingualText with vertical layout is used:

```tsx
// ✅ VALID HTML - div inside div
<div className="text-lg font-medium mb-2">
  <BilingualText 
    translationKey="judge.selectAthleteFirst" 
    layout="vertical"  // This creates <div> elements
  />
</div>
```

## Files Modified
- `components/judge/score-summary-client.tsx` - Fixed 2 instances of invalid nesting

## Verification
- ✅ No compilation errors
- ✅ All BilingualText with `layout="vertical"` are now properly nested in block elements
- ✅ HTML structure is now valid and should resolve hydration errors

## HTML Nesting Rules Applied
- Block elements (`<div>`, `<h1>`, `<h2>`, etc.) can contain other block elements
- Inline elements (`<p>`, `<span>`, etc.) should only contain inline content
- BilingualText with `layout="vertical"` creates block elements (`<div>`)
- BilingualText with `layout="horizontal"` creates inline elements (`<span>`)

## Prevention
Going forward, when using BilingualText:
- Use `layout="vertical"` inside block elements (`<div>`, `<h1>`, `<h2>`, etc.)
- Use `layout="horizontal"` inside inline elements (`<p>`, `<span>`, etc.)
- Or use block elements as containers when vertical layout is needed

## Status: ✅ RESOLVED
The HTML nesting issue has been fixed and should resolve the hydration errors.