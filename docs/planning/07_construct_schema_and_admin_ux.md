# Construct Schema Alignment and Admin UX Plan

**Status:** Plan (to be executed)  
**Last Updated:** 2026-03-13

---

## Execution Plan Overview

| Phase | Scope | Dependencies | Est. effort |
|-------|-------|--------------|-------------|
| **Phase 1** | Schema & import foundation | None | 1–2 days |
| **Phase 2** | Exam admin UX | Phase 1 | 1 day |
| **Phase 3** | Taxonomy admin UX | Phase 1 | 1–2 days |
| **Phase 4** | Analytics gate | None | 0.5 day |
| **Phase 5** | Import JSON examples | None | 1 day |

**Recommended order:** Phase 1 → Phase 2 + Phase 3 in parallel → Phase 4 → Phase 5 (or Phase 5 in parallel with 2/3).

---

## Phase 1: Schema & Import Foundation (Priority: High)

**Goal:** Align schema and ensure import-exam populates constructs correctly.

| # | Task | Deliverable | Spec ref |
|---|------|-------------|----------|
| 1.1 | Add `construct_id` FK to `exam_constructs` | New migration | §1 |
| 1.2 | Update `apply_constructs_from_research` | Set `construct_id = v_code` on insert | §1 |
| 1.3 | Backfill existing exam_constructs | Migration or script | §1 |
| 1.4 | Update import-exam: populate `exams.construct_profile` | Route handler changes | §2 |
| 1.5 | Update import-exam: call `apply_research_to_taxonomy` | Route handler | §2 |
| 1.6 | Update import-exam: call `apply_constructs_from_research` | Route handler | §2 |

---

## Phase 2: Exam Admin UX (Priority: High)

**Goal:** Allow admins to drill into exam details (research, constructs, structure).

| # | Task | Deliverable | Spec ref |
|---|------|-------------|----------|
| 2.1 | Make exam cards clickable (or add View Details) | UI change | §3 |
| 2.2 | Create exam detail view (Dialog or `/admin/exams/[id]`) | New page/component | §3 |
| 2.3 | Display research summary, structure metadata, constructs, content areas | Detail view content | §3 |

---

## Phase 3: Taxonomy Admin UX (Priority: Medium)

**Goal:** Support construct weights in taxonomy nodes and optional AI suggestions.

| # | Task | Deliverable | Spec ref |
|---|------|-------------|----------|
| 3.1 | Add validation: `default_construct_weights` keys exist in `constructs(id)` | Schema/API validation | §4 |
| 3.2 | Extend add/edit dialog: Construct Weights, Expected Time (sec) | Taxonomy UI | §4 |
| 3.3 | Load constructs from DB, persist in insert/update | API + UI | §4 |
| 3.4 | Show badge on node row when weights are set | Taxonomy list UI | §4 |
| 3.5 | Add "Suggest Construct Weights" in edit dialog (AI) | New API or extend suggest-taxonomy-node | §4 |

---

## Phase 4: Analytics Gate (Priority: High)

**Goal:** Prevent analytics use until baseline is complete.

| # | Task | Deliverable | Spec ref |
|---|------|-------------|----------|
| 4.1 | Fetch `user_state.current_phase` on analytics load | Page logic | §5 |
| 4.2 | If not BASELINE_COMPLETE: show locked state + CTA | UI | §5 |
| 4.3 | Only allow snapshot load when baseline complete | API or page guard | §5 |

---

## Phase 5: Import JSON Examples (Priority: Medium)

**Goal:** Help admins understand expected JSON structure via templates.

| # | Task | Deliverable | Spec ref |
|---|------|-------------|----------|
| 5.1 | Create `ImportJsonExampleBlock` shared component | Component | §6 |
| 5.2 | Add minimal templates in `lib/import/templates/` | 4 JSON files | §6 |
| 5.3 | Add example block to exam import dialog | exams/page.tsx | §6 |
| 5.4 | Add example block to taxonomy import dialog | taxonomy/page.tsx | §6 |
| 5.5 | Add example block to questions import dialog | questions/page.tsx | §6 |
| 5.6 | Add example block to campus import dialog | campus/page.tsx | §6 |

---

## Phase 6: Verification (Post-implementation)

| # | Task |
|---|------|
| 6.1 | Verify baseline result flow (no change expected) |
| 6.2 | Verify analytics snapshot reads `user_construct_state` correctly with gate |
| 6.3 | Optional: simplify fallback for empty constructs in analytics |

---

## Detailed Specifications (Reference)

### §1. Schema: exam_constructs FK to constructs

**Current state:** exam_constructs has `exam_id` FK to exams. The `constructs` table has C.ATTENTION, C.SPEED, etc. as `id` values.

**Changes:**
- Add `construct_id TEXT REFERENCES constructs(id)` to `exam_constructs`
- Update `apply_constructs_from_research` to set `construct_id = v_code` when inserting
- Backfill existing exam_constructs: `UPDATE exam_constructs SET construct_id = code WHERE construct_id IS NULL`

---

### §2. Import-exam: Populate exams.construct_profile and exam_constructs

**Current state:** import-exam stores `construct_profile` only inside `structure_metadata`. It never populates `exams.construct_profile` or calls `apply_constructs_from_research`.

**Changes:**
- After insert, if `construct_profile` exists in parsed data:
  - Update the new exam: `exams.construct_profile = construct_profile`
  - Call `apply_research_to_taxonomy(exam_id)` to fill taxonomy_nodes
  - Call `apply_constructs_from_research(exam_id)` to fill exam_constructs

---

### §3. Exam Admin Page: Clickable Cards and Detail View

**Current state:** admin/exams/page.tsx renders exam cards with inline summary. No drill-down for constructs or full research.

**Changes:**
- Make each exam Card clickable (or add "View Details" button)
- On click, open Dialog or navigate to `/admin/exams/[id]` showing:
  - Research summary (full text)
  - Structure metadata (formatted)
  - Constructs from `exam_constructs`
  - Content areas and error patterns if present

---

### §4. Taxonomy: default_construct_weights FK Alignment and Admin UI

**Schema alignment:**
- Add validation that JSONB keys in `taxonomy_nodes.default_construct_weights` exist in `constructs(id)`

**Taxonomy admin UI:**
- Extend add/edit dialog with "Construct Weights" and "Expected Time (sec)"
- Load constructs from DB, persist in insert/update
- Show badge on node row when weights are set

**AI generation:**
- Add "Suggest Construct Weights" in taxonomy node edit dialog
- Use exam research to suggest weights

---

### §5. Analytics Page: Gate Until Baseline Complete

**Changes:**
- Fetch `user_state.current_phase` on load
- If not BASELINE_COMPLETE or later: show locked state, CTA to baseline
- Only allow snapshot load when baseline complete

---

### §6. Import JSON: Example / Template Blocks with Copy

**Current state:** Each Import JSON dialog (exams, taxonomy, questions, campus) has a textarea and placeholder only. Admins may not know the expected JSON structure.

**Changes:** Add an **example block** above the textarea in each import dialog. When admin opens "Import JSON":

- A collapsible or always-visible **Example** section with a minimal valid JSON template
- A **Copy** button that copies the example to clipboard (and optionally into the textarea)
- Template per import type:

| Import | Template source | Example structure |
|--------|-----------------|-------------------|
| **Exam** | docs/generated/exam.json (minimal) | `{ "exam": { "name": "...", "exam_type": "...", "year": 2026 }, "research_summary": "...", "structure": {...}, "construct_profile": {...} }` |
| **Taxonomy** | docs/generated/taxonomy.json (1 subject) | `{ "exam_id": "uuid", "subjects": [{ "name": "...", "code": "...", "level": 1, "subtests": [...] }] }` |
| **Questions** | admin-question-import.features.md | `{ "skill_code": "...", "exam_id": "uuid", "questions": [{ "question_type": "MCQ5", "stimulus": {...}, "answer": {...}, "explanation": {...} }] }` |
| **Campus** | campus-import-schema.ts | `{ "data": [{ "university_id": 1, "university_name": "...", "program_id": 1, "program_name": "...", "score": 400 }], "year": 2026, "verified": false }` |

**Implementation:**
- Create shared component `ImportJsonExampleBlock` with:
  - Label "Example template"
  - Pre-formatted JSON block (read-only, `font-mono`, scrollable if long)
  - Button "Copy example" using `navigator.clipboard.writeText()`
  - Optional: "Use as input" that pastes into the textarea
- Store minimal templates in `lib/import/templates/` (e.g. `exam-template.json`, `taxonomy-template.json`, `question-template.json`, `campus-template.json`) or as constants
- Add to each import dialog: [exams/page.tsx](app/admin/exams/page.tsx), [taxonomy/page.tsx](app/admin/taxonomy/page.tsx), [questions/page.tsx](app/admin/questions/page.tsx), [campus/page.tsx](app/admin/campus/page.tsx)

**Example minimal templates (for copy):**

```json
// exam-template.json (minimal)
{
  "exam": {
    "name": "UTBK-SNBT 2026",
    "exam_type": "UTBK-SNBT",
    "year": 2026
  },
  "research_summary": "Brief description of the exam...",
  "structure": { "sections": [] },
  "construct_profile": {
    "TPS-PU": {
      "constructs": {
        "C.ATTENTION": 0.2,
        "C.SPEED": 0.2,
        "C.REASONING": 0.2,
        "C.COMPUTATION": 0.2,
        "C.READING": 0.2
      },
      "time_expectations": { "average": 120 }
    }
  }
}
```

```json
// taxonomy-template.json (1 subject, 1 subtest)
{
  "exam_id": "uuid-of-exam",
  "subjects": [{
    "name": "Tes Potensi Skolastik",
    "code": "TPS",
    "description": "Mengukur kemampuan penalaran.",
    "level": 1,
    "subtests": [{
      "name": "Penalaran Umum",
      "code": "TPS-PU",
      "description": "Mengukur penalaran induktif, deduktif.",
      "level": 2
    }]
  }]
}
```

```json
// question-template.json (1 MCQ5)
{
  "skill_code": "TPS-PU-LOG-01-A",
  "exam_id": "uuid-of-exam",
  "questions": [{
    "question_type": "MCQ5",
    "difficulty": "medium",
    "cognitive_level": "L2",
    "stimulus": { "blocks": [{ "type": "text", "content": "Question text here..." }] },
    "answer": {
      "interaction_type": "single_choice",
      "options": [
        { "key": "A", "content": { "blocks": [{ "type": "text", "content": "Option A" }] }, "is_correct": false },
        { "key": "B", "content": { "blocks": [{ "type": "text", "content": "Option B" }] }, "is_correct": true }
      ],
      "correct_answer": "B"
    },
    "explanation": { "blocks": [{ "type": "text", "content": "Explanation..." }] },
    "time_estimate_seconds": 60,
    "construct_weights": {
      "C.ATTENTION": 0.2,
      "C.SPEED": 0.2,
      "C.REASONING": 0.2,
      "C.COMPUTATION": 0.2,
      "C.READING": 0.2
    }
  }]
}
```

```json
// campus-template.json (1 record)
{
  "data": [{
    "university_id": 1,
    "university_name": "UNIVERSITAS CONTOH",
    "program_id": 1001,
    "program_name": "MATEMATIKA",
    "type": "Sarjana",
    "score": 400,
    "interest": 500,
    "capacity": 50,
    "acceptance_rate": 10
  }],
  "year": 2026,
  "verified": false
}
```

---

### §7. Baseline Result and Analytics Snapshot Flow (Verification)

**Baseline result:** Already reads `user_construct_state` and writes to `module_completions.construct_profile`. No change.

**Analytics snapshot:** Reads `user_construct_state`. With analytics gated, users will have state. Optional: simplify fallback for empty constructs.

---

## Files to Modify (by Phase)

| Phase | Area | Files |
|-------|------|-------|
| 1 | Schema | New migration |
| 1 | Import | `app/api/admin/import-exam/route.ts` |
| 2 | Exams UI | `app/admin/exams/page.tsx`, new `app/admin/exams/[id]/page.tsx` or Dialog |
| 3 | Taxonomy UI | `app/admin/taxonomy/page.tsx` |
| 3 | Taxonomy AI | New API or extend `suggest-taxonomy-node` |
| 4 | Analytics gate | `app/(student)/analytics/page.tsx` |
| 5 | Import templates | `lib/import/templates/*.json`, `components/admin/ImportJsonExampleBlock.tsx`, exams/taxonomy/questions/campus pages |
