# How to Restart Next.js Development Server

## Why Restart is Needed
Environment variables starting with `NEXT_PUBLIC_` are only loaded when Next.js starts. They are NOT hot-reloaded during development.

## Quick Restart Instructions

### Option 1: Using Terminal (Recommended)
1. Find the terminal running Next.js (usually shows `npm run dev` or `next dev`)
2. Press `Ctrl+C` to stop the server
3. Run the start command again:
   ```bash
   npm run dev
   ```

### Option 2: Using VS Code
1. Open the Terminal panel (View → Terminal or `` Ctrl+` ``)
2. Find the terminal tab running Next.js
3. Click in that terminal and press `Ctrl+C`
4. Type `npm run dev` and press Enter

### Option 3: Kill All Node Processes (Nuclear Option)
⚠️ This will stop ALL Node.js processes including the backend!

```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Restart backend
cd backend
node index.js

# Restart frontend (in new terminal)
cd ..
npm run dev
```

## Verify the Fix
After restarting, open your browser to:
- `http://localhost:3000/zh/judge-landing`

You should see:
- ✅ Event poster as background (not animated background)
- ✅ Event name and description
- ✅ Large "开始评分 / Start Judging" button
- ✅ No JSON parse errors in console

## What Changed
- Added `NEXT_PUBLIC_API_URL=http://localhost:5000` to `.env.local`
- Added `NEXT_PUBLIC_WS_URL=http://localhost:5000` to `.env.local`
- These variables are now available in the browser for API calls

## Troubleshooting

### Still seeing JSON parse error?
1. Check if Next.js actually restarted (look for "Ready" message in terminal)
2. Clear browser cache (Ctrl+Shift+R)
3. Check browser console for the actual API URL being called

### Backend not responding?
1. Check if backend is running: `http://localhost:5000/api/events/active`
2. Should return JSON with event data
3. If not, restart backend: `cd backend && node index.js`

### Environment variables not loading?
1. Make sure `.env.local` is in the root directory (not in `backend/`)
2. Check file has no typos in variable names
3. Restart Next.js completely (not just refresh browser)
