# Blueprint v3 Delta Mapping

**Source:** PROJECT_BLUEPRINT_v2.md → PROJECT_BLUEPRINT_v3.md  
**Generated:** 2026-03-05

---

## 1. Feature Tags Extracted → v3 Sections

| Tag                                                                                    | Source (v2 location)                  | Mapped to (v3 section)                      | Implementation Status                                                                                                  |
| -------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `@@ Feature` — Drill page restructure (two-tab, accordion, filtering)                  | §4.3 Drill Page text block            | §5.5 Drill System (Restructured in v3)      | **Not implemented** — current drill page uses flat module list; needs full rebuild                                     |
| `@@ Feature` — Module Result page (pass/fail + pembahasan + retry)                     | §4.3 Drill Page result flow           | §5.1 Assessment Engine (Module Result Page) | **Partially implemented** — result page exists at `/baseline/[moduleId]/result`; needs pembahasan button + retry logic |
| `@@ Feature` — Pembahasan page (answer review with explanations + material card links) | §4.3 Drill Page pembahasan block      | §5.7 Pembahasan Page (NEW)                  | **Not implemented** — no standalone pembahasan page exists                                                             |
| `@@ Feature` — Material Card drill button + "Back to Pembahasan" context switch        | §4.3 Review Page material card text   | §5.2 Material Card System (action buttons)  | **Not implemented** — material card detail exists but lacks drill button and Tanya Gaspol button                       |
| `@@ Feature` — Tanya Gaspol AI chat (modal, preset Qs, token quota, chat history)      | §4.3 Review Page "Tanya Gaspol" block | §5.8 Tanya Gaspol AI Chat (NEW)             | **Not implemented** — no chat feature, no DB tables, no API endpoint                                                   |
| `@@ Feature` — Flashcard spaced repetition revamp (SM-2, mastery stacks, scheduling)   | §4.3 Review Page flashcard block      | §5.9 Flashcard SR System (NEW)              | **Not implemented** — current flashcards are basic swipe; no SR schema exists in DB                                    |

## 2. Bug Tags Extracted → v3 Section

| Tag                                                                 | Source (v2 location) | Mapped to (v3 section) | Confirmed in Repo?                                                                                           |
| ------------------------------------------------------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@@ Bug` — Drill route redundancy (`/drill` + `/drill/drills`)      | §4.3 Drill Page      | §13 B-001              | **YES** — `/drill/drills/`, `/drill/modules/`, `/drill/mock/`, `/drill/review/` all exist as separate pages  |
| `@@ Bug` — Filter labels show i18n keys (`filter.all`, etc.)        | §4.3 Drill Page      | §13 B-002              | **YES** — `tc("filter.all", ...)` calls in `app/(student)/drill/page.tsx` ~L227                              |
| `@@ Bug` — Answer check broken (0 points, "Failed to save attempt") | §4.3 Drill Page      | §13 B-003              | **YES** — error handling in `app/api/submit-attempt/route.ts`; the attempt insert likely fails silently      |
| `@@ Bug` — Flashcard i18n keys showing (`flashcards.cardOf`, etc.)  | §4.3 Review Page     | §13 B-004              | **YES** — `t('flashcards.forgot')`, `t('flashcards.cardOf')`, etc. in `components/review/FlashcardStack.tsx` |
| `@@ Bug` — Flashcard buttons overflow page                          | §4.3 Review Page     | §13 B-005              | **YES** — button container styling in `FlashcardStack.tsx` lacks proper flex constraints                     |

## 3. Migration / Schema Checklist

### Existing Migrations (no changes needed)

| Migration          | Status    | Notes                                                                                             |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| 001 initial_schema | ✅ Exists | Core tables: profiles, user_state, taxonomy_nodes, questions, modules, baseline_modules, attempts |
| 026 ai_settings    | ✅ Exists | ai_settings table (provider, api_key, model, is_active) — used by Tanya Gaspol                    |
| 030 point_coverage | ✅ Exists | difficulty_level, point_value on questions; total_points, is_covered on user_skill_state          |
| 031 material_cards | ✅ Exists | material_cards table + campus_scores table                                                        |
| 032 rls_policies   | ✅ Exists | RLS for material_cards and campus_scores                                                          |

### New Migrations Required

| Migration          | Tables                                     | Feature                           | Priority |
| ------------------ | ------------------------------------------ | --------------------------------- | -------- |
| 033 (tanya_gaspol) | `tanya_gaspol_chats`, `tanya_gaspol_quota` | F-005 Tanya Gaspol AI Chat        | P1       |
| 034 (flashcard_sr) | `flashcard_user_state`                     | F-006 Flashcard Spaced Repetition | P1       |

### Schema Additions Detail

```sql
-- Migration 033: Tanya Gaspol
CREATE TABLE tanya_gaspol_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tanya_gaspol_user_skill ON tanya_gaspol_chats(user_id, skill_id);

CREATE TABLE tanya_gaspol_quota (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_tokens INTEGER NOT NULL DEFAULT 100,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  remaining_tokens INTEGER GENERATED ALWAYS AS (total_tokens - used_tokens) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE tanya_gaspol_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_chats" ON tanya_gaspol_chats FOR ALL USING (user_id = auth.uid());
ALTER TABLE tanya_gaspol_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_quota" ON tanya_gaspol_quota FOR SELECT USING (user_id = auth.uid());
```

```sql
-- Migration 034: Flashcard Spaced Repetition
CREATE TABLE flashcard_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mastery_bucket TEXT NOT NULL DEFAULT 'forgot'
    CHECK (mastery_bucket IN ('forgot', 'hard', 'good', 'easy')),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);
CREATE INDEX idx_flashcard_state_due ON flashcard_user_state(user_id, due_at);
CREATE INDEX idx_flashcard_state_bucket ON flashcard_user_state(user_id, mastery_bucket);

-- RLS
ALTER TABLE flashcard_user_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_flashcard_state" ON flashcard_user_state FOR ALL USING (user_id = auth.uid());
```

## 4. API / Edge Function Checklist

### Existing (no changes needed)

| Endpoint / Function                   | Verified                              |
| ------------------------------------- | ------------------------------------- |
| `POST /api/submit-attempt`            | ✅ Exists (578 lines) — has bug B-003 |
| `POST /api/finalize-baseline-module`  | ✅ Exists                             |
| `POST /api/generate-plan`             | ✅ Exists                             |
| `POST /api/generate-snapshot`         | ✅ Exists                             |
| `POST /api/create-recycle-checkpoint` | ✅ Exists                             |
| Edge: `generate_questions`            | ✅ Exists                             |
| Edge: `generate_material_cards`       | ✅ Exists                             |
| Edge: `generate_flashcards`           | ✅ Exists                             |
| Edge: `research_exam`                 | ✅ Exists                             |

### New Required

| Endpoint                     | Feature | Method | Notes                                                                                         |
| ---------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------- |
| `POST /api/tanya-gaspol`     | F-005   | POST   | AI chat — reads ai_settings for model config, inserts to tanya_gaspol_chats, decrements quota |
| `POST /api/flashcard-review` | F-006   | POST   | Updates flashcard_user_state with SM-2 calculation                                            |

## 5. Student Page Checklist

### Needs Modification

| Page                                       | Changes                                                                                                                   | Feature             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `app/(student)/drill/page.tsx`             | Full restructure: two-tab layout, accordion grouping, mandatory tasks pinned, advanced filtering, search, fix i18n labels | F-001, B-001, B-002 |
| `app/(student)/review/[skillId]/page.tsx`  | Add "Latihan Skill Ini" + "Tanya Gaspol" buttons, context-aware label logic                                               | F-004, F-005        |
| `app/(student)/review/flashcards/page.tsx` | Full restructure: mastery stacks 2×2 grid, SM-2 scheduling, fix button overflow, fix i18n labels                          | F-006, B-004, B-005 |
| `components/review/FlashcardStack.tsx`     | Fix i18n keys, fix button overflow, integrate SM-2 state, mastery bucket sorting                                          | F-006, B-004, B-005 |

### Needs Creation

| Page                                      | Feature                                        |
| ----------------------------------------- | ---------------------------------------------- |
| `app/(student)/drill/pembahasan/page.tsx` | F-002, F-003 — Pembahasan (answer review) page |
| `components/review/TanyaGaspolChat.tsx`   | F-005 — Chat modal component                   |

### Needs Removal / Redirect

| Page                                           | Reason                                    |
| ---------------------------------------------- | ----------------------------------------- |
| `app/(student)/drill/drills/page.tsx`          | B-001 — redundant with unified drill page |
| `app/(student)/drill/drills/practice/page.tsx` | B-001 — redundant                         |
| `app/(student)/drill/modules/page.tsx`         | B-001 — redundant                         |
| `app/(student)/drill/mock/page.tsx`            | B-001 — integrate as filter on drill page |
| `app/(student)/drill/review/page.tsx`          | B-001 — redundant                         |

## 6. Admin Page Checklist

### Needs Verification

| Page                            | Check                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `app/admin/modules/page.tsx`    | Verify `drill_focus` type is fully supported (per-level-5 targeting) — `drill_mixed` confirmed at L81 |
| `app/admin/questions/page.tsx`  | Verify `explanation` field is editable in the question editor form                                    |
| `app/admin/flashcards/page.tsx` | May need updates to align with new SR model (content sourced from material_cards)                     |

## 7. Component Checklist

### Needs Modification

| Component                                  | Changes                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `components/assessment/QuestionRunner.tsx` | Add pass/fail result handling, pembahasan navigation button, retry flow |
| `components/review/FlashcardStack.tsx`     | Fix i18n (B-004), fix overflow (B-005), integrate SM-2 state updates    |

### Needs Creation

| Component                               | Purpose                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `components/review/TanyaGaspolChat.tsx` | Chat modal with preset questions, message history, quota display |
| `components/review/MasteryStacks.tsx`   | 2×2 grid of flashcard mastery stacks with due counts             |
| `components/drill/PembahasanView.tsx`   | Question review with answers, explanations, material card links  |
| `components/drill/MandatoryTasks.tsx`   | Pinned mandatory task cards at top of drill page                 |
| `components/drill/ModuleAccordion.tsx`  | Accordion grouping for topic-based modules                       |

## 8. Implementation Priority

### Phase 1: Critical Bug Fixes

| ID    | Task                                                   | Estimated Effort |
| ----- | ------------------------------------------------------ | ---------------- |
| B-003 | Fix answer check (0 points / "Failed to save attempt") | 2-4 hours        |
| B-002 | Fix drill filter i18n labels                           | 30 min           |
| B-004 | Fix flashcard i18n labels                              | 30 min           |
| B-005 | Fix flashcard button overflow                          | 30 min           |

### Phase 2: Drill Page Restructure

| ID    | Task                                                        | Estimated Effort |
| ----- | ----------------------------------------------------------- | ---------------- |
| F-001 | Drill page two-tab layout + accordions + filtering          | 2-3 days         |
| B-001 | Remove redundant drill routes                               | 1 hour           |
| F-002 | Module Result page improvements (pembahasan button + retry) | 4 hours          |
| F-003 | Pembahasan page                                             | 1-2 days         |

### Phase 3: Tanya Gaspol

| ID     | Task                                       | Estimated Effort |
| ------ | ------------------------------------------ | ---------------- |
| F-005a | Create migration 033 (tanya_gaspol tables) | 30 min           |
| F-005b | Create `/api/tanya-gaspol` endpoint        | 4 hours          |
| F-005c | Create TanyaGaspolChat component           | 1 day            |
| F-005d | Integrate into Material Card detail page   | 2 hours          |
| F-004  | Material Card drill/navigation buttons     | 2 hours          |

### Phase 4: Flashcard Revamp

| ID     | Task                                               | Estimated Effort |
| ------ | -------------------------------------------------- | ---------------- |
| F-006a | Create migration 034 (flashcard_user_state)        | 30 min           |
| F-006b | Create `/api/flashcard-review` endpoint            | 4 hours          |
| F-006c | SM-2 scheduling logic (lib function)               | 2 hours          |
| F-006d | MasteryStacks component (2×2 grid)                 | 4 hours          |
| F-006e | FlashcardStack refactor with SM-2 integration      | 1 day            |
| F-006f | Flashcard initialization after baseline completion | 2 hours          |
| F-006g | Baseline gating UI                                 | 1 hour           |

---

## 9. Cross-Reference: v2 Sections → v3 Sections

| v2 Section                | v3 Section                     | Change Type                                                              |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| §1 Executive Summary      | §1 Executive Summary           | Updated — added Tanya Gaspol, flashcard SR, pembahasan to value props    |
| §2 Business Context       | §2 Business Context            | Updated — added Tanya Gaspol and flashcards to gains/pains               |
| §3 Product Definition     | §3 Product Definition          | Updated — added pembahasan, Tanya Gaspol, flashcard to platform overview |
| §4.1-4.2 User Journeys    | §4.1-4.2 User Journeys         | Minor — added pembahasan link in plan active phase                       |
| §4.3 Navigation           | §4.3 Navigation                | Major — drill page description rewritten, review page updated            |
| §4.4 Admin Journey        | §4.4 Admin Journey             | Minor — added question explanation requirement note                      |
| §5.1 Assessment Engine    | §5.1 Assessment Engine         | Updated — Module Result page spec added                                  |
| §5.2 Material Cards       | §5.2 Material Card System      | Updated — action buttons spec added                                      |
| §5.3 Analytics            | §5.3 Analytics System          | Unchanged                                                                |
| §5.4 Timeline/Plan        | §5.4 Timeline/Plan System      | Unchanged                                                                |
| §5.5 Drill System         | §5.5 Drill System              | **Major rewrite** — two-tab layout, full spec                            |
| —                         | §5.7 Pembahasan Page           | **NEW**                                                                  |
| —                         | §5.8 Tanya Gaspol AI Chat      | **NEW**                                                                  |
| —                         | §5.9 Flashcard SR System       | **NEW**                                                                  |
| §5.6 Admin AI Operations  | §5.6 Admin AI Operations       | Unchanged                                                                |
| §6 Data Architecture      | §6 Data Architecture           | Updated — new tables added                                               |
| §7 Business Logic         | §7 Business Logic & Algorithms | Updated — SM-2 algorithm added §7.9                                      |
| §8 Technical Architecture | §8 Technical Architecture      | Updated — new API routes, file structure                                 |
| §9 Forking                | §9 Forking                     | Minor — added Tanya Gaspol and flashcards to "same" list                 |
| §10 AI Prompt             | §10 AI Code Generation Prompt  | Updated — includes v3 features                                           |
| §11 Appendix (Glossary)   | §11 Appendix                   | Updated — new terms added                                                |
| §12 Version History       | §12 Version History            | Updated — v3.0 entry added                                               |
| —                         | §13 Known Issues               | **NEW** — 5 bugs documented                                              |

---

**End of delta document.**
