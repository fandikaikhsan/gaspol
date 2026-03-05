# 03 — Backlog (V3 Epics → Stories → Tasks)

---

## Epic 1: Critical Bug Fixes (P0)

### Story 1.1: Fix submit-attempt error (B-003)

| Field | Value |
|-------|-------|
| **ID** | V3-T-001 |
| **Priority** | P0 |
| **Effort** | 3h |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §8 Phase 1, Blueprint §13 B-003 |
| **Acceptance criteria** | 1) Correct answers award proper points (L1=1, L2=2, L3=5). 2) Incorrect answers award 0 points. 3) No "Failed to save attempt" error. 4) `user_skill_state.total_points` increments correctly. 5) `is_covered` flips to true at 20 points. 6) Existing 59 unit tests still pass. |
| **Test plan** | Run existing vitest suite. Add integration test with realistic payload. Manual test in browser with console logging. |
| **Files/areas** | `app/api/submit-attempt/route.ts` (~L196-230 attempt insert), `supabase/migrations/001_initial_schema.sql` (attempts table constraints) |
| **Supabase impact** | None (fix application logic, not schema) |

---

## Epic 2: Drill Page Restructure (F-001 + B-001 + B-002)

### Story 2.1: Remove redundant drill sub-routes (B-001)

| Field | Value |
|-------|-------|
| **ID** | V3-T-002 |
| **Priority** | P1 |
| **Effort** | 1h |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §5 "Needs Removal" |
| **Acceptance criteria** | 1) `/drill/drills`, `/drill/drills/practice`, `/drill/modules`, `/drill/mock`, `/drill/review` routes removed. 2) No dead links in app. 3) `/drill` and `/drill/drill/[taskId]` still work. 4) Build passes. |
| **Test plan** | Build check. Navigate all bottom nav tabs — no 404s. |
| **Files/areas** | `app/(student)/drill/drills/`, `app/(student)/drill/modules/`, `app/(student)/drill/mock/`, `app/(student)/drill/review/` — delete entire directories |
| **Supabase impact** | None |

### Story 2.2: Fix drill filter i18n labels (B-002)

| Field | Value |
|-------|-------|
| **ID** | V3-T-003 |
| **Priority** | P1 |
| **Effort** | 30min |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §5, Blueprint §13 B-002 |
| **Acceptance criteria** | 1) Filter tabs show "Semua" / "Tugas Wajib" / "Selesai" (or English equivalents). 2) No raw i18n keys visible. |
| **Test plan** | Visual inspection in browser. |
| **Files/areas** | `app/(student)/drill/page.tsx` ~L227-234 |
| **Supabase impact** | None |

### Story 2.3: Rebuild drill page with two-tab layout (F-001)

| Field | Value |
|-------|-------|
| **ID** | V3-T-004 |
| **Priority** | P1 |
| **Effort** | 8h |
| **Dependencies** | V3-T-002, V3-T-003 |
| **Delta ref** | 06_blueprint_v3_delta.md §5, Blueprint §5.5 |
| **Acceptance criteria** | 1) Two tabs: "Topic-Based Modules" and "Mixed Drills". 2) Topic-Based: modules grouped by L2 with L3 accordions. 3) Mixed Drills: L3 modules grouped by L2. 4) Mandatory plan tasks pinned above tabs. 5) Module cards show status (✓/⚠️/none). 6) Status filter (All/Required/Completed) works with proper labels. 7) Search by name works. 8) Click incomplete → QuestionRunner. 9) Click completed → result page. |
| **Test plan** | Unit: filter/search/grouping logic. Manual: visual hierarchy, accordion behavior, status indicators. Build check. |
| **Files/areas** | `app/(student)/drill/page.tsx` (rewrite), `components/drill/MandatoryTasks.tsx` (new), `components/drill/ModuleAccordion.tsx` (new) |
| **Supabase impact** | None (data queries only; modules + taxonomy_nodes + plan_tasks + module_completions) |

### Story 2.4: Add taxonomy filter dropdowns (F-001e)

| Field | Value |
|-------|-------|
| **ID** | V3-T-005 |
| **Priority** | P2 |
| **Effort** | 2h |
| **Dependencies** | V3-T-004 |
| **Delta ref** | Blueprint §5.5 (Filtering section) |
| **Acceptance criteria** | 1) Level-3, Level-4, Level-5 dropdown filters shown below status filter. 2) Selecting a filter narrows displayed modules. 3) Filters combine with status filter and search. |
| **Test plan** | Manual: select various filters, verify modules filter correctly. |
| **Files/areas** | `app/(student)/drill/page.tsx` |
| **Supabase impact** | None |

---

## Epic 3: Module Result & Pembahasan (F-002 + F-003)

### Story 3.1: Add pembahasan button + retry to module result page (F-002)

| Field | Value |
|-------|-------|
| **ID** | V3-T-006 |
| **Priority** | P1 |
| **Effort** | 3h |
| **Dependencies** | None |
| **Delta ref** | Blueprint §5.1 (Module Result Page) |
| **Acceptance criteria** | 1) Result page shows "Lihat Pembahasan", "Coba Lagi", "Kembali ke Drill" buttons. 2) "Lihat Pembahasan" navigates to `/drill/pembahasan?moduleId=<id>`. 3) "Coba Lagi" resets module completion and re-enters QuestionRunner. 4) "Kembali ke Drill" returns to `/drill`. |
| **Test plan** | Manual: complete module → see result → tap each button → verify navigation. |
| **Files/areas** | `app/(student)/baseline/[moduleId]/result/page.tsx`, `app/(student)/drill/drill/[taskId]/page.tsx` (or shared result component) |
| **Supabase impact** | Need to delete/reset `module_completions` record on retry (service role call) |

### Story 3.2: Create pembahasan page (F-003)

| Field | Value |
|-------|-------|
| **ID** | V3-T-007 |
| **Priority** | P1 |
| **Effort** | 6h |
| **Dependencies** | V3-T-006 |
| **Delta ref** | Blueprint §5.7 (Pembahasan Page), 06_blueprint_v3_delta.md §5 "Needs Creation" |
| **Acceptance criteria** | 1) Route `/drill/pembahasan?moduleId=<id>` renders. 2) All questions shown in module order. 3) Each question: text, user's answer (red if wrong), correct answer (green), explanation. 4) Material card link shown if published material_card exists for skill. 5) KaTeX math rendering works. 6) Back navigation to result page. |
| **Test plan** | Unit: material card existence check logic. Manual: complete module → view pembahasan → verify all questions. Math rendering check. |
| **Files/areas** | `app/(student)/drill/pembahasan/page.tsx` (new), `components/drill/PembahasanView.tsx` (new) |
| **Supabase impact** | Read-only queries: modules → questions, attempts (user's), material_cards (existence check) |

---

## Epic 4: Material Card Navigation (F-004)

### Story 4.1: Add action buttons to material card detail page (F-004)

| Field | Value |
|-------|-------|
| **ID** | V3-T-008 |
| **Priority** | P1 |
| **Effort** | 2h |
| **Dependencies** | V3-T-007 (for "Back to Pembahasan" context) |
| **Delta ref** | Blueprint §5.2 (action buttons), 06_blueprint_v3_delta.md §5 |
| **Acceptance criteria** | 1) "Latihan Skill Ini" button on material card detail page. 2) From Review: navigates to Drill page filtered to this skill's modules. 3) From Pembahasan: button label changes to "Kembali ke Pembahasan", navigates back. 4) Context detected via URL param `?from=pembahasan&moduleId=xxx`. |
| **Test plan** | Manual: open material card from review → see "Latihan Skill Ini". Open from pembahasan → see "Kembali ke Pembahasan". |
| **Files/areas** | `app/(student)/review/[skillId]/page.tsx` |
| **Supabase impact** | None |

---

## Epic 5: Tanya Gaspol AI Chat (F-005)

### Story 5.1: Create Tanya Gaspol DB migration (F-005a)

| Field | Value |
|-------|-------|
| **ID** | V3-T-009 |
| **Priority** | P1 |
| **Effort** | 30min |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §3 "New Migrations Required", Blueprint §5.8 Data Model |
| **Acceptance criteria** | 1) Migration 033 creates `tanya_gaspol_chats` and `tanya_gaspol_quota` tables. 2) RLS policies applied. 3) Indexes created. 4) Migration applies cleanly (dry-run). |
| **Test plan** | `supabase db push --dry-run`. Verify tables in Supabase dashboard. |
| **Files/areas** | `supabase/migrations/033_tanya_gaspol.sql` (new) |
| **Supabase impact** | New migration — 2 new tables + RLS + indexes |

### Story 5.2: Create Tanya Gaspol API endpoint (F-005b)

| Field | Value |
|-------|-------|
| **ID** | V3-T-010 |
| **Priority** | P1 |
| **Effort** | 4h |
| **Dependencies** | V3-T-009 |
| **Delta ref** | Blueprint §5.8 (Backend/API Impact) |
| **Acceptance criteria** | 1) `POST /api/tanya-gaspol` accepts {skill_id, message, skill_name, material_context}. 2) Checks token quota before calling AI. 3) Calls AI with system prompt (Bahasa Indonesia, scoped to material). 4) Uses model from `ai_settings` table. 5) Stores user + assistant messages in `tanya_gaspol_chats`. 6) Decrements quota (5 tokens per question). 7) Returns {reply, tokens_used, remaining_tokens}. 8) Returns quota exhausted error when quota depleted. |
| **Test plan** | Unit: quota check logic, prompt generation. Integration: API call with mock AI. |
| **Files/areas** | `app/api/tanya-gaspol/route.ts` (new) |
| **Supabase impact** | Reads `ai_settings`, writes `tanya_gaspol_chats` + `tanya_gaspol_quota` (service role) |

### Story 5.3: Create Tanya Gaspol chat component (F-005c)

| Field | Value |
|-------|-------|
| **ID** | V3-T-011 |
| **Priority** | P1 |
| **Effort** | 6h |
| **Dependencies** | V3-T-010 |
| **Delta ref** | Blueprint §5.8, 06_blueprint_v3_delta.md §7 "Needs Creation" |
| **Acceptance criteria** | 1) Modal opens from "Tanya Gaspol" button on material card. 2) Shows token quota (X / 100 remaining). 3) Preset questions (3 chips) — tap to send. 4) Free-form text input. 5) Chat messages display (user + assistant bubbles). 6) Previous messages load for same skill. 7) Loading/typing indicator during AI response. 8) Quota exhaustion shows sad state + disabled input. 9) Labels in Bahasa Indonesia. |
| **Test plan** | Manual: open chat → send preset → get response → send custom → verify quota → exhaust quota. |
| **Files/areas** | `components/review/TanyaGaspolChat.tsx` (new) |
| **Supabase impact** | None (uses API route) |

### Story 5.4: Integrate Tanya Gaspol into material card page (F-005d)

| Field | Value |
|-------|-------|
| **ID** | V3-T-012 |
| **Priority** | P1 |
| **Effort** | 1h |
| **Dependencies** | V3-T-011, V3-T-008 |
| **Delta ref** | Blueprint §5.2, §5.8 |
| **Acceptance criteria** | 1) "Tanya Gaspol" button visible on material card detail page. 2) Tapping opens TanyaGaspolChat modal. 3) Material card context (core_idea, key_facts, common_mistakes) passed to chat. |
| **Test plan** | Manual: navigate to material card → tap "Tanya Gaspol" → verify modal opens with context. |
| **Files/areas** | `app/(student)/review/[skillId]/page.tsx` |
| **Supabase impact** | None |

---

## Epic 6: Flashcard Spaced Repetition Revamp (F-006)

### Story 6.1: Create flashcard SR DB migration (F-006a)

| Field | Value |
|-------|-------|
| **ID** | V3-T-013 |
| **Priority** | P1 |
| **Effort** | 30min |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §3, Blueprint §5.9 Data Model |
| **Acceptance criteria** | 1) Migration 034 creates `flashcard_user_state` table. 2) RLS policies applied. 3) Indexes created (due_at, mastery_bucket). 4) Migration applies cleanly. |
| **Test plan** | `supabase db push --dry-run`. |
| **Files/areas** | `supabase/migrations/034_flashcard_sr.sql` (new) |
| **Supabase impact** | New migration — 1 new table + RLS + indexes |

### Story 6.2: Implement SM-2 scheduling logic (F-006c)

| Field | Value |
|-------|-------|
| **ID** | V3-T-014 |
| **Priority** | P1 |
| **Effort** | 2h |
| **Dependencies** | None |
| **Delta ref** | Blueprint §7.9 (Flashcard SM-2 Scheduling) |
| **Acceptance criteria** | 1) Pure function `updateFlashcardState(current, response)` returns new state. 2) Forgot: reps=0, interval=0, ease≥1.3, due=now+10min. 3) Hard: reps++, interval*=1.2, ease−=0.15. 4) Good: reps++, interval=(1,3,interval*ease). 5) Easy: reps++, interval*=(ease+0.3), ease+=0.15. 6) Unit tests for all 4 responses with edge cases. |
| **Test plan** | Unit tests: 10+ test cases covering all responses, boundary values for ease_factor (min 1.3), first/second/third review cycles. |
| **Files/areas** | `lib/assessment/flashcard-sm2.ts` (new), `tests/flashcard-sm2.test.ts` (new) |
| **Supabase impact** | None (pure logic) |

### Story 6.3: Create flashcard review API endpoint (F-006b)

| Field | Value |
|-------|-------|
| **ID** | V3-T-015 |
| **Priority** | P1 |
| **Effort** | 3h |
| **Dependencies** | V3-T-013, V3-T-014 |
| **Delta ref** | Blueprint §5.9 (Backend/API Impact) |
| **Acceptance criteria** | 1) `POST /api/flashcard-review` accepts {skill_id, response}. 2) Auth check: user must be logged in. 3) Fetches current flashcard_user_state for user+skill. 4) Applies SM-2 logic. 5) Upserts updated state. 6) Returns updated state. |
| **Test plan** | Integration: POST with valid payload → verify DB state update. |
| **Files/areas** | `app/api/flashcard-review/route.ts` (new) |
| **Supabase impact** | Reads/writes `flashcard_user_state` (service role) |

### Story 6.4: Create mastery stacks UI (F-006d)

| Field | Value |
|-------|-------|
| **ID** | V3-T-016 |
| **Priority** | P1 |
| **Effort** | 4h |
| **Dependencies** | V3-T-013 |
| **Delta ref** | Blueprint §5.9 (Review Page UI) |
| **Acceptance criteria** | 1) 2×2 grid: Forgot, Hard, Good, Easy stacks. 2) Each stack shows due count, total count, status text. 3) Stack visual: empty / 3-layer / 5-layer based on count. 4) Tap stack → starts filtered review session. 5) "Review All Due" CTA at bottom. 6) Hardcoded labels (not i18n keys — fixes B-004). |
| **Test plan** | Manual: verify 2×2 grid layout, correct counts, tap behavior. Test on mobile viewport. |
| **Files/areas** | `components/review/MasteryStacks.tsx` (new), `app/(student)/review/flashcards/page.tsx` (rewrite) |
| **Supabase impact** | Read: `flashcard_user_state` aggregated by mastery_bucket |

### Story 6.5: Refactor FlashcardStack with SM-2 integration (F-006e)

| Field | Value |
|-------|-------|
| **ID** | V3-T-017 |
| **Priority** | P1 |
| **Effort** | 5h |
| **Dependencies** | V3-T-015, V3-T-016 |
| **Delta ref** | Blueprint §5.9, 06_blueprint_v3_delta.md §7 |
| **Acceptance criteria** | 1) Card shows front, "Show Answer" reveals back. 2) 4 mastery buttons (Forgot/Hard/Good/Easy) visible after reveal. 3) Buttons fit within page width (fixes B-005). 4) Tapping button calls API, animates card, advances. 5) Card content from material_cards (front=skill name, back=core_idea+key_facts). 6) All labels hardcoded (fixes B-004). |
| **Test plan** | Manual: review session → answer cards → verify state persists → revisit → cards rescheduled. Mobile viewport check for button overflow. |
| **Files/areas** | `components/review/FlashcardStack.tsx` (rewrite) |
| **Supabase impact** | None (uses API) |

### Story 6.6: Flashcard initialization after baseline (F-006f)

| Field | Value |
|-------|-------|
| **ID** | V3-T-018 |
| **Priority** | P1 |
| **Effort** | 2h |
| **Dependencies** | V3-T-013 |
| **Delta ref** | Blueprint §5.9 (Initialization) |
| **Acceptance criteria** | 1) When all baseline modules complete, create `flashcard_user_state` for ALL level-5 skills. 2) All initialized with forgot bucket, due=now. 3) Idempotent (running twice doesn't create duplicates). |
| **Test plan** | Integration: complete baseline → verify flashcard records created for all L5 skills. |
| **Files/areas** | `app/api/finalize-baseline-module/route.ts` (add initialization trigger when all baseline done) |
| **Supabase impact** | Batch insert into `flashcard_user_state` |

### Story 6.7: Baseline gating for flashcards (F-006g)

| Field | Value |
|-------|-------|
| **ID** | V3-T-019 |
| **Priority** | P1 |
| **Effort** | 1h |
| **Dependencies** | None |
| **Delta ref** | Blueprint §5.9 (Gating / Unlocking Rule) |
| **Acceptance criteria** | 1) If baseline not complete, show locked UI: "Flashcards unlock after Baseline" + "Start Baseline Assessment" CTA. 2) CTA navigates to `/plan`. 3) After baseline complete, show mastery stacks. |
| **Test plan** | Manual: new user → flashcards locked → complete baseline → flashcards unlocked. |
| **Files/areas** | `app/(student)/review/flashcards/page.tsx` |
| **Supabase impact** | Read: `user_state.current_phase` |

---

## Epic 7: Admin Verifications (no code change expected)

### Story 7.1: Verify admin module drill_focus support

| Field | Value |
|-------|-------|
| **ID** | V3-T-020 |
| **Priority** | P2 |
| **Effort** | 1h |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §6 ADM-01 |
| **Acceptance criteria** | 1) Admin can create `drill_focus` module targeting a single L5 skill. 2) Question assignment works for this type. |
| **Test plan** | Manual: create drill_focus module in admin → verify it appears in student drill page. |
| **Files/areas** | `app/admin/modules/page.tsx` |
| **Supabase impact** | None |

### Story 7.2: Verify question explanation field in admin

| Field | Value |
|-------|-------|
| **ID** | V3-T-021 |
| **Priority** | P1 |
| **Effort** | 1h |
| **Dependencies** | None |
| **Delta ref** | 06_blueprint_v3_delta.md §6 ADM-02, Blueprint §4.4 Step 4 |
| **Acceptance criteria** | 1) `explanation` field visible and editable in admin question form. 2) AI question generation includes explanations. |
| **Test plan** | Manual: edit a question in admin → verify explanation field. Check AI generated questions for explanation. |
| **Files/areas** | `app/admin/questions/page.tsx`, `supabase/functions/generate_questions/` |
| **Supabase impact** | None |

---

## Summary Table

| ID | Title | Epic | Priority | Effort | Dependencies | Status |
|----|-------|------|----------|--------|-------------|--------|
| V3-T-001 | Fix submit-attempt error (B-003) | 1 | P0 | 3h | — | Not started |
| V3-T-002 | Remove redundant drill sub-routes (B-001) | 2 | P1 | 1h | — | Not started |
| V3-T-003 | Fix drill filter i18n labels (B-002) | 2 | P1 | 30min | — | Not started |
| V3-T-004 | Rebuild drill page two-tab layout (F-001) | 2 | P1 | 8h | T-002, T-003 | Not started |
| V3-T-005 | Add taxonomy filter dropdowns (F-001e) | 2 | P2 | 2h | T-004 | Not started |
| V3-T-006 | Module result: pembahasan + retry buttons (F-002) | 3 | P1 | 3h | — | Not started |
| V3-T-007 | Create pembahasan page (F-003) | 3 | P1 | 6h | T-006 | Not started |
| V3-T-008 | Material card action buttons (F-004) | 4 | P1 | 2h | T-007 | Not started |
| V3-T-009 | Tanya Gaspol DB migration (F-005a) | 5 | P1 | 30min | — | Not started |
| V3-T-010 | Tanya Gaspol API endpoint (F-005b) | 5 | P1 | 4h | T-009 | Not started |
| V3-T-011 | Tanya Gaspol chat component (F-005c) | 5 | P1 | 6h | T-010 | Not started |
| V3-T-012 | Integrate Tanya Gaspol into material card (F-005d) | 5 | P1 | 1h | T-011, T-008 | Not started |
| V3-T-013 | Flashcard SR DB migration (F-006a) | 6 | P1 | 30min | — | Not started |
| V3-T-014 | SM-2 scheduling logic (F-006c) | 6 | P1 | 2h | — | Not started |
| V3-T-015 | Flashcard review API endpoint (F-006b) | 6 | P1 | 3h | T-013, T-014 | Not started |
| V3-T-016 | Mastery stacks UI (F-006d) | 6 | P1 | 4h | T-013 | Not started |
| V3-T-017 | FlashcardStack refactor (F-006e) | 6 | P1 | 5h | T-015, T-016 | Not started |
| V3-T-018 | Flashcard init after baseline (F-006f) | 6 | P1 | 2h | T-013 | Not started |
| V3-T-019 | Baseline gating for flashcards (F-006g) | 6 | P1 | 1h | — | Not started |
| V3-T-020 | Verify admin drill_focus support | 7 | P2 | 1h | — | Not started |
| V3-T-021 | Verify question explanation in admin | 7 | P1 | 1h | — | Not started |

**Total tasks:** 21  
**Total effort estimate:** ~56 hours  
**P0 tasks:** 1  
**P1 tasks:** 18  
**P2 tasks:** 2  
