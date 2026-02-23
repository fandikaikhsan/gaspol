# Bug Fix: 401 Unauthorized - Invalid JWT

## Problem

When students submit answers, they get a `401 Unauthorized` error:

```
POST http://localhost:3001/api/submit-attempt 401 (Unauthorized)
{code: 401, message: 'Invalid JWT'}
```

## Root Cause Analysis

### What's Happening?

The error `"Invalid JWT"` means the **authentication token has expired or is invalid**, NOT an RLS policy issue.

### The Flow:
1. **Frontend** (`baseline/[moduleId]/page.tsx`) submits answers
2. **API Route** (`/api/submit-attempt/route.ts`) proxies to Edge Function
3. **Edge Function** (`submit_attempt`) verifies the JWT token:
   ```typescript
   const { data: userData, error: userError } = await supabase.auth.getUser(token)
   if (userError || !userData.user) {
     throw new Error("Invalid user token")  // ← Returns 401
   }
   ```

### Why It Failed:

The frontend was calling `supabase.auth.getSession()` **multiple times** (once per question) inside a Promise map:

```typescript
// BEFORE (BAD):
const attemptPromises = Object.entries(session.answers).map(
  async ([questionId, data]) => {
    const response = await fetch('/api/submit-attempt', {
      headers: {
        // Called EVERY time for EACH question - session might expire mid-flight!
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      ...
    })
  }
)
```

**Problems:**
1. Session checked multiple times unnecessarily
2. No token validation before use
3. No session refresh if expired
4. Token could be `null` or `undefined` if session expired

## The Fix

### 1. Updated Frontend Code

**File:** `/app/(student)/baseline/[moduleId]/page.tsx`

```typescript
// AFTER (GOOD):
const handleComplete = async (session: AssessmentSession) => {
  const supabase = createClient()

  // ✅ Get session ONCE before submitting
  const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()

  // ✅ Check if token is valid
  if (sessionError || !authSession?.access_token) {
    // ✅ Try to refresh session
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError || !refreshedSession?.access_token) {
      // ✅ Redirect to login if refresh fails
      toast({ title: "Session Expired", description: "Please log in again." })
      router.push('/login')
      return
    }

    authSession = refreshedSession
  }

  // ✅ Use the same token for all requests
  const accessToken = authSession.access_token

  // Now submit all attempts with the validated token
  const attemptPromises = Object.entries(session.answers).map(
    async ([questionId, data]) => {
      const response = await fetch('/api/submit-attempt', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,  // ✅ Same token for all
        },
        ...
      })
    }
  )
}
```

**Key Improvements:**
1. ✅ Get session **once** before the loop
2. ✅ Validate token exists before using it
3. ✅ Refresh session automatically if expired
4. ✅ Redirect to login if refresh fails
5. ✅ Reuse the same token for all submissions

### 2. RLS Policies (Optional but Recommended)

While the **Edge Function uses SERVICE_ROLE_KEY and bypasses RLS**, it's still good practice to have proper RLS policies for when students query these tables directly.

**Run this SQL script:**

```bash
# File: scripts/fix-all-submission-tables-rls.sql
# Run in Supabase SQL Editor
```

This creates policies for:
- ✅ `attempts` - Students can insert/read their own attempts
- ✅ `attempt_error_tags` - Students can read their own error tags
- ✅ `module_completions` - Students can insert/update/read their own completions

## Important: RLS vs Edge Functions

### Why Edge Functions Bypass RLS

The `submit_attempt` Edge Function uses `SUPABASE_SERVICE_ROLE_KEY`:

```typescript
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

**SERVICE_ROLE_KEY bypasses ALL RLS policies.**

This is intentional and correct because:
1. Edge Functions are **server-side** trusted code
2. They verify user identity themselves (via JWT)
3. They need to perform operations on behalf of users
4. RLS would block legitimate system operations

### When RLS Policies Matter

RLS policies are enforced when:
- Students query tables directly from frontend (using anon key)
- Students use Supabase client from browser
- Any non-service-role authenticated requests

RLS policies do NOT affect:
- Edge Functions (using service role key)
- Admin operations (using service role key)
- Database triggers and functions

## Testing

### 1. Test the Fix

1. **Clear browser cache** and refresh
2. Go to `/baseline`
3. Click "Start" on any checkpoint
4. Answer questions and click "Finish"
5. ✅ Should submit successfully now

### 2. Test Session Expiry

1. Open DevTools → Application → Storage → Clear all
2. Log in again
3. Start a baseline assessment
4. Wait (or manually expire your session)
5. Try to submit
6. ✅ Should either refresh session automatically OR redirect to login

### 3. Verify in Supabase

After successful submission:
- Check `attempts` table - should have new records
- Check `attempt_error_tags` table - should have error tags
- Check `module_completions` table - should have completion record

## Files Modified

1. ✅ `/app/(student)/baseline/[moduleId]/page.tsx` - Session handling fix
2. ✅ `/scripts/fix-all-submission-tables-rls.sql` - RLS policies (optional)
3. ✅ `/scripts/review-rls-policies.sql` - Diagnostic tool
4. ✅ `/docs/BUGFIX-jwt-unauthorized.md` - This documentation

## Prevention

To prevent similar JWT issues:

1. ✅ **Always check session validity** before using tokens
2. ✅ **Implement automatic session refresh** when expired
3. ✅ **Reuse tokens** instead of fetching multiple times
4. ✅ **Add proper error handling** for 401 errors
5. ✅ **Redirect to login** if session cannot be refreshed

## Related Issues

This fix also addresses:
- ✅ Session expiry during long assessments
- ✅ Multiple concurrent session checks
- ✅ Undefined token errors
- ✅ Token reuse across multiple requests

## Why "Invalid JWT" Doesn't Mean RLS

**Common Misconception:**
> "401 error = RLS is blocking me"

**Reality:**
- ❌ RLS issues return **row filtering** (empty results), not 401 errors
- ✅ 401 errors are **authentication** issues (JWT/session problems)
- ✅ RLS policies don't affect Edge Functions with SERVICE_ROLE_KEY

**Quick Check:**
- `401 Unauthorized` = Authentication problem (JWT/token issue)
- `403 Forbidden` = Authorization problem (user doesn't have permission)
- Empty results = RLS filtering (can query, but no matching rows)

## RLS Best Practices

Even though Edge Functions bypass RLS, you should still have policies:

### Good RLS Design

```sql
-- ✅ GOOD: Allow users to insert their own data
CREATE POLICY "Users insert own attempts"
ON attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ✅ GOOD: Allow users to read only their own data
CREATE POLICY "Users read own attempts"
ON attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ❌ BAD: Too permissive
CREATE POLICY "Allow all authenticated"
ON attempts FOR ALL
TO authenticated
USING (true);  -- Everyone can see everyone's data!

-- ❌ BAD: Too restrictive
CREATE POLICY "No access"
ON attempts FOR SELECT
TO authenticated
USING (false);  -- Nobody can read anything!
```

### When to Make RLS More Permissive

Make RLS less restrictive when:
1. Data is meant to be public (e.g., published modules)
2. Read-only reference data (e.g., question bank)
3. Leaderboards (aggregate data only)

Keep RLS strict for:
1. Personal data (attempts, scores, progress)
2. Sensitive information (email, phone)
3. Admin-only data (unpublished content)

## Summary

✅ **Fixed:** Session refresh logic in frontend
✅ **Created:** RLS policies for safety (optional)
✅ **Clarified:** Edge Functions bypass RLS by design
✅ **Explained:** 401 = JWT issue, not RLS issue

The baseline assessment should now work end-to-end! 🎉
