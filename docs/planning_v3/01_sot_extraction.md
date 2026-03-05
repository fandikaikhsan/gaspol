# 01 — SoT Extraction (V3 Blueprint + Design Spec)

**Sources:**
- `PROJECT_BLUEPRINT_v3.md` (SoT — v3.0, 2026-03-05)
- `DESIGN.v2.md` (Design system — v2, still canonical; v3 references it)
- `docs/planning/06_blueprint_v3_delta.md` (v2→v3 delta mapping)

---

## 1. New Features (v3 additions)

### F-001: Drill Page Restructure
**Blueprint §5.5 | Priority: P1**

Requirements:
- Single `/drill` route replaces old `/drill` + `/drill/drills` + `/drill/modules` + `/drill/mock` + `/drill/review` split
- Two-tab layout: **Topic-Based Modules** (level-5 skill modules) + **Mixed Drills** (level-3 topic modules)
- Mandatory plan tasks pinned at top of page (above tabs)
- Topic-Based tab: modules grouped by level-2, with level-3 accordion expansion
- Mixed Drills tab: level-3 modules grouped by level-2
- Module card shows: skill name, level-4 badge, module number, question count, estimated time, status (✓ completed, ⚠️ task, none)
- Filter: All / Required Tasks / Completed (hardcoded labels, not i18n keys)
- Taxonomy filter: Level-3, Level-4, Level-5 dropdowns
- Search: text search by module name
- Click incomplete module → QuestionRunner (admin-defined question order, not random)
- Click completed module → Module Result page
- Retry from result page → resets module_completions and re-enters QuestionRunner

### F-002: Module Result Page Improvements
**Blueprint §5.1 | Priority: P1**

Requirements:
- After completing a module: show Module Result page with:
  - Pass/fail status (70% threshold) — already implemented
  - Score percentage (e.g., "85% — Lulus!")
  - **"Lihat Pembahasan" button** → navigates to Pembahasan page (NEW)
  - **"Coba Lagi" (Retry) button** → resets module completion, re-enters QuestionRunner
  - **"Kembali ke Drill" button** → back to drill listing
- Retry resets `module_completions` record for that user+module

### F-003: Pembahasan (Answer Review) Page
**Blueprint §5.7 | Priority: P1 (NEW section)**

Requirements:
- Route: `/drill/pembahasan?moduleId=<id>` (or similar)
- Shows ALL questions in module order (not just incorrect ones)
- Per question: question text, user's answer (highlighted red if wrong), correct answer (highlighted green), explanation text (from `questions.explanation`)
- Material card link: if question's level-5 skill has a published material_card, show "Lihat Materi: [Skill Name]" button → navigates to `/review/[skillId]`
- If no published material card exists for the skill, hide the button
- Supports KaTeX math rendering in question text and explanation
- No new DB tables needed; requires fetching: module questions, user attempts, material_card existence by skill_id

### F-004: Material Card Drill & Navigation Buttons
**Blueprint §5.2 | Priority: P1**

Requirements:
- Material Card detail page (`/review/[skillId]`) gets two action buttons at the top:
  1. **"Latihan Skill Ini" (Drill This Skill)** — context-aware:
     - From Review page: navigates to Drill page with filter set to this level-5 skill
     - From Pembahasan page: button label changes to "Kembali ke Pembahasan" and navigates back
  2. **"Tanya Gaspol"** — opens AI chat modal (F-005)
- Context detection via URL search params (e.g., `?from=pembahasan&moduleId=xxx`)

### F-005: Tanya Gaspol AI Chat
**Blueprint §5.8 | Priority: P1 (NEW section)**

Requirements:
- **UI:** Modal chat overlay triggered from Material Card detail page
- **Token quota:** 100 tokens per user, 5 tokens per question, universal across skills
- **Preset questions:** 3 tappable chips with preset Indonesian prompts
- **Chat persistence:** Messages stored per user + per level-5 skill, visible on revisit
- **AI model:** Uses model from `ai_settings` table (admin-configured)
- **Greeting:** Random template with Gaspol character personality
- **Quota exhaustion:** Sad state with disabled input, "Kuota kamu sudah habis" message
- **AI prompt:** System prompt in Bahasa Indonesia, scoped to material card content (core_idea, key_facts, common_mistakes), max 300 word responses
- **New DB tables:**
  - `tanya_gaspol_chats` (user_id, skill_id, role, message, tokens_used)
  - `tanya_gaspol_quota` (user_id, total_tokens=100, used_tokens, remaining_tokens GENERATED)
- **New API endpoint:** `POST /api/tanya-gaspol`
  - Input: skill_id, message, skill_name, material_context
  - Output: reply, tokens_used, remaining_tokens
- **RLS:** Users own chats; users read own quota; service role updates quota

### F-006: Flashcard Spaced Repetition Revamp
**Blueprint §5.9 | Priority: P1 (NEW section)**

Requirements:
- **Gating:** Flashcards locked until baseline complete. Locked UI shows "Flashcards unlock after Baseline" with CTA to Plan page.
- **Mastery stacks UI:** Route `/review/flashcards` → 2×2 grid of stacks (Forgot / Hard / Good / Easy)
  - Each stack: label, due count, total count, status text
  - Stack visual: empty deck / 3-layer / 5-layer based on count
  - Tap stack → filtered review session
  - "Review All Due" CTA → all due cards
- **Review session UX:**
  - Card front → "Show Answer" → card back → 4 buttons (Forgot / Hard / Good / Easy)
  - Animation: card flies into selected stack
  - Buttons must fit within page width (fix B-005)
  - Labels hardcoded (not i18n keys — fix B-004)
- **SM-2 scheduling logic:**
  - Forgot: reps=0, interval=0, ease-=0.2, due=now+10min
  - Hard: reps++, interval*=1.2, ease-=0.15, due=now+interval
  - Good: reps++, interval=(1,3,interval*ease), due=now+interval
  - Easy: reps++, interval*=(ease+0.3), ease+=0.15, due=now+interval
- **New DB table:** `flashcard_user_state` (user_id, skill_id, ease_factor, interval_days, reps, due_at, mastery_bucket, total_reviews, last_reviewed_at)
- **New API endpoint:** `POST /api/flashcard-review`
  - Input: skill_id, response (forgot/hard/good/easy)
  - Output: updated state
- **Initialization:** After baseline completion, create flashcard_user_state records for ALL level-5 skills (forgot bucket, due now)
- **Content source:** Material cards (front=skill name, back=core_idea + key_facts)

---

## 2. Bug Fixes Required (from v3 §13)

### B-001: Drill Route Redundancy (P2)
- Remove: `/drill/drills/`, `/drill/drills/practice/`, `/drill/modules/`, `/drill/mock/`, `/drill/review/`
- Keep: `/drill/page.tsx` (restructured), `/drill/drill/[taskId]/` (QuestionRunner)
- Add: `/drill/pembahasan/` (new)
- Addressed by F-001 drill restructure

### B-002: Filter Labels Show i18n Keys (P1)
- `tc("filter.all")` → hardcode "All" / fix i18n resolution
- `tc("filter.required")` → "Required Tasks"
- `tc("filter.completed")` → "Completed"
- Files: `app/(student)/drill/page.tsx` ~L227, `lib/i18n/`
- Addressed by F-001 drill restructure

### B-003: Answer Check Always Returns Wrong / 0 Points (P0)
- Submit-attempt may fail silently in certain contexts
- Likely cause: constraint violation, context_id format, is_active filter, or data type mismatch
- Fix: Add detailed error logging, verify constraints match data
- Files: `app/api/submit-attempt/route.ts` ~L196-230

### B-004: Flashcard Labels Show i18n Keys (P1)
- `t("flashcards.cardOf")` etc. → hardcode labels
- Files: `components/review/FlashcardStack.tsx`
- Addressed by F-006 flashcard revamp

### B-005: Flashcard Buttons Overflow (P2)
- Buttons extend beyond viewport on mobile
- Fix: `flex flex-row gap-2 w-full` with `flex-1` per button
- Files: `components/review/FlashcardStack.tsx` ~L128-145
- Addressed by F-006 flashcard revamp

---

## 3. Behavior Changes / Clarifications (v3)

| Change | Blueprint Section | Impact |
|--------|------------------|--------|
| Drill page is single `/drill` route | §5.5 | Remove 5 sub-routes |
| Module cards show status indicators (✓, ⚠️, none) | §5.5 | UI change |
| Questions in drill modules follow admin-defined order (not random) | §5.5 | QuestionRunner change |
| Retry resets module_completions | §5.1 | API/DB change |
| Material Card CTA is context-aware | §5.2 | UI logic |
| Flashcard buttons drive SM-2 scheduling | §5.9 | Full backend change |
| `package_days` auto-calculated (no longer CHECK constraint) | §4.2 | DB schema clarification (already done in v2) |
| Question `explanation` field required for pembahasan | §5.7 | Admin pipeline check |
| AI model for Tanya Gaspol from `ai_settings` | §5.8 | Config reuse |

---

## 4. Data Model Additions (v3)

### New Tables

| Table | Migration | Feature | Fields Summary |
|-------|-----------|---------|---------------|
| `tanya_gaspol_chats` | 033 | F-005 | id, user_id, skill_id, role, message, tokens_used, created_at |
| `tanya_gaspol_quota` | 033 | F-005 | user_id (PK), total_tokens=100, used_tokens, remaining_tokens (GENERATED), updated_at |
| `flashcard_user_state` | 034 | F-006 | id, user_id, skill_id, ease_factor, interval_days, reps, due_at, mastery_bucket, total_reviews, last_reviewed_at |

### Existing Table Modifications

None required. Existing schema supports v3 features:
- `questions.explanation` already exists (TEXT, nullable)
- `modules.module_type` already has `drill_focus` and `drill_mixed` values
- `ai_settings` already has provider/model config
- `material_cards` already has skill_id, core_idea, key_facts, common_mistakes, examples

---

## 5. API Additions (v3)

| Endpoint | Method | Feature | Auth |
|----------|--------|---------|------|
| `/api/tanya-gaspol` | POST | F-005 | User |
| `/api/flashcard-review` | POST | F-006 | User |

---

## 6. Component Additions (v3)

| Component | Feature | Purpose |
|-----------|---------|---------|
| `components/review/TanyaGaspolChat.tsx` | F-005 | Chat modal with preset Qs, history, quota |
| `components/review/MasteryStacks.tsx` | F-006 | 2×2 grid of flashcard mastery stacks |
| `components/drill/PembahasanView.tsx` | F-003 | Question review with explanations |
| `components/drill/MandatoryTasks.tsx` | F-001 | Pinned mandatory task cards |
| `components/drill/ModuleAccordion.tsx` | F-001 | Accordion grouping for taxonomy levels |

---

## 7. Page Changes Summary (v3)

### Modified Pages
| Page | Changes |
|------|---------|
| `app/(student)/drill/page.tsx` | Full restructure (F-001, B-001, B-002) |
| `app/(student)/review/[skillId]/page.tsx` | Add drill + Tanya Gaspol buttons (F-004, F-005) |
| `app/(student)/review/flashcards/page.tsx` | Full restructure for mastery stacks (F-006, B-004, B-005) |
| `components/review/FlashcardStack.tsx` | Fix i18n, overflow; integrate SM-2 (F-006, B-004, B-005) |
| `components/assessment/QuestionRunner.tsx` | Add pembahasan nav, retry flow (F-002) |

### New Pages
| Page | Feature |
|------|---------|
| `app/(student)/drill/pembahasan/page.tsx` | F-003 Pembahasan |

### Removed Pages
| Page | Reason |
|------|--------|
| `app/(student)/drill/drills/page.tsx` | B-001 redundant |
| `app/(student)/drill/drills/practice/page.tsx` | B-001 redundant |
| `app/(student)/drill/modules/page.tsx` | B-001 redundant |
| `app/(student)/drill/mock/page.tsx` | B-001 redundant |
| `app/(student)/drill/review/page.tsx` | B-001 redundant |
