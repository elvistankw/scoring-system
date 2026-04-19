# 🚨 Production Quick Fix Guide

## Current Issues Identified:
1. **500 Error**: Google OAuth routes returning 500 instead of 503
2. **CORS Error**: Frontend can't access backend APIs

## ✅ Code Fixes Applied:

### 1. Fixed Google OAuth Route Logic
- Updated `backend/routes/google-auth.routes.js`
- Now properly checks for environment variables
- Returns 503 when disabled (not 500)

### 2. Fixed CORS Configuration  
- Updated `backend/middleware/security-headers.js`
- Added Vercel domain support
- Allows `scoring-system-*.vercel.app` domains

## 🔧 Environment Variables Needed:

### Railway Backend:
```bash
FRONTEND_URL=https://scoring-system-nine.vercel.app
CORS_ORIGIN=https://scoring-system-nine.vercel.app
NODE_ENV=production
```

### Vercel Frontend:
```bash
NEXT_PUBLIC_API_URL=https://scoring-system-production-2c13.up.railway.app
NEXT_PUBLIC_WS_URL=https://scoring-system-production-2c13.up.railway.app
NODE_ENV=production
```

## 🚀 Deployment Steps:

### Step 1: Update Backend (Railway)
```bash
# If you have Railway CLI:
railway variables set FRONTEND_URL=https://scoring-system-nine.vercel.app
railway variables set CORS_ORIGIN=https://scoring-system-nine.vercel.app

# Then redeploy:
git add .
git commit -m "Fix: CORS and Google OAuth production issues"
git push origin main
```

### Step 2: Update Frontend (Vercel)
1. Go to Vercel Dashboard → scoring-system-nine → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_API_URL` = `https://scoring-system-production-2c13.up.railway.app`
   - `NEXT_PUBLIC_WS_URL` = `https://scoring-system-production-2c13.up.railway.app`
3. Redeploy: `vercel --prod`

## 🧪 Test After Fix:

Run the test script:
```bash
node test-production-deployment.js
```

Expected results:
- ✅ No CORS errors
- ✅ Google OAuth returns 503 (not 500)
- ✅ Core API endpoints accessible

## 📋 Verification Checklist:

After applying fixes:
- [ ] Frontend loads without CORS errors
- [ ] Login/register works
- [ ] Admin dashboard accessible
- [ ] Judge dashboard accessible
- [ ] No 500 errors in console
- [ ] Google OAuth gracefully disabled (503 responses)

## 🆘 If Still Having Issues:

1. **Check Railway Logs**: Look for CORS and Google OAuth errors
2. **Check Vercel Logs**: Look for API connection issues
3. **Verify Environment Variables**: Make sure they're set correctly
4. **Test API Directly**: Use Postman to test backend endpoints

## 📞 Emergency Rollback:

If needed, you can temporarily disable Google OAuth completely:
1. Comment out Google OAuth routes in `backend/index.js`
2. Remove Google OAuth button from frontend components
3. Redeploy both services