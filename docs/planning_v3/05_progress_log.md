# 05 — Progress Log (V3 Execution)

---

## V3-A: Critical Bugs + Drill Restructure + Pembahasan

### Completed Tasks

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| V3-T-001 | ✅ Done | `41d8d05` | Fix submit-attempt scoring (B-003) — refactored to use shared scoring lib |
| V3-T-021 | ✅ Done | `963ac40` | Verified question explanation field in schema + admin |
| V3-T-002 | ✅ Done | `9f226d8` | Removed redundant drill sub-routes (B-001) — -1822 LOC |
| V3-T-003 | ✅ Done | `1d566f8` | Fixed drill filter i18n labels (B-002) — hardcoded Indonesian |
| V3-T-004 | ✅ Done | `0b24b2c` | Rebuilt drill page two-tab layout (F-001) |
| V3-T-006 | ✅ Done | `1809655` | Module result with pembahasan + retry buttons (F-002) |
| V3-T-007 | ✅ Done | `e1ef3d5` | Created pembahasan (answer review) page (F-003) |
| V3-T-008 | ✅ Done | `8bd34cb` | Material card action buttons (F-004) |

### Open Blockers

_None._

### Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| Hardcode Indonesian labels (not i18n) | `createT` doesn't support fallback; no translations exist | V3-A |
| Insert (not upsert) for module_completions | DB unique constraint includes context_type + completed_at | V3-A |
| Pembahasan route as `/drill/pembahasan/[moduleId]` | Cleaner than query param; consistent with drill routes | V3-A |

### Commands Run

```
pnpm build — passed after every commit
pnpm vitest run — 59/59 tests passed after every commit
pnpm lint — warnings only (7 React Hook dependency warnings from baseline)
```

### Verification Results

| Check | Result | Date |
|-------|--------|------|
| Build | ✅ Pass | V3-A |
| Tests (59/59) | ✅ Pass | V3-A |
| Lint | ⚠️ Warnings only | V3-A |

---

## V3-B: Tanya Gaspol AI Chat

### Completed Tasks

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| (carryover) | ✅ Done | `80a9e2a` | Fix module_completions insert with all required columns |
| V3-T-009 | ✅ Done | `f411e27` | Migration 033: tanya_gaspol_chats + tanya_gaspol_quota tables |
| V3-T-010 | ✅ Done | `968c9da` | POST /api/tanya-gaspol — multi-provider AI, quota management |
| V3-T-011 | ✅ Done | `7b84d95` | TanyaGaspolChat component — modal, presets, history, quota UI |
| V3-T-012 | ✅ Done | `6ab42a0` | Integrated chat into material card page — button now opens dialog |

### Open Blockers

_None._

### Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| API route (not Edge Function) for Tanya Gaspol | Same auth pattern as submit-attempt; ES256 JWT incompatibility | V3-B |
| Raw fetch for AI calls (no SDK) | Matches edge function pattern; no new dependencies | V3-B |
| 5 tokens per question, 100 total | Per blueprint spec §5.8 | V3-B |
| Auto-initialize quota on first API call | Simpler than requiring explicit setup; idempotent | V3-B |
| module_completions fix: insert instead of upsert | Original V3-A code used onConflict: "user_id,module_id" but DB has UNIQUE(user_id, module_id, context_type, completed_at) | V3-B |

### Commands Run

```
pnpm build — passed after every commit
pnpm vitest run — 59/59 tests passed after every commit
supabase db push --dry-run — network error (env connectivity issue, not migration issue)
```

### Verification Results

| Check | Result | Date |
|-------|--------|------|
| Build | ✅ Pass | V3-B |
| Tests (59/59) | ✅ Pass | V3-B |
| Migration SQL syntax | ✅ Valid | V3-B |
| supabase db push --dry-run | ⚠️ Network error (env issue) | V3-B |

---

## V3-C: Flashcard Spaced Repetition

### Completed Tasks

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| V3-T-013 | ✅ Done | `e5e76ab` | Migration 034: flashcard_user_state table + RLS + indexes |
| V3-T-014 | ✅ Done | `3cb95b6` | SM-2 scheduling logic (pure function) + 18 unit tests |
| V3-T-019 | ✅ Done | `3327e3e` | Baseline gating: locked UI when baseline not complete |
| V3-T-015 | ✅ Done | `74b06f0` | POST /api/flashcard-review — SM-2 state update endpoint |
| V3-T-016 | ✅ Done | `179fe59` | MasteryStacks component — 2×2 grid with due counts |
| V3-T-017 | ✅ Done | `13c648d` | FlashcardStack rewrite — SM-2 buttons, API calls (fixes B-004, B-005) |
| V3-T-018 | ✅ Done | `6c3b091` | Flashcard init after baseline — batch insert for all L5 skills |

### Open Blockers

_None._

### Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| Hardcoded Indonesian labels (not i18n) | Consistent with V3-A/B pattern; fixes B-004 | V3-C |
| Show Answer button instead of flip animation | Simpler UX, more accessible, avoids CSS 3D transform issues | V3-C |
| Idempotent flashcard init via existing-state check | Prevents duplicates if finalize-baseline called multiple times | V3-C |
| Non-blocking flashcard init failure | Baseline finalization shouldn't fail due to flashcard init error | V3-C |
| Migration 034 follows 033 numbering | Both 033 + 034 pending remote push (network connectivity) | V3-C |

### Commands Run

```
pnpm build — passed after every commit
pnpm vitest run — 77/77 tests passed (59 existing + 18 new SM-2 tests)
```

### Verification Results

| Check | Result | Date |
|-------|--------|------|
| Build | ✅ Pass | V3-C |
| Tests (77/77) | ✅ Pass | V3-C |
| Migration 034 SQL syntax | ✅ Valid | V3-C |
| Pending migrations | ⚠️ 033 + 034 need `supabase db push` when remote reachable | V3-C |

---

## V3-D: Admin Verifications + Polish

### Completed Tasks

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| — | — | — | — |

### Open Blockers

_None yet._
