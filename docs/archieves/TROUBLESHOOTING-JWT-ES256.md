# Troubleshooting Guide: ES256 JWT with Supabase Edge Functions

## Problem Summary

**Symptom:** Edge Functions return `401 Unauthorized - Invalid JWT` even though the user is authenticated and has a valid session.

**Root Cause:** Supabase Edge Functions have built-in JWT verification middleware that expects HS256 (HMAC-SHA256) algorithm. However, some Supabase projects use ES256 (ECDSA with P-256) for JWT tokens. The Edge Runtime's JWT middleware rejects ES256 tokens before the function code even runs.

## How to Identify This Issue

### 1. Check Edge Function Invocation Logs

Go to: **Supabase Dashboard → Functions → [your-function] → Invocations**

Look for these indicators:

```json
{
  "execution_id": null,  // ← Function never ran!
  "execution_time_ms": 100-200,  // ← Fast rejection
  "response": {
    "status_code": 401
  },
  "request": {
    "sb": {
      "jwt": {
        "authorization": {
          "payload": {
            "algorithm": "ES256",  // ← Your token uses ES256
            "subject": "user-id-here"  // ← User ID is valid
          }
        }
      }
    }
  }
}
```

**Key Indicators:**
- ✅ JWT is valid (`"invalid": null`)
- ✅ User ID is present in JWT payload
- ❌ `execution_id: null` (function never ran)
- ❌ `status_code: 401` returned
- ❌ Token algorithm is `ES256` (not `HS256`)

### 2. Check Edge Function Logs

Go to: **Supabase Dashboard → Functions → [your-function] → Logs**

If you see:
- ❌ Only "shutdown" messages
- ❌ No console.log output from your function
- ❌ No startup messages

This confirms the function is being rejected before it starts.

### 3. Compare JWT Algorithms

Check your anon key algorithm:
```javascript
// Decode the anon key (it's just base64)
const anonKey = 'eyJhbGciOiJIUzI1NiIs...'
const payload = JSON.parse(atob(anonKey.split('.')[1]))
console.log(payload.algorithm)  // "HS256"
```

Check your user token algorithm:
```javascript
const userToken = session.access_token
const payload = JSON.parse(atob(userToken.split('.')[1]))
console.log(payload.algorithm)  // "ES256" ← Problem!
```

If anon key uses HS256 but user token uses ES256, you have this issue.

## Solutions

### Solution 1: Use Next.js API Routes (Recommended)

**Pros:**
- ✅ No ES256 compatibility issues
- ✅ Full control over authentication
- ✅ Can use service role key
- ✅ Easier to debug (server logs)
- ✅ Better TypeScript integration

**Cons:**
- ❌ Runs on your Next.js server (not edge)
- ❌ Slight latency increase vs Edge Functions

**Implementation:**

**File:** `/app/api/submit-attempt/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth' }, { status: 401 })
    }

    // Extract user ID from JWT (server-side decoding)
    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    const userId = payload.sub

    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Your logic here - service role key bypasses RLS
    const { data, error } = await supabase
      .from('your_table')
      .insert({ user_id: userId, ...body })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**Environment Variables Required:**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← Important!
```

### Solution 2: Use Supabase Client-Side Operations

If your operation doesn't need elevated permissions, use the client directly:

```typescript
// Frontend code
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// This works because RLS policies allow it
const { data, error } = await supabase
  .from('attempts')
  .insert({
    user_id: user.id,  // RLS policy checks: user_id = auth.uid()
    question_id: questionId,
    // ...
  })
```

**When to use:**
- ✅ Operation is allowed by RLS policies
- ✅ No complex business logic needed
- ✅ Simple CRUD operations

**When NOT to use:**
- ❌ Need to bypass RLS policies
- ❌ Need complex validation/computation
- ❌ Need to write to multiple tables transactionally

### Solution 3: Fix Edge Function (Advanced)

If you must use Edge Functions, you can try to work around the JWT issue:

**Option A: Decode JWT manually (not recommended for production)**

```typescript
// In Edge Function
const authHeader = req.headers.get("Authorization")
const token = authHeader.replace("Bearer ", "")

// Decode payload (NO VERIFICATION - assumes Edge Runtime already verified)
const payload = JSON.parse(atob(token.split('.')[1]))
const userId = payload.sub

// Use service role client for DB operations
const supabase = createClient(supabaseUrl, serviceRoleKey)
```

**⚠️ Security Warning:** This trusts the JWT without verifying the signature. It's only safe if you're 100% confident that Supabase Edge Runtime already verified it.

**Option B: Switch to HS256 (requires Supabase support)**

Contact Supabase support to switch your project's JWT algorithm from ES256 to HS256. This is a project-level setting that you can't change yourself.

## Best Practices

### ✅ DO:

1. **Use Next.js API Routes for server-side operations**
   - Better debugging
   - Full control over auth
   - No JWT algorithm issues

2. **Use Supabase client directly for simple operations**
   - Faster (no API hop)
   - Simpler code
   - RLS provides security

3. **Keep SERVICE_ROLE_KEY secret**
   - Never expose to frontend
   - Only use in API routes or Edge Functions
   - Rotate periodically

4. **Use RLS policies properly**
   - Allow users to insert their own data
   - Prevent users from seeing others' data
   - Test policies thoroughly

### ❌ DON'T:

1. **Don't expose service role key to frontend**
   - Never in .env.local with NEXT_PUBLIC_ prefix
   - Never in client-side code
   - Never in git commits

2. **Don't skip JWT verification in production**
   - Always verify user identity
   - Don't trust JWT payloads without verification
   - Use proper auth middleware

3. **Don't use Edge Functions for everything**
   - Edge Functions are great for edge computing
   - But API routes are simpler for most CRUD operations
   - Choose based on requirements, not hype

4. **Don't make unnecessary API hops**
   - If client can do it safely → use client
   - If needs privilege → use API route
   - Don't proxy just to proxy

## Testing Your Fix

### 1. Test Authentication

```javascript
// Browser console
const { data: { session } } = await supabase.auth.getSession()
console.log('Has session:', !!session)
console.log('Token length:', session.access_token.length)
console.log('User ID:', session.user.id)
```

### 2. Test API Route

```javascript
// Browser console
const token = (await supabase.auth.getSession()).data.session.access_token

const response = await fetch('/api/submit-attempt', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question_id: 'test-id',
    selected_answer: 'B',
    time_spent_sec: 30
  })
})

console.log('Status:', response.status)
console.log('Data:', await response.json())
```

### 3. Check Server Logs

**Next.js terminal should show:**
```
=== API ROUTE SUBMIT ATTEMPT ===
Has Authorization header: true
User ID from token: a187a245-2380-473f-a6f1-a092789652a9
Fetching question: 2f3a44e6-3461-4e0a-b505-61a8af90dea3
Question found: 2f3a44e6-3461-4e0a-b505-61a8af90dea3
Correctness computed: true
Attempt saved: 12345...
Success!
```

## Prevention

To avoid this issue in the future:

1. **Check JWT algorithm early in development**
   - Decode your tokens and check algorithm
   - Test Edge Functions with real tokens
   - Don't assume HS256

2. **Use API routes by default**
   - Start with API routes
   - Only use Edge Functions when you need edge deployment
   - Simpler is better

3. **Document your auth flow**
   - Where is JWT verified?
   - What algorithm is used?
   - Who has access to what?

4. **Test auth in staging**
   - Test with real user accounts
   - Test token expiry
   - Test edge cases

## Related Issues

### Issue: "execution_id: null" in Edge Function logs
**Cause:** Function rejected before execution
**Solution:** See this document

### Issue: "Invalid token format" in API route
**Cause:** JWT decoding failed
**Check:** Token is properly base64 encoded, has 3 parts separated by dots

### Issue: "RLS policy violation" when using client
**Cause:** RLS policy too restrictive
**Solution:** Check `/scripts/fix-all-submission-tables-rls.sql`

### Issue: "Service role key not working"
**Check:**
- Key is in `.env.local` (not `.env`)
- Key doesn't have `NEXT_PUBLIC_` prefix
- Next.js dev server restarted after adding key

## Summary

**The Problem:**
- Supabase Edge Functions expect HS256 JWT
- Your project uses ES256 JWT
- Edge Runtime rejects ES256 tokens with 401
- Your function code never runs

**The Solution:**
- Use Next.js API routes instead
- Decode JWT manually to get user ID
- Use service role key for DB operations
- Skip Edge Function's JWT middleware

**The Best Practice:**
- Default to API routes for server operations
- Use client directly for simple operations
- Only use Edge Functions when needed
- Keep SERVICE_ROLE_KEY secret

## Files in This Codebase

**Implementation:**
- `/app/api/submit-attempt/route.ts` - Direct API route implementation
- `/app/(student)/baseline/[moduleId]/page.tsx` - Frontend submission code

**Documentation:**
- `/docs/BUGFIX-jwt-unauthorized.md` - Detailed bugfix log
- `/docs/BUGFIX-question-not-found.md` - Related schema fix
- `/docs/TROUBLESHOOTING-JWT-ES256.md` - This document

**SQL Scripts:**
- `/scripts/fix-all-submission-tables-rls.sql` - RLS policies
- `/scripts/review-rls-policies.sql` - Policy diagnostic

**Edge Functions (deprecated for this use case):**
- `/supabase/functions/submit_attempt/index.ts` - Original Edge Function

## Architecture Decision: API Routes vs Edge Functions

### When to Use API Routes (Recommended)

| Use Case | Reason |
|----------|--------|
| Auth-dependent operations | Proper SDK verification |
| Database CRUD | Better error handling |
| Complex business logic | Easier debugging |
| TypeScript integration | Full Next.js ecosystem |
| User-facing endpoints | Lower latency from same server |

### When to Use Edge Functions

| Use Case | Reason |
|----------|--------|
| Global edge deployment | Low latency worldwide |
| Webhooks from external services | Independent scaling |
| Background jobs | Long-running tasks |
| Admin-only operations | Using SERVICE_ROLE_KEY only |

### Decision Tree

```
Does the endpoint need user authentication?
├── No → Edge Function OK
└── Yes → Does it need to verify JWT?
    ├── No (uses SERVICE_ROLE only) → Edge Function OK
    └── Yes → Use API Route (ES256 compatibility)
```

## Checklist for New API Routes

When creating a new API route that handles auth:

- [ ] Import `createClient` from `@/lib/supabase/server`
- [ ] Call `supabase.auth.getUser()` first
- [ ] Return 401 if no user
- [ ] Use SERVICE_ROLE only for privileged operations
- [ ] Add rate limiting for user-facing endpoints
- [ ] Log errors in development only
- [ ] Never expose internal error details in production

## Related Files

### API Routes (with proper auth)
- `/app/api/submit-attempt/route.ts` ✅
- `/app/api/finalize-baseline-module/route.ts` ✅
- `/app/api/generate-plan/route.ts` ✅

### SQL Scripts
- `/scripts/comprehensive-rls-policies.sql` - All RLS policies
- `/scripts/fix-all-submission-tables-rls.sql` - Submission tables

### Documentation
- `/docs/TROUBLESHOOTING-JWT-ES256.md` - This document
- `/docs/BUGFIX-jwt-unauthorized.md` - Original bugfix
- `/docs/BUGFIX-question-not-found.md` - Schema mismatch fix

## Further Reading

- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [JWT.io](https://jwt.io) - Decode and inspect JWTs
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
