# Bug Fix: "Question Not Found" Error

## Problem

When students tried to submit answers during baseline assessment, they received a `404 Question not found` error.

```
POST http://localhost:3001/api/submit-attempt 404 (Not Found)
{error: 'Question not found'}
```

## Root Cause

The `submit_attempt` Edge Function had a **schema mismatch** with the actual database structure.

### What the Edge Function Expected:
```typescript
// Edge Function was querying:
.select(`
  id,
  question_type,
  question_options (
    option_letter,
    is_correct
  )
`)
```

The Edge Function expected a **separate `question_options` table** with:
- `option_letter` column (e.g., "A", "B", "C")
- `is_correct` boolean column

### What the Database Actually Has:
```typescript
// Actual database schema:
{
  id: uuid,
  question_type: string,
  question_format: string,
  options: jsonb,           // ← JSONB object with all options
  correct_answer: string,   // ← Direct field with the answer
  // ... other fields
}
```

The database stores:
- **Options in a JSONB field** called `options` on the `questions` table
- **Correct answer** directly in the `correct_answer` field

## The Fix

### 1. Updated QuestionData Interface
```typescript
// Before:
interface QuestionData {
  question_options: Array<{
    option_letter: string
    is_correct: boolean
  }>
}

// After:
interface QuestionData {
  options: Record<string, any>         // JSONB field
  correct_answer: string | string[]    // Direct field
}
```

### 2. Updated Database Query
```typescript
// Before:
.select(`
  question_options (
    option_letter,
    is_correct
  )
`)

// After:
.select(`
  options,
  correct_answer,
  question_format
`)
```

### 3. Updated Correctness Logic
```typescript
// Before:
const correctOptions = questionData.question_options
  .filter(opt => opt.is_correct)
  .map(opt => opt.option_letter)

// After:
const correctAnswer = questionData.correct_answer
// Direct comparison with user's selected_answer
```

## Changes Made

**File: `/supabase/functions/submit_attempt/index.ts`**

1. ✅ Updated `QuestionData` interface to use `options` JSONB and `correct_answer` field
2. ✅ Removed JOIN to non-existent `question_options` table
3. ✅ Updated query to select `options`, `correct_answer`, and `question_format`
4. ✅ Rewrote correctness computation to work with JSONB structure
5. ✅ Added support for all question formats: MCQ5, MCK-Table, Fill-in
6. ✅ Added better error logging for debugging
7. ✅ Deployed to Supabase

## Testing

To verify the fix works:

1. **Run the diagnostic SQL** (optional, to understand the schema):
   ```bash
   # File: scripts/diagnose-question-submission.sql
   # Run in Supabase SQL Editor
   ```

2. **Test the submission flow**:
   - Go to `/baseline`
   - Click "Start" on any checkpoint
   - Answer a few questions
   - Click "Finish"
   - Verify submission succeeds without "Question not found" error

3. **Check the browser console**:
   - Should see successful POST requests to `/api/submit-attempt`
   - Should see 200 status codes (not 404)

4. **Verify in Supabase**:
   - Check the `attempts` table for new records
   - Check that `is_correct` is computed properly

## Related Issues Fixed

This fix also resolves:
- ✅ Schema mismatch between database and TypeScript types
- ✅ Support for all question formats (MCQ5, MCK-Table, Fill-in)
- ✅ Proper handling of JSONB options field
- ✅ Direct comparison with `correct_answer` field

## Files Modified

1. `/supabase/functions/submit_attempt/index.ts` - Edge Function fix
2. `/scripts/diagnose-question-submission.sql` - Diagnostic tool (created)
3. `/docs/BUGFIX-question-not-found.md` - This documentation

## Deployment

Edge Function deployed successfully:
```bash
npx supabase functions deploy submit_attempt
```

Deployed to project: `gdddsighuggtasrmhxmz`
Dashboard: https://supabase.com/dashboard/project/gdddsighuggtasrmhxmz/functions

## Prevention

To prevent similar issues:
1. Always verify database schema before writing queries
2. Use TypeScript types that match actual database structure
3. Run diagnostic queries to understand table relationships
4. Test Edge Functions with actual data before deployment
5. Keep documentation of schema decisions

## Next Steps

1. Test the baseline assessment end-to-end
2. Verify all question formats work correctly (MCQ5, MCK-Table, Fill-in)
3. Check that scores are calculated properly
4. Verify the `/baseline/[moduleId]/result` page shows correct results
