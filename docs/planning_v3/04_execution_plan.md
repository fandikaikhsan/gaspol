# 04 — Execution Plan (V3 Milestones)

---

## Milestone Overview

| Milestone | Focus | Tasks | Est. Effort | Dependencies |
|-----------|-------|-------|-------------|--------------|
| **V3-A** | Critical bugs + Drill restructure + Pembahasan | V3-T-001 to V3-T-008, V3-T-021 | ~26h | None |
| **V3-B** | Tanya Gaspol AI Chat | V3-T-009 to V3-T-012 | ~12h | V3-A (T-008) |
| **V3-C** | Flashcard Spaced Repetition | V3-T-013 to V3-T-019 | ~18h | V3-A baseline |
| **V3-D** | Admin verifications + Polish | V3-T-005, V3-T-020 | ~3h | V3-A, V3-B, V3-C |

---

## V3-A: Critical Bugs + Drill Restructure + Pembahasan

**Goal:** Fix the P0 scoring bug, clean up drill routes, rebuild the drill page per v3 spec, and deliver the pembahasan (answer review) flow.

**Why first:** B-003 (scoring) is P0 and blocks all drill/practice functionality. The drill restructure is the largest UI change and unblocks pembahasan + material card navigation. These form the core learning loop.

### Tasks (ordered by execution sequence)

| Order | ID | Title | Priority | Effort | Depends on |
|-------|-----|-------|----------|--------|------------|
| 1 | V3-T-001 | Fix submit-attempt error (B-003) | P0 | 3h | — |
| 2 | V3-T-021 | Verify question explanation in admin | P1 | 1h | — |
| 3 | V3-T-002 | Remove redundant drill sub-routes (B-001) | P1 | 1h | — |
| 4 | V3-T-003 | Fix drill filter i18n labels (B-002) | P1 | 30min | — |
| 5 | V3-T-004 | Rebuild drill page two-tab layout (F-001) | P1 | 8h | T-002, T-003 |
| 6 | V3-T-006 | Module result: pembahasan + retry buttons (F-002) | P1 | 3h | — |
| 7 | V3-T-007 | Create pembahasan page (F-003) | P1 | 6h | T-006 |
| 8 | V3-T-008 | Material card action buttons (F-004) | P1 | 2h | T-007 |

**Estimated total:** ~24.5h

### Sequencing Rationale
1. **T-001 first** — P0 bug, unblocks all drill functionality. Must fix before testing any drill changes.
2. **T-021 early** — Quick verification that explanation data exists for pembahasan. If missing, we know before building the pembahasan page.
3. **T-002, T-003** — Quick cleanup tasks that must happen before the main drill rewrite. Removing old routes avoids confusion. Fixing i18n labels is trivial.
4. **T-004** — The main drill page rewrite. Depends on T-002/T-003 being done. Largest task in this milestone.
5. **T-006** — Module result improvements (pembahasan button + retry). Independent of drill rewrite but logically follows.
6. **T-007** — Pembahasan page creation. Depends on T-006 for navigation flow.
7. **T-008** — Material card action buttons. Depends on T-007 for "Back to Pembahasan" context. The "Tanya Gaspol" button will be wired in V3-B.

### Build/Test Checkpoints
- After T-001: `pnpm test` (59 tests pass) + manual scoring verification
- After T-002: `pnpm build` (no broken imports from removed routes)
- After T-004: `pnpm build` + manual drill page verification
- After T-008: Full `pnpm build` + `pnpm test` + `pnpm lint`

---

## V3-B: Tanya Gaspol AI Chat

**Goal:** Deliver the AI chat feature for material cards — DB tables, API, chat component, and integration.

**Why second:** Depends on V3-A's material card action buttons (T-008) for the "Tanya Gaspol" button placement. Also benefits from the scoring fix (T-001) being done so the learning loop works end-to-end.

### Tasks (ordered)

| Order | ID | Title | Priority | Effort | Depends on |
|-------|-----|-------|----------|--------|------------|
| 1 | V3-T-009 | Tanya Gaspol DB migration | P1 | 30min | — |
| 2 | V3-T-010 | Tanya Gaspol API endpoint | P1 | 4h | T-009 |
| 3 | V3-T-011 | Tanya Gaspol chat component | P1 | 6h | T-010 |
| 4 | V3-T-012 | Integrate into material card page | P1 | 1h | T-011, T-008 |

**Estimated total:** ~11.5h

### Supabase Governance
- Migration 033 must be created, tested with `--dry-run`, and pushed before API work.
- RLS: users own their chats and quota. Service role updates quota on API calls.

### Build/Test Checkpoints
- After T-009: `supabase db push --dry-run` passes
- After T-010: Manual API test with curl
- After T-012: Full build + lint

---

## V3-C: Flashcard Spaced Repetition Revamp

**Goal:** Replace the basic flashcard UI with a full Anki-like SM-2 system — mastery stacks, scheduling, and baseline gating.

**Why third:** Independent of Tanya Gaspol. Can be worked on in parallel with V3-B if needed. Depends on V3-A baseline being stable.

### Tasks (ordered)

| Order | ID | Title | Priority | Effort | Depends on |
|-------|-----|-------|----------|--------|------------|
| 1 | V3-T-013 | Flashcard SR DB migration | P1 | 30min | — |
| 2 | V3-T-014 | SM-2 scheduling logic | P1 | 2h | — |
| 3 | V3-T-019 | Baseline gating for flashcards | P1 | 1h | — |
| 4 | V3-T-015 | Flashcard review API endpoint | P1 | 3h | T-013, T-014 |
| 5 | V3-T-016 | Mastery stacks UI | P1 | 4h | T-013 |
| 6 | V3-T-017 | FlashcardStack refactor | P1 | 5h | T-015, T-016 |
| 7 | V3-T-018 | Flashcard init after baseline | P1 | 2h | T-013 |

**Estimated total:** ~17.5h

### Supabase Governance
- Migration 034 must be created, tested with `--dry-run`, and pushed before API work.

### Build/Test Checkpoints
- After T-013: `supabase db push --dry-run` passes
- After T-014: Unit tests for SM-2 logic pass
- After T-017: Full build + lint + visual mobile testing
- After T-018: Integration test of baseline → flashcard init

---

## V3-D: Admin Verifications + Polish

**Goal:** Verify admin-side compatibility with v3 features and add taxonomy filter dropdowns (P2).

### Tasks

| Order | ID | Title | Priority | Effort | Depends on |
|-------|-----|-------|----------|--------|------------|
| 1 | V3-T-005 | Add taxonomy filter dropdowns | P2 | 2h | T-004 |
| 2 | V3-T-020 | Verify admin drill_focus support | P2 | 1h | — |

**Estimated total:** ~3h

---

## Critical Path

```
T-001 (P0 bug) ───────────────────────────────────────────────────┐
                                                                   │
T-002 (remove routes) ─┐                                          │
T-003 (fix i18n) ──────┤                                          │
                       ├─ T-004 (drill rewrite) ──┐               │
                                                   │               │
T-006 (result page) ─── T-007 (pembahasan) ─── T-008 (MC buttons)│
                                                   │               │
                                                   ├─ V3-A DONE ──┘
                                                   │
T-009 (TG migration) ─ T-010 (TG API) ─ T-011 (TG component) ─ T-012 (TG integrate)
                                                                      │
                                                                      ├─ V3-B DONE
                                                                      │
T-013 (FC migration) ─┬─ T-015 (FC API) ─┬─ T-017 (FC refactor) ─── T-018 (FC init)
T-014 (SM-2 logic) ───┘                  │                            │
T-019 (gating) ───────────────────────────┤                           ├─ V3-C DONE
                                          │                           │
                                          ├─ T-016 (stacks UI) ──────┘
```

---

## Testing Strategy

### Unit Tests
| Area | Tests | Tool |
|------|-------|------|
| SM-2 scheduling | 10+ cases (all 4 responses, edge values) | Vitest |
| Drill filter/search | Filter by status, taxonomy, search text | Vitest |
| Point calculation | Existing 59 tests (scoring pipeline) | Vitest |

### Integration Tests
| Area | Approach |
|------|----------|
| Submit-attempt scoring | Verify DB state after API calls |
| Tanya Gaspol API | Mock AI, verify quota management |
| Flashcard review API | Verify SM-2 state persistence |

### Manual Tests
| Area | Checklist |
|------|-----------|
| Drill page | Two tabs, accordions, filters, search, module cards |
| Pembahasan | All question types, math rendering, material links |
| Tanya Gaspol | Preset Qs, free-form, quota exhaustion, persistence |
| Flashcard SR | Mastery stacks, review session, button layout (mobile) |

### Build Verification
- After every milestone: `pnpm build` + `pnpm test` + `pnpm lint`
- Migration checks: `supabase db push --dry-run` before pushing

---

## Release Readiness Checklist

### V3-A Release
- [ ] B-003 fixed — scoring works end-to-end
- [ ] Drill page restructured — two tabs, accordions, mandatory tasks
- [ ] Filter labels display correctly (not i18n keys)
- [ ] Redundant drill routes removed
- [ ] Pembahasan page functional
- [ ] Module result has retry + pembahasan buttons
- [ ] Material card has "Latihan Skill Ini" button
- [ ] Build passes
- [ ] All existing tests pass
- [ ] No new lint errors

### V3-B Release
- [ ] Migration 033 applied cleanly
- [ ] Tanya Gaspol API responds correctly
- [ ] Chat modal opens and functions
- [ ] Token quota tracks correctly
- [ ] Chat history persists per skill
- [ ] Quota exhaustion UI works
- [ ] Build passes

### V3-C Release
- [ ] Migration 034 applied cleanly
- [ ] SM-2 logic has unit tests
- [ ] Flashcard review API works
- [ ] Mastery stacks display correctly
- [ ] Flashcard review session functional
- [ ] Buttons fit on mobile (B-005 fixed)
- [ ] Labels hardcoded (B-004 fixed)
- [ ] Baseline gating works
- [ ] Flashcard init after baseline works
- [ ] Build passes + SM-2 unit tests pass

---

## Supabase Governance

### Migration Discipline
1. All schema changes via numbered migrations in `supabase/migrations/`
2. No manual DDL in production dashboard
3. Test with `supabase db push --dry-run` before any push
4. Document migration in progress log after application

### Edge Functions
- All edge functions stored in `supabase/functions/` (version controlled)
- New API routes use Next.js API routes (not Edge Functions) unless there's a security reason

### Drift Checks
- Run `supabase migration list --linked` before each milestone start
- Compare local migration count with remote
- If drift detected: document, fix, and verify before proceeding

### RLS Policy Governance
- Every new table gets RLS enabled in the same migration
- User-scoped tables: `USING (user_id = auth.uid())`
- Service role bypasses RLS for API writes
- Document all RLS policies in migration comments
