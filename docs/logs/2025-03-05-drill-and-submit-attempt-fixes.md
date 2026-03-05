# Log: Drill flow and submit-attempt fixes

**Date:** 2025-03-05  
**Scope:** Drilling module (result vs retry, score always 0), submit-attempt 500 (column "constructs" does not exist).

This log is for human review and for feeding to AI agents to understand what was changed.

---

## 1. Summary

| Area | Problem | Approach | Outcome |
|------|---------|----------|---------|
| Drill submit | Score always 0 after submitting answers | Check `response.ok` and send `time_spent_sec` default | Client only counts successful responses; no bogus completion with 0 score |
| Drill UX | Opening completed module showed questions instead of result | Completion check + result page + list behavior | Completed → result; "Ulangi" → questions with `?retry=1` |
| Submit 500 | `column "constructs" does not exist` (42703) | **Removed** incompatible trigger (did not rewrite to fit schema) | Trigger dropped; API continues to update analytics |

---

## 2. Drill: score always 0 (Bug 1)

**Cause:** The drill runner sent each answer to `/api/submit-attempt` and did `return response.json()` without checking `response.ok`. On 4xx/5xx the body had no `is_correct`, so `results.filter((r) => r.is_correct).length` was 0.

**File changed:** `app/(student)/drill/drill/[taskId]/page.tsx`

**Changes:**
- After each `fetch("/api/submit-attempt", ...)`: parse JSON, then **if `!response.ok`**, throw with the API error message so the flow fails and we do not record a completion.
- Request body: use `time_spent_sec: data.timeSpent ?? 0` so the API never receives `undefined` (avoids 400 and old localStorage issues).

**Reference:** Baseline flow in `app/(student)/baseline/[moduleId]/page.tsx` already did `if (!response.ok) { ... throw ... }` before using the result.

---

## 3. Drill: completed module should show result unless retry (Bug 2)

**Cause:** The drill runner always loaded questions and never checked if the module was already completed. The list linked to the same URL for both "Mulai" and "Ulangi".

**Files changed:**

### 3.1 Runner: redirect when already completed

**File:** `app/(student)/drill/drill/[taskId]/page.tsx`

**Changes:**
- Use `useSearchParams()` to read `retry` query param.
- After resolving the module and user, query `module_completions` for `user_id`, `module_id`, `context_type = 'drill'` (latest by `completed_at`).
- If a completion exists and URL does **not** have `retry=1` or `retry=true`: `router.replace(\`/drill/drill/${taskId}/result\`)`, then return (do not load questions).
- If `?retry=1` is present or no completion: load questions and show `QuestionRunner` as before.

### 3.2 New result page

**File (new):** `app/(student)/drill/drill/[taskId]/result/page.tsx`

**Behavior:**
- Resolves `taskId` to module (same as runner: by module id or by plan_task id then module).
- Fetches latest drill completion for that module and current user.
- Renders result UI: pass/fail, score, correct/total, passing threshold.
- Buttons: **Lihat Pembahasan** → `/drill/pembahasan/[moduleId]`, **Coba Lagi** → `/drill/drill/[taskId]?retry=1`, **Kembali ke Drill** → `/drill`.

### 3.3 Drill list: result vs retry

**File:** `app/(student)/drill/page.tsx`

**Changes:**
- **Card click:** If module is completed → navigate to `/drill/drill/${module.id}/result`. If not completed → `/drill/drill/${module.id}`.
- **Button click** (with `e.stopPropagation()`): If completed ("Ulangi") → `/drill/drill/${module.id}?retry=1`. If not completed ("Mulai") → `/drill/drill/${module.id}`.

---

## 4. Submit-attempt 500: column "constructs" does not exist (Bug 3)

**Cause:** A trigger `attempt_analytics_trigger` runs `AFTER INSERT ON attempts` and calls `update_user_constructs_v2()`. That function does `SELECT constructs, sample_size FROM user_construct_state`. The table `user_construct_state` was created in migration 001 with columns like `construct_name`, `score`, `data_points`, `trend` (one row per construct). Migration 027 added a function written for a different shape (`constructs` JSONB, `sample_size`). Because the table already existed, 027’s `CREATE TABLE IF NOT EXISTS user_construct_state (...)` did not run, so those columns were never added. The trigger therefore caused error 42703 on every attempt insert.

**Decision:** **Remove the incompatible trigger** (we did **not** rewrite the trigger/function to fit the current schema).

**Reason:** The submit-attempt API (sections 11–12) already updates `user_skill_state` and `user_construct_state` using the existing schema. The trigger was redundant and wrong for the current DB; dropping it fixes the 500 without schema changes or function rewrites.

**File (new):** `supabase/migrations/035_drop_attempt_analytics_trigger.sql`

**Content:**
- `DROP TRIGGER IF EXISTS attempt_analytics_trigger ON attempts;`
- Comment on `attempts` updated to note analytics are updated by the submit-attempt API.

**Apply:** Run this migration (e.g. `supabase db push` or run the SQL in Supabase SQL Editor).

---

## 5. File list (for diff/review)

| Action | Path |
|--------|------|
| Modified | `app/(student)/drill/drill/[taskId]/page.tsx` |
| Modified | `app/(student)/drill/page.tsx` |
| Added | `app/(student)/drill/drill/[taskId]/result/page.tsx` |
| Added | `supabase/migrations/035_drop_attempt_analytics_trigger.sql` |
| Added | `docs/logs/2025-03-05-drill-and-submit-attempt-fixes.md` (this file) |

---

## 6. Trigger: removed vs changed

**Question:** Was the incompatible trigger removed or changed to fit the existing schema?

**Answer:** **Removed.** The trigger `attempt_analytics_trigger` was dropped. The function `update_user_constructs_v2` was not rewritten to use `construct_name`, `score`, `data_points`, `trend`. Analytics after each attempt are handled only by the submit-attempt API route, which already uses the current `user_construct_state` and `user_skill_state` schema.
