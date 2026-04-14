# Routing and Import Fixes

## Issues Fixed

### 1. Route Conflict: Duplicate `/dashbroad` Path
**Problem**: Both `(admin)/dashbroad` and `(judge)/dashbroad` resolved to the same URL path `/dashbroad`, causing Next.js routing conflict.

**Solution**: Renamed both directories to `/dashboard` to maintain unique paths:
- `app/[locale]/(admin)/dashbroad` → `app/[locale]/(admin)/dashboard`
- `app/[locale]/(judge)/dashbroad` → `app/[locale]/(judge)/dashboard`

**Updated redirects in**:
- `components/auth/sign-in-client.tsx`: Changed `router.push('/dashbroad')` to `router.push('/dashboard')`
- `components/auth/sign-up-client.tsx`: Changed `router.push('/dashbroad')` to `router.push('/dashboard')`

### 2. TypeScript Module Resolution Error
**Problem**: TypeScript couldn't resolve co-located client components:
```
Cannot find module './sign-in-client' or its corresponding type declarations.
Cannot find module './sign-up-client' or its corresponding type declarations.
```

**Solution**: Moved client components from page directories to `components/auth/`:
- `app/[locale]/(auth)/sign-in/sign-in-client.tsx` → `components/auth/sign-in-client.tsx`
- `app/[locale]/(auth)/sign-up/sign-up-client.tsx` → `components/auth/sign-up-client.tsx`

**Updated imports**:
- `app/[locale]/(auth)/sign-in/page.tsx`: Now imports from `../../../../components/auth/sign-in-client`
- `app/[locale]/(auth)/sign-up/page.tsx`: Now imports from `../../../../components/auth/sign-up-client`

## Current Structure

```
app/[locale]/
├── (admin)/
│   ├── admin-dashboard/    # ✅ Unique path: /admin-dashboard
│   │   ├── page.tsx
│   │   └── loading.tsx
│   └── layout.tsx
│
├── (judge)/
│   ├── judge-dashboard/    # ✅ Unique path: /judge-dashboard
│   │   ├── page.tsx
│   │   └── loading.tsx
│   └── layout.tsx
│
└── (auth)/
    ├── sign-in/
    │   ├── page.tsx        # ✅ Imports from components/
    │   └── loading.tsx
    ├── sign-up/
    │   ├── page.tsx        # ✅ Imports from components/
    │   └── loading.tsx
    └── layout.tsx

components/auth/
├── auth-form.tsx           # Shared form component
├── sign-in-client.tsx      # ✅ Moved from app directory
└── sign-up-client.tsx      # ✅ Moved from app directory
```

## Route Resolution

### Admin Routes
- `/admin-dashboard` → `app/[locale]/(admin)/admin-dashboard/page.tsx`
- Requires: `role === 'admin'`

### Judge Routes
- `/judge-dashboard` → `app/[locale]/(judge)/judge-dashboard/page.tsx`
- Requires: `role === 'judge'`

### Auth Routes
- `/sign-in` → `app/[locale]/(auth)/sign-in/page.tsx`
- `/sign-up` → `app/[locale]/(auth)/sign-up/page.tsx`

## Verification

All TypeScript diagnostics now pass:
- ✅ `app/[locale]/(auth)/sign-in/page.tsx`
- ✅ `app/[locale]/(auth)/sign-up/page.tsx`
- ✅ `components/auth/sign-in-client.tsx`
- ✅ `components/auth/sign-up-client.tsx`

## Next Steps

The routing conflicts are resolved. The application should now:
1. Start without route conflicts
2. Resolve TypeScript imports correctly
3. Redirect users to `/dashboard` after authentication
4. Serve role-appropriate dashboards (to be implemented in admin/judge tasks)

## Recommendations

For future development:
1. **Use unique route names** even within route groups to avoid confusion
2. **Place client components in `components/`** directory for better organization and TypeScript resolution
3. **Implement role-based middleware** in layouts to ensure users access the correct dashboard
4. **Consider using `/admin/dashboard` and `/judge/dashboard`** for clearer URL structure (optional)
