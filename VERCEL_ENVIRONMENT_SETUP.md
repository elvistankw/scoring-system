# Vercel Environment Variables Setup

## Current Deployment URLs
- **Frontend (Vercel)**: `https://scoring-system-nine.vercel.app`
- **Backend (Railway)**: `https://scoring-system-production-2c13.up.railway.app`

## Required Environment Variables for Vercel

### 1. Go to Vercel Dashboard
1. Open your project: `scoring-system-nine`
2. Go to Settings → Environment Variables

### 2. Add These Variables

#### Production Environment Variables:
```env
NEXT_PUBLIC_API_URL=https://scoring-system-production-2c13.up.railway.app
NEXT_PUBLIC_WS_URL=https://scoring-system-production-2c13.up.railway.app
NODE_ENV=production
```

#### Optional (for Google OAuth when ready):
```env
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

### 3. Railway Backend Environment Variables

Make sure your Railway backend has:
```env
FRONTEND_URL=https://scoring-system-nine.vercel.app
CORS_ORIGIN=https://scoring-system-nine.vercel.app
NODE_ENV=production
```

## Quick Fix Commands

### For Railway Backend:
```bash
# Set CORS origin
railway variables set FRONTEND_URL=https://scoring-system-nine.vercel.app
railway variables set CORS_ORIGIN=https://scoring-system-nine.vercel.app

# Redeploy
railway up
```

### For Vercel Frontend:
```bash
# Set API URL
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://scoring-system-production-2c13.up.railway.app

vercel env add NEXT_PUBLIC_WS_URL production  
# Enter: https://scoring-system-production-2c13.up.railway.app

# Redeploy
vercel --prod
```

## Testing After Setup

1. **Check CORS**: Frontend should be able to call backend APIs
2. **Check Google OAuth**: Should return 503 (not 500) when disabled
3. **Check Core Features**: Login, competitions, athletes should work

## Expected Behavior After Fix

### Google OAuth Routes:
- `/api/auth/google/status` → 503 (Service Unavailable)
- `/api/auth/google/auth-url` → 503 (Service Unavailable)
- No CORS errors
- No 500 errors

### Core Features:
- ✅ User authentication
- ✅ Competition management
- ✅ Athlete management
- ✅ Scoring system
- ✅ Real-time updates