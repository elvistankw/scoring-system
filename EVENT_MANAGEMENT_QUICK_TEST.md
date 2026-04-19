# 🧪 Event Management Quick Test Guide

## ✅ Quick Test Steps

### 1. Access the Page
1. Make sure backend is running: `cd backend && npm start`
2. Make sure frontend is running: `npm run dev`
3. Login as admin at: http://localhost:3000/zh/sign-in
4. Click user menu (top right corner)
5. Click "活动管理 / Event Management"
6. You should see: http://localhost:3000/zh/events

### 2. Test Create Event
1. Click "创建活动 / Create Event" button
2. Fill in the form:
   - **Name**: `2025 华东区扯铃比赛`
   - **Description**: `欢迎参加2025年华东区扯铃比赛`
   - **Poster URL**: `https://example.com/poster.jpg` (or leave empty)
   - **Video URL**: Leave empty
   - **Start Date**: Select today's date
   - **End Date**: Select a future date
3. Click "创建 / Create"
4. Should see success toast: "活动创建成功 / Event created"
5. Event should appear in the list

### 3. Test Edit Event
1. Click the edit icon (pencil) on the event you just created
2. Change the name to: `2025 华东区扯铃比赛 - 已更新`
3. Click "更新 / Update"
4. Should see success toast: "活动更新成功 / Event updated"
5. Event name should be updated in the list

### 4. Test Activate Event
1. If the event is not active, click "激活 / Activate" button
2. Should see success toast: "活动已激活 / Event activated"
3. Event should show green "激活中 / Active" badge
4. If you had other active events, they should now be inactive

### 5. Test Delete Event
1. Click the delete icon (trash) on any event
2. Confirm the deletion in the dialog
3. Should see success toast: "活动已删除 / Event deleted"
4. Event should be removed from the list

### 6. Test Empty State
1. Delete all events
2. Should see empty state message:
   - Icon: Calendar
   - Text: "暂无活动 / No Events"
   - Subtext: "点击上方按钮创建第一个活动"

### 7. Test Dark Mode
1. Click settings icon in user menu
2. Toggle dark mode
3. Verify all elements look good in dark mode:
   - Background colors
   - Text colors
   - Button colors
   - Form inputs
   - Modal

### 8. Test Responsive Design
1. Resize browser window to mobile size (375px)
2. Verify layout adapts properly
3. Verify buttons are accessible
4. Verify form is usable

---

## 🔍 What to Check

### Visual Checks
- ✅ Page loads without errors
- ✅ Header shows "活动管理 / Event Management"
- ✅ Back button works
- ✅ Create button is visible
- ✅ Events display in cards
- ✅ Poster images load (or show placeholder)
- ✅ Status badges show correctly
- ✅ Action buttons are visible
- ✅ Dark mode works
- ✅ Responsive design works

### Functional Checks
- ✅ Create event works
- ✅ Edit event works
- ✅ Delete event works
- ✅ Activate event works
- ✅ Form validation works (try submitting without name)
- ✅ Toast notifications appear
- ✅ Modal opens and closes
- ✅ Back button navigates to admin dashboard
- ✅ Data persists after page refresh

### Error Handling
- ✅ Try creating event without name (should show error)
- ✅ Try with invalid URL format (should still work, backend validates)
- ✅ Try deleting non-existent event (should handle gracefully)
- ✅ Try without authentication (should redirect to login)

---

## 🐛 Common Issues

### Issue: "Access token is required" error
**Status**: ✅ FIXED
**Solution**: Updated `hooks/use-events.ts` to include authentication headers
- The hook now properly sends JWT token with requests
- Make sure you're logged in as admin

### Issue: Page shows 404
**Solution**: Make sure you created all the files:
- `app/[locale]/(admin)/events/page.tsx`
- `app/[locale]/(admin)/events/loading.tsx`
- `app/[locale]/(admin)/events/event-management-client.tsx`

### Issue: "Cannot find module" error
**Solution**: Make sure you created the component files:
- `components/admin/event-form.tsx`
- `components/admin/event-list.tsx`

### Issue: API errors
**Solution**: 
1. Check backend is running on port 5000
2. Check backend console for errors
3. Verify events routes are loaded: `app.use('/api/events', eventsRoutes)`

### Issue: Authentication errors
**Solution**:
1. Make sure you're logged in as admin
2. Check localStorage has 'auth_token'
3. Check token is valid (not expired)

### Issue: Images not loading
**Solution**:
1. This is normal if using placeholder URLs
2. Use real image URLs for testing
3. Fallback to default poster should work

---

## 📊 Expected Results

### After Creating Event
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 1,
    "name": "2025 华东区扯铃比赛",
    "poster_url": "https://example.com/poster.jpg",
    "background_video_url": null,
    "status": "inactive",
    "description": "欢迎参加2025年华东区扯铃比赛",
    "start_date": "2026-04-19",
    "end_date": "2026-04-25",
    "created_at": "2026-04-19T..."
  }
}
```

### After Activating Event
- Event status changes to "active"
- Green badge appears: "激活中 / Active"
- Other events become inactive
- Judge landing page uses this event's poster/video

---

## ✅ Success Criteria

All of these should work:
- [x] Page loads successfully
- [x] Can create new event
- [x] Can edit existing event
- [x] Can delete event
- [x] Can activate event
- [x] Toast notifications appear
- [x] Form validation works
- [x] Dark mode works
- [x] Responsive design works
- [x] Back button works
- [x] Empty state shows when no events
- [x] Poster preview shows (or placeholder)
- [x] Status badges show correctly
- [x] All buttons work
- [x] No console errors

---

## 🎯 Quick Smoke Test (2 minutes)

1. Navigate to `/zh/events` ✅
2. Click "创建活动" ✅
3. Enter name: "Test Event" ✅
4. Click "创建" ✅
5. See success toast ✅
6. See event in list ✅
7. Click edit icon ✅
8. Change name ✅
9. Click "更新" ✅
10. See updated name ✅
11. Click "激活" ✅
12. See green badge ✅
13. Click delete icon ✅
14. Confirm deletion ✅
15. Event removed ✅

**If all 15 steps work, the feature is ready! 🎉**

---

## 📞 Need Help?

### Check These Files
- `EVENT_MANAGEMENT_PAGE_COMPLETE.md` - Full documentation
- `backend/controllers/events.controller.js` - Backend logic
- `hooks/use-events.ts` - Data fetching
- `interface/event.ts` - TypeScript types

### Check Backend Logs
```bash
cd backend
npm start
# Watch for:
# ✅ Events routes loaded
# 🔍 Creating new event: ...
# ✅ Event created: ...
```

### Check Browser Console
- Should see no errors
- Should see API requests to `/api/events`
- Should see success responses

---

**Test Duration**: ~5 minutes  
**Last Updated**: April 19, 2026
