# Judge Landing Page - Dynamic Background Fix

## Issue Summary
The judge landing page was showing a JSON parse error: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

## Root Cause
The frontend was trying to fetch the active event from the backend API, but the environment variable `NEXT_PUBLIC_API_URL` was missing from `.env.local`. This caused the fetch to fail and return an HTML error page instead of JSON.

## Solution Applied

### 1. Added Missing Environment Variables to `.env.local`
```env
# Frontend API URL (must start with NEXT_PUBLIC_ to be accessible in browser)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### 2. Verified Backend API is Working
✅ Backend server is running on port 5000 (Terminal 38)
✅ Events API endpoint `/api/events/active` is properly configured
✅ Active event found: "马六甲扯铃大赛"

### 3. Implementation Details

#### Files Modified:
- `.env.local` - Added `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`

#### Files Already Implemented (from previous task):
- `hooks/use-events.ts` - Hook for fetching active event
- `components/judge/judge-landing-client.tsx` - Updated to use event poster as background
- `backend/controllers/events.controller.js` - Events API controller
- `backend/routes/events.routes.js` - Events routes
- `lib/api-config.ts` - API endpoint configuration

## CRITICAL: Next Steps Required

### ⚠️ USER ACTION REQUIRED ⚠️

**You MUST restart the Next.js development server for the environment variables to take effect!**

Environment variables starting with `NEXT_PUBLIC_` are only loaded when Next.js starts. They are NOT hot-reloaded.

### How to Restart Next.js:

1. **Stop the current Next.js server:**
   - Find the terminal running `npm run dev` or `next dev`
   - Press `Ctrl+C` to stop it

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Verify the fix:**
   - Open browser to `http://localhost:3000/zh/judge-landing`
   - You should see the event poster as background
   - No more JSON parse errors

## Expected Behavior After Restart

### Judge Landing Page Features:
1. **Dynamic Background**: Shows the active event's poster image
2. **Event Information**: Displays event name and description
3. **Large CTA Button**: "开始评分 / Start Judging" button in the center
4. **Responsive Design**: Works on tablets/iPads (评审端必须完美适配)
5. **Dark Theme**: Optimized for display with overlay for text readability

### API Flow:
```
Frontend (judge-landing-client.tsx)
  ↓ useActiveEvent() hook
  ↓ fetch(NEXT_PUBLIC_API_URL + '/api/events/active')
  ↓
Backend (events.controller.js)
  ↓ Query events table for active event
  ↓ Return event data with poster_url
  ↓
Frontend displays poster as background
```

## Default Behavior
If no active event exists in the database, the API returns a default event:
- Name: "扯铃比赛 / Diabolo Competition"
- Poster: `/default-event-poster.jpg`
- Description: "欢迎参加扯铃比赛评分 / Welcome to Diabolo Competition Judging"

## Admin Setup (Optional)
To create and activate a custom event:
1. Admin logs in
2. Navigate to Events Management (to be implemented)
3. Create new event with:
   - Name
   - Poster URL (uploaded image)
   - Description
   - Start/End dates
4. Click "Activate" to set as active event

## Technical Notes

### Why `NEXT_PUBLIC_` Prefix?
- Next.js environment variables are server-side by default
- Variables with `NEXT_PUBLIC_` prefix are exposed to the browser
- They are embedded at build time (or server start in dev mode)
- They are NOT hot-reloaded - server restart required

### Security Consideration
- `NEXT_PUBLIC_API_URL` is safe to expose (it's just the backend URL)
- Never put secrets in `NEXT_PUBLIC_*` variables
- Backend API handles authentication and authorization

## Verification Checklist
- [x] Environment variables added to `.env.local`
- [x] Backend server running and responding correctly
- [x] Events API endpoint working
- [x] Active event exists in database
- [ ] **Next.js server restarted** ⚠️ USER ACTION REQUIRED
- [ ] Judge landing page loads without errors
- [ ] Event poster displays as background
- [ ] CTA button is visible and functional

## Related Documentation
- `API_URL_ENV_FIX.md` - Environment variable configuration
- `JUDGE_LANDING_DYNAMIC_BACKGROUND.md` - Original implementation plan
- `AGENTS.md` - Project development rules

## Status
✅ Backend: Complete and working
✅ Frontend: Complete and ready
⚠️ **Waiting for Next.js restart to take effect**
