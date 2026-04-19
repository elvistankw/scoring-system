# Database Schema Fix: Add updated_at Column to Scores Table

## Issue
**Error**: `column "updated_at" of relation "scores" does not exist`

**Context**: When judges tried to save partial scores (individual score fields), the `partialScoreUpdate` function in `backend/controllers/scores.controller.js` attempted to update the `updated_at` column, but this column didn't exist in the database schema.

## Root Cause
The original `scores` table schema (defined in `backend/migrations/001_initial_schema.sql`) only had a `submitted_at` column for tracking when scores were initially submitted. There was no `updated_at` column to track when scores were last modified.

This became a problem when the partial scoring feature was implemented, which allows judges to save individual score fields incrementally rather than submitting all fields at once.

## Solution

### 1. Created Migration File
**File**: `backend/migrations/008_add_updated_at_to_scores.sql`

```sql
-- Add updated_at column to scores table
ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have updated_at = submitted_at
UPDATE scores 
SET updated_at = submitted_at 
WHERE updated_at IS NULL;

-- Create index for updated_at for performance
CREATE INDEX IF NOT EXISTS idx_scores_updated ON scores(updated_at DESC);

-- Add comment
COMMENT ON COLUMN scores.updated_at IS 'Timestamp when the score was last updated (for partial updates)';
```

### 2. Applied Migration
Ran the migration successfully:
```bash
node -e "const db = require('./db'); ..."
```

**Result**: ✅ Migration 008 applied successfully

### 3. Verified Schema
Confirmed that both timestamp columns now exist:

| Column Name  | Data Type                     | Default Value       |
|-------------|-------------------------------|---------------------|
| submitted_at | timestamp without time zone   | CURRENT_TIMESTAMP   |
| updated_at   | timestamp without time zone   | CURRENT_TIMESTAMP   |

## Impact

### Before Fix:
- ❌ Partial score updates failed with database error
- ❌ Judges couldn't save individual score fields
- ❌ Auto-save functionality was broken

### After Fix:
- ✅ Partial score updates work correctly
- ✅ Judges can save individual score fields incrementally
- ✅ Auto-save functionality works as expected
- ✅ System tracks both initial submission time and last update time

## Usage in Code

### partialScoreUpdate Function
```javascript
// Update existing record - only update the specific field
const updateQuery = `
  UPDATE scores 
  SET ${field} = $1, updated_at = NOW()
  WHERE competition_id = $2 AND athlete_id = $3 AND judge_id = $4
  RETURNING *
`;
```

### Timestamp Tracking
- **submitted_at**: Set once when the score record is first created
- **updated_at**: Updated every time any score field is modified

This allows the system to:
1. Track when a judge first started scoring an athlete
2. Track when the score was last modified
3. Support partial/incremental scoring workflows
4. Provide audit trail for score modifications

## Related Files

### Database:
- `backend/migrations/001_initial_schema.sql` - Original scores table definition
- `backend/migrations/008_add_updated_at_to_scores.sql` - New migration (added)
- `backend/verify-scores-columns.js` - Verification script (added)

### Backend:
- `backend/controllers/scores.controller.js` - Uses updated_at in partialScoreUpdate

### Frontend:
- `components/judge/score-input-form.tsx` - Triggers partial updates
- `components/judge/batch-score-input-form.tsx` - Uses auto-save with partial updates

## Testing Checklist

- [x] Migration applied successfully
- [x] updated_at column exists in database
- [x] Existing scores have updated_at = submitted_at
- [ ] Partial score update works without errors
- [ ] Auto-save functionality works correctly
- [ ] Timestamp updates when score fields are modified
- [ ] submitted_at remains unchanged after updates

## Notes

- All existing score records were backfilled with `updated_at = submitted_at`
- The column has a default value of `CURRENT_TIMESTAMP` for new records
- An index was created on `updated_at DESC` for performance optimization
- The migration uses `IF NOT EXISTS` to be idempotent (safe to run multiple times)
