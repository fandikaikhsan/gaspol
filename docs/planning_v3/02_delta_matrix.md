# 02 — Delta Matrix (V3 Requirement → Implementation Gap)

**Key:** ✅ Done | 🟡 Partial | ❌ Missing | ⚠️ Unknown

---

## 1. Feature Requirements

| ID | v3 Requirement | Current Implementation | Gap | Status | Proposed Location |
|----|---------------|----------------------|-----|--------|-------------------|
| **F-001** | **Drill page: two-tab layout** | Flat module list with basic filter tabs | Need: tab switcher (Topic-Based / Mixed), accordion grouping by level-2/3, module cards with status indicators, taxonomy filters, search | ❌ Missing | `app/(student)/drill/page.tsx` (rewrite) |
| F-001a | Mandatory tasks pinned at top | Tasks are listed but not visually pinned/separated | Need: dedicated section above tabs for plan tasks | 🟡 Partial | `components/drill/MandatoryTasks.tsx` (new) |
| F-001b | Topic-Based tab: L5 modules grouped by L2 → L3 accordion | No grouping — flat list | Need: full taxonomy hierarchy join + accordion UI | ❌ Missing | `components/drill/ModuleAccordion.tsx` (new) |
| F-001c | Mixed Drills tab: L3 modules grouped by L2 | No tab separation | Need: filter by module_type=drill_mixed, group by L2 | ❌ Missing | `app/(student)/drill/page.tsx` |
| F-001d | Status indicators (✓, ⚠️, none) on module cards | Completion badge exists | Need: plan task indicator (⚠️) | 🟡 Partial | `app/(student)/drill/page.tsx` |
| F-001e | Taxonomy filter (L3, L4, L5 dropdowns) | No taxonomy filter | Need: filter dropdowns with taxonomy data | ❌ Missing | `app/(student)/drill/page.tsx` |
| F-001f | Search by module name | No search | Need: text input with client-side filter | ❌ Missing | `app/(student)/drill/page.tsx` |
| F-001g | Admin-defined question order (not random) | Unknown — likely random | Need: verify QuestionRunner uses module's question_ids order | ⚠️ Unknown | `components/assessment/QuestionRunner.tsx` |
| **F-002** | **Module Result page improvements** | Result page exists at `/baseline/[moduleId]/result` with pass/fail | Need: "Lihat Pembahasan" button, "Coba Lagi" retry with completion reset, "Kembali ke Drill" button | 🟡 Partial | `app/(student)/baseline/[moduleId]/result/page.tsx`, `app/(student)/drill/drill/[taskId]/page.tsx` |
| F-002a | Retry resets module_completions | No retry mechanism | Need: API call to reset/delete module_completions record, re-enter QuestionRunner | ❌ Missing | `app/api/submit-attempt/route.ts` or new endpoint |
| **F-003** | **Pembahasan (answer review) page** | No pembahasan page exists | Need: full page showing all questions with answers, explanations, material card links | ❌ Missing | `app/(student)/drill/pembahasan/page.tsx` (new), `components/drill/PembahasanView.tsx` (new) |
| F-003a | Per-question explanation display | `questions.explanation` field exists in DB | Need: fetch and render explanation text | 🟡 Partial (data exists) | `components/drill/PembahasanView.tsx` |
| F-003b | Material card link per question | Material card pages exist | Need: check material_card existence by skill_id, render conditional link | ❌ Missing | `components/drill/PembahasanView.tsx` |
| **F-004** | **Material Card drill & navigation buttons** | Material card detail exists, no action buttons | Need: "Latihan Skill Ini" button (context-aware) + "Tanya Gaspol" button | ❌ Missing | `app/(student)/review/[skillId]/page.tsx` |
| F-004a | Context-aware button label ("Drill" vs "Back to Pembahasan") | No context detection | Need: URL param `?from=pembahasan` detection, conditional label | ❌ Missing | `app/(student)/review/[skillId]/page.tsx` |
| **F-005** | **Tanya Gaspol AI Chat** | No chat feature exists | Need: full implementation — DB tables, API endpoint, chat modal component | ❌ Missing | Multiple files (see below) |
| F-005a | DB tables (tanya_gaspol_chats, tanya_gaspol_quota) | Tables don't exist | Need: migration 033 | ❌ Missing | `supabase/migrations/033_tanya_gaspol.sql` |
| F-005b | API endpoint POST /api/tanya-gaspol | Endpoint doesn't exist | Need: full implementation with AI call, quota management | ❌ Missing | `app/api/tanya-gaspol/route.ts` (new) |
| F-005c | Chat modal component | Doesn't exist | Need: TanyaGaspolChat.tsx with preset Qs, history, quota display | ❌ Missing | `components/review/TanyaGaspolChat.tsx` (new) |
| F-005d | Token quota system (100 tokens, 5 per question) | No quota system | Need: DB table + decrement logic in API | ❌ Missing | Migration 033 + API |
| F-005e | Chat persistence per skill | No chat storage | Need: load/save messages by user_id + skill_id | ❌ Missing | API + component |
| **F-006** | **Flashcard spaced repetition revamp** | Basic swipe flashcards, no SR | Need: full SM-2 system — DB, API, mastery stacks UI, scheduling | ❌ Missing | Multiple files (see below) |
| F-006a | DB table (flashcard_user_state) | Table doesn't exist | Need: migration 034 | ❌ Missing | `supabase/migrations/034_flashcard_sr.sql` |
| F-006b | API endpoint POST /api/flashcard-review | Endpoint doesn't exist | Need: SM-2 state update logic | ❌ Missing | `app/api/flashcard-review/route.ts` (new) |
| F-006c | SM-2 scheduling logic | No SR logic exists | Need: pure function for schedule calculation | ❌ Missing | `lib/assessment/flashcard-sm2.ts` (new) |
| F-006d | Mastery stacks 2×2 grid UI | No stacks UI | Need: MasteryStacks component | ❌ Missing | `components/review/MasteryStacks.tsx` (new) |
| F-006e | FlashcardStack refactor with SM-2 | Basic swipe only | Need: integrate SM-2 state, 4-button mastery response | 🟡 Partial | `components/review/FlashcardStack.tsx` |
| F-006f | Flashcard initialization after baseline | No initialization | Need: create flashcard_user_state for all L5 skills after baseline | ❌ Missing | `app/api/finalize-baseline-module/route.ts` or separate |
| F-006g | Baseline gating UI | No gating | Need: locked state with CTA to Plan page | ❌ Missing | `app/(student)/review/flashcards/page.tsx` |

---

## 2. Bug Fixes

| ID | Bug | Current State | Gap | Status | File(s) |
|----|-----|--------------|-----|--------|---------|
| **B-001** | Drill route redundancy | 5 sub-routes exist: `/drill/drills/`, `/drill/drills/practice/`, `/drill/modules/`, `/drill/mock/`, `/drill/review/` | Remove all; consolidate into `/drill/page.tsx` | ❌ Not fixed | `app/(student)/drill/drills/`, `app/(student)/drill/modules/`, `app/(student)/drill/mock/`, `app/(student)/drill/review/` |
| **B-002** | Filter labels show i18n keys | `tc("filter.all")` etc. renders raw keys | Hardcode labels or fix i18n | ❌ Not fixed | `app/(student)/drill/page.tsx` ~L227 |
| **B-003** | Answer check returns 0 pts / "Failed to save attempt" | Reported in prod; 59 unit tests pass | Debug actual DB constraint violation; add error logging | ❌ Not fixed | `app/api/submit-attempt/route.ts` ~L196-230 |
| **B-004** | Flashcard labels show i18n keys | `t("flashcards.cardOf")` etc. | Hardcode labels | ❌ Not fixed | `components/review/FlashcardStack.tsx` |
| **B-005** | Flashcard buttons overflow | Fixed-width buttons exceed viewport | Use flex-1 equal distribution | ❌ Not fixed | `components/review/FlashcardStack.tsx` ~L128-145 |

---

## 3. Admin Verifications Needed

| ID | Check | Current State | Gap | Status | File(s) |
|----|-------|--------------|-----|--------|---------|
| ADM-01 | Admin modules page supports `drill_focus` type | `drill_mixed` confirmed at L81 | Verify drill_focus targeting per L5 skill | ⚠️ Unknown | `app/admin/modules/page.tsx` |
| ADM-02 | Question editor shows `explanation` field | Unknown | Verify editable in admin form | ⚠️ Unknown | `app/admin/questions/page.tsx` |
| ADM-03 | AI question gen includes explanations | Unknown | Verify generate_questions Edge Function outputs explanation | ⚠️ Unknown | `supabase/functions/generate_questions/` |
| ADM-04 | Admin flashcards page aligns with new SR model | Basic flashcard management | May need updates | ⚠️ Unknown | `app/admin/flashcards/page.tsx` |

---

## 4. Infrastructure Requirements

| ID | Requirement | Current State | Gap | Status |
|----|------------|--------------|-----|--------|
| INFRA-01 | Migration 033 (Tanya Gaspol tables) | Doesn't exist | Create and push | ❌ Missing |
| INFRA-02 | Migration 034 (Flashcard SR table) | Doesn't exist | Create and push | ❌ Missing |
| INFRA-03 | New RLS policies for v3 tables | N/A | Define in migrations | ❌ Missing |

---

## 5. Summary Counts

| Category | ✅ Done | 🟡 Partial | ❌ Missing | ⚠️ Unknown | Total |
|----------|---------|-----------|-----------|------------|-------|
| Features (F-xxx) | 0 | 5 | 22 | 2 | 29 |
| Bugs (B-xxx) | 0 | 0 | 5 | 0 | 5 |
| Admin verifications | 0 | 0 | 0 | 4 | 4 |
| Infrastructure | 0 | 0 | 3 | 0 | 3 |
| **Total** | **0** | **5** | **30** | **6** | **41** |
