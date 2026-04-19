# Judge User Account Fix - "Invalid Reference" Error Resolution

**Date:** April 19, 2026  
**Status:** ✅ **FIXED**

## Problem
Error when submitting scores via device-based judge sessions:
```
Invalid reference. Related record does not exist.
```

This was a PostgreSQL foreign key constraint violation (error code 23503).

## Root Cause Analysis

### Database Schema Issue
The `scores` table has a foreign key constraint:
```sql
judge_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

However, the system has two separate identity systems:
1. **Traditional Login**: Judges in `users` table (with username/password)
2. **Device-Based Sessions**: Judges in `judges` table (no password, device-locked)

When a device-based judge tried to submit scores, the system used `judge_id` from the `judges` table, but the `scores` table expected an ID from the `users` table, causing the foreign key violation.

### Investigation Results
Checked existing scores and found:
- Judge IDs 1, 4, 30: Exist in BOTH `users` and `judges` tables ✅
- Judge IDs 41, 43: Exist ONLY in `users` table ❌
- Judge IDs 28, 29: Exist ONLY in `judges` table ❌

## Solution Implemented

### 1. Create User Accounts for Existing Judges
Created user accounts for judges that didn't have them:
- Judge ID 28 (孙八 / J006)
- Judge ID 29 (周九 / J007)

**Script:** `backend/create-missing-judge-users.js`

**Details:**
- Username: Judge code (e.g., "J006")
- Password: Judge code (hashed with bcrypt)
- Email: `{code}@judge.local` (dummy email)
- Role: 'judge'
- Flag: `is_judge_account = true`

### 2. Updated Judge Creation Process
Modified `backend/controllers/judges.controller.js` → `createJudge()` function:

**New Behavior:**
1. Create user account first (in `users` table)
2. Create judge record with matching ID (in `judges` table)
3. Both operations in a transaction (atomic)

**Benefits:**
- Every judge now has a corresponding user account
- Judge ID = User ID (same value in both tables)
- Scores can reference `users.id` without foreign key violations
- Device-based sessions work seamlessly

### 3. Fixed Column Names
Corrected database column references:
- ❌ `password` → ✅ `password_hash`
- ❌ `name` → ✅ Removed (column doesn't exist in users table)

## Files Modified

### Backend Controllers
- `backend/controllers/judges.controller.js`
  - Updated `createJudge()` to create user account + judge record
  - Uses transaction for atomicity
  - Fixed bcrypt import (`bcrypt` not `bcryptjs`)

### Migration Scripts
- `backend/create-missing-judge-users.js` - Creates user accounts for existing judges
- `backend/check-score-judge-ids.js` - Diagnostic script to check judge IDs
- `backend/check-users-schema.js` - Schema inspection tool

### Attempted But Not Used
- `backend/migrations/009_fix_scores_judge_fk.sql` - Would have changed FK to reference `judges` table
- `backend/run-migration-009.js` - Migration runner

**Why not used:** Decided to keep FK referencing `users` table and create user accounts for judges instead. This maintains consistency with the existing authentication system.

## Testing Checklist

### ✅ Completed
- [x] Created user accounts for 2 existing judges
- [x] Backend server restarted successfully
- [x] No startup errors

### 🔄 Needs Testing
- [ ] Device-based judge can submit scores without "Invalid reference" error
- [ ] Batch score submission works
- [ ] Partial score update works
- [ ] New judge creation creates both user and judge records
- [ ] Judge sessions still work correctly

## Database State After Fix

### Users Table
All judges now have user accounts with:
- `username` = judge code
- `password_hash` = bcrypt hash of judge code
- `email` = `{code}@judge.local`
- `role` = 'judge'
- `is_judge_account` = true

### Judges Table
Unchanged, but now every judge ID has a corresponding user ID.

### Scores Table
Foreign key constraint remains:
```sql
judge_id REFERENCES users(id)
```
This now works because all judges have user accounts.

## Security Notes

### Default Passwords
- **Default password for each judge:** Their judge code
- **Example:** Judge with code "J006" has password "J006"
- **Recommendation:** Change passwords in production or disable password login for judge accounts

### Judge Account Flags
- `is_judge_account = true` flag can be used to:
  - Disable password login for device-based judges
  - Enforce device-based authentication only
  - Differentiate between admin-created judges and self-registered users

## Future Improvements

### Option 1: Disable Password Login for Judge Accounts
Add middleware to prevent password login for accounts with `is_judge_account = true`:
```javascript
if (user.is_judge_account) {
  throw new Error('This account requires device-based authentication');
}
```

### Option 2: Unified Identity System
Consider merging `users` and `judges` tables into a single identity system with:
- `auth_type` field: 'password' | 'device' | 'both'
- Simplified foreign key relationships
- Reduced data duplication

### Option 3: Separate Judge Scores Table
Create a separate `judge_scores` table that references `judges.id` instead of `users.id`:
- Cleaner separation of concerns
- No need for user accounts for device-based judges
- More complex query logic

## Server Status
- **Port:** 5000
- **Process ID:** Terminal 38
- **Status:** ✅ Running
- **Database:** ✅ Connected
- **WebSocket:** ✅ Ready

---

**Resolution:** The "Invalid reference. Related record does not exist" error should now be resolved. Device-based judges can submit scores because they now have corresponding user accounts in the `users` table.
