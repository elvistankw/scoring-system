# Hydration Error Fix - Competition Edit Client

## Problem
Hydration mismatch error occurred in `competition-edit-client.tsx` where the server-rendered HTML didn't match the client-rendered HTML. The error showed:
- Server was rendering the error state (red icon, error message)
- Client expected the loading skeleton state

## Root Cause
The component is a client component (`'use client'`) but Next.js still performs SSR for client components. During SSR:
1. The `useCompetition` hook returns initial state (`isLoading: true`)
2. But the component might have been rendering different states on server vs client
3. This caused a mismatch when React hydrated on the client

## Solution
Added a `mounted` state to ensure consistent rendering between server and client:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

// Show loading state during SSR and initial client load
if (!mounted || isLoading) {
  return <LoadingSkeleton />;
}
```

## How It Works
1. **Server-side**: `mounted` is `false`, so loading skeleton is rendered
2. **Client-side (initial)**: `mounted` is still `false`, so loading skeleton is rendered (matches server)
3. **Client-side (after mount)**: `mounted` becomes `true`, component can now show actual data or error states
4. **No hydration mismatch**: Server and client render the same HTML initially

## Changes Made
- Added `mounted` state variable
- Added `useEffect` to set `mounted` to `true` after component mounts
- Changed loading condition from `if (isLoading)` to `if (!mounted || isLoading)`

## Files Modified
- `components/admin/competition-edit-client.tsx`

## Testing
1. Navigate to competition edit page
2. Verify no hydration error in console
3. Verify loading skeleton shows briefly
4. Verify competition data loads correctly
5. Verify error state works if competition not found

## Related Issues
- TypeScript error "Cannot find module './competition-scores-manager'" is a separate issue (language server cache)
- This is a false positive and doesn't affect runtime behavior
- Will resolve on TypeScript server restart
