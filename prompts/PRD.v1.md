YOU ARE A FULL PRODUCT TEAM:

- 30+ years Tech Lead
- UI/UX Product Designer
- Visual Designer
- Security Engineer
- Prompt Engineer

Build a mobile-first UTBK Last-Minute Prep Platform: assessment → analytics → plan → tasks → re-cycle assessment.

# ======================== 0) PRODUCT CONTEXT

This product targets UTBK users with limited time (7/14/21/30 days). Core differentiator:

1. Deep analytics (by subtest/topic/micro-skill + construct profile: Teliti/Attention, Speed, Reasoning/Analisis, Computation, Reading).
2. Two learning modes:
   - Locked-In Mode: drill mixed, drill focused, mock test, review
   - Taktis Mode: flashcards (weak-only) + quick swipe test (tinder-like)
3. Adaptive plan engine based on baseline assessment and ongoing telemetry.
4. Baseline assessment is CHUNKED into micro-modules 3–5 minutes each; partial analytics shown after each module; plan generation is gated until all baseline modules complete.
5. Re-cycle assessment unlocks only after user completes all required tasks in the current plan cycle; then targeted assessment updates analytics and generates next cycle.

AI should be used primarily for content ops (admin batch) and for summarizing insights (Tier-1 batch), NOT for per-question soft diagnosis by default (too costly). Use deterministic logic for scoring, planning, and most analytics.

========================

1. # STACK REQUIREMENTS

- Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + Auth + Storage) + Supabase Edge Functions (TypeScript)
- Charts: Recharts (or lightweight alternative)
- State: React Query (TanStack) or SWR
- Auth: Supabase Auth; roles: admin, student
- AI calls: ONLY from Edge Functions (server-side) to protect keys; store AI runs in DB.
- Mobile-first UI: assume 80%+ mobile traffic.

# ======================== 2) UX / USER JOURNEY SPEC (MUST IMPLEMENT)

2.1 Global App Tabs (Bottom Nav)

- Home: Today plan + readiness + highlights
- Locked-In: Drill (mixed/focused), Mock, Review
- Taktis: Flashcards (weak queue), Quick Swipe Test
- Analytics: Deep analytics dashboard

  2.2 State Machine (Global Phase)
  UserPhase =

- ONBOARDING
- BASELINE_ASSESSMENT_IN_PROGRESS
- PLAN_ACTIVE
- RECYCLE_UNLOCKED
- RECYCLE_ASSESSMENT_IN_PROGRESS

Transitions:

- ONBOARDING -> BASELINE_ASSESSMENT_IN_PROGRESS
- BASELINE_ASSESSMENT_IN_PROGRESS -> PLAN_ACTIVE only after ALL baseline modules DONE and user taps "Generate Plan"
- PLAN_ACTIVE -> RECYCLE_UNLOCKED when required tasks complete
- RECYCLE_UNLOCKED -> RECYCLE_ASSESSMENT_IN_PROGRESS when user starts checkpoint assessment
- RECYCLE_ASSESSMENT_IN_PROGRESS -> PLAN_ACTIVE after completion (new plan cycle generated)

  2.3 Baseline Assessment (Checkpoint 1) - Chunked Modules

- Baseline consists of N micro-modules (clusters), each 3–5 minutes (6–10 questions).
- User can do modules separately.
- After finishing ANY module: show Module Result + Partial Analytics based on completed modules only.
- "Generate My Plan" button DISABLED until all baseline modules DONE.
- After all done, enable "Generate My Plan" which triggers plan generation.

  2.4 Plan Cycle (3–7 Tasks)
  After plan generated:

- Show day i/Y, countdown H-X, readiness ring.
- Show 3–7 tasks (mix: drill mixed, drill focused, flashcards, mock, review).
- Each task has status: TODO/IN_PROGRESS/DONE/LOCKED and is_required boolean.
- Re-cycle assessment locked until all required tasks DONE.
- When complete: show CTA "Start Checkpoint Assessment".

  2.5 Re-cycle Assessment (Checkpoint 2+)

- Unlock only after required tasks completion.
- Assessment can be single or mini-modules.
- It is targeted: focus red-zone micro-skills + some control items.
- On completion: show delta analytics; generate next plan cycle.

# ======================== 3) UI SCREENS + COMPONENTS (MUST BUILD)

3.1 Screens

- /onboarding (package selection + time budget + optional target)
- /baseline (Assessment Hub)
- /baseline/[moduleId] (Assessment Runner)
- /baseline/[moduleId]/result (Module Result + Partial Analytics)
- /plan (Plan Dashboard: tasks list + progress + CTA gating)
- /locked-in (mode hub)
- /locked-in/drill/[taskId] (runner)
- /locked-in/mock/[taskId] (runner)
- /taktis (flashcards + swipe)
- /analytics (deep dashboard; partial label if baseline incomplete)
- /recycle (Recycle hub; locked/unlocked states)
- /recycle/[checkpointId] (runner)
- /recycle/[checkpointId]/result (delta + generate next cycle)

  3.2 Reusable Components

- ProgressHeader(title, subtitle, done, total)
- CountdownPill(daysLeft)
- ReadinessRing(value, delta)
- MiniRadarChart(data)
- RadarChartFull(data)
- ConstructBars(constructs[])
- StreakHeatmap(daysRange)
- ModuleCard(module)
- TaskCard(task)
- GatedCTAButton(enabled, label, reasonText)
- QuestionRunner(questionSet, onSubmitAttempt, onComplete)
- ResultSummaryCard(accuracy, avgTime, speedIndex)
- DeltaAnalyticsCard(beforeSnapshot, afterSnapshot)
- InsightCard(insights[]) // Tier-1 AI insights, clearly labeled "AI"

  3.3 UX Rules

- Mobile-first. One primary CTA per screen.
- Always show "Day i/Y" and H-X countdown on Home/Plan screens.
- Assessment runner minimal distraction.
- Partial analytics must display "Based on X/Y modules completed".

# ======================== 4) DATA MODEL CONCEPTS (CRITICAL)

We track:

- Taxonomy: subtest -> topic -> micro-skill (node_id)
- Constructs: teliti(attention), speed, reasoning, computation, reading
- Each micro-skill has default construct weights + expected time
- Each question has construct weights (inherits from micro-skill with optional override)
- Each option (distractor) can have option_tag (misconception/error clue) to allow rule-based diagnosis without AI.

AI is used to:

- build taxonomy, tag scheme
- generate items + explanations + flashcards
- auto-tag and QC
- batch session insights (Tier-1) and on-demand explanations (Tier-2)
  NOT per-question soft diagnosis by default.

# ======================== 5) SUPABASE DATABASE SCHEMA (SQL MIGRATION)

Create the following tables in Supabase (public schema). Use UUID PKs unless stable string IDs are required.
Also create enums where helpful.

--- ENUMS ---

- role_type: 'admin'|'student'
- question_status: 'draft'|'reviewed'|'published'|'retired'
- task_status: 'todo'|'in_progress'|'done'|'locked'
- task_type: 'drill_focus'|'drill_mixed'|'flashcards'|'mock'|'review'
- ai_job_type: 'taxonomy_builder'|'tag_scheme'|'item_gen'|'auto_tag'|'qc'|'module_compose'|'session_summary'|'explain_on_demand'
- ai_run_status: 'success'|'failed'
- phase_type: as user phases above

--- CORE TABLES ---
A) auth/profile/roles

- profiles: id (uuid, pk, = auth.users.id), display_name, role (role_type), created_at
  RLS: user can read/update own profile; admins can read all.

B) taxonomy

- taxonomy_versions: id (text pk e.g. 'UTBK26_v1'), exam, year, notes, created_at
- taxonomy_nodes: id (text pk e.g. 'UTBK26.TPS.PU.001'), taxonomy_version_id (fk), parent_id (text fk self), name, description, cognitive_level, typical_forms (jsonb), common_traps (jsonb), default_construct_weights (jsonb), expected_time_sec (int), created_at

C) constructs + tags

- constructs: id (text pk e.g. 'C.ATTENTION'), label, description
- tags: id (text pk e.g. 'ERR.MISREAD'), tag_type ('error'|'question'|'option'), name, definition, signals (jsonb nullable)
- option_tags: id (text pk), name, definition // (can merge into tags with tag_type='option')

D) questions (versioned)

- questions: id (text pk 'Q.UTBK26.000123'), taxonomy_node_id (fk), difficulty ('easy'|'medium'|'hard'), format ('mcq'|'tf'|'swipe'), status (question_status), construct_weights (jsonb), expected_time_sec (int), created_at, updated_at
- question_versions: id (uuid pk), question_id (fk), version (int), stem (text), options (jsonb), answer (jsonb), explanation (jsonb), flashcards (jsonb), hash (text), created_by (uuid fk profiles), created_at
- question_tag_map: question_id (fk), tag_id (fk), pk(question_id, tag_id)
- question_option_meta: question_id (fk), version (int), option_id (text), option_tag_id (text fk option_tags/tags), pk(question_id, version, option_id)

E) modules (learning content)

- modules: id (text pk 'M.UTBK26.00077'), title, mode ('topical'|'drill'|'mock'), estimated_time_min, status ('draft'|'published'), created_by (uuid), created_at
- module_items: module_id (fk), question_id (fk), order_index (int), pk(module_id, question_id)

F) baseline assessment structure

- baseline_checkpoints: id (text pk 'CP1'), taxonomy_version_id, title, created_at
- baseline_modules: id (text pk 'BM01'), checkpoint_id (fk), title, eta_min, question_count, order_index, created_at
- baseline_module_questions: baseline_module_id (fk), question_id (fk), order_index, pk(baseline_module_id, question_id)

G) user progress + attempts

- user_state: user_id (uuid pk fk profiles), phase (phase_type), package_days (int), time_budget_min (int), exam_date (date nullable), current_cycle_id (uuid nullable), created_at, updated_at
- attempts: id (uuid pk), user_id (fk), question_id (fk), module_id (text nullable), baseline_module_id (text nullable), checkpoint_id (text nullable), is_correct (bool), user_option (jsonb), time_spent_sec (int), confidence (smallint nullable), created_at
- attempt_error_tags: attempt_id (fk), tag_id (fk), source ('rule'|'ai'|'user_confirmed'), pk(attempt_id, tag_id)
- user_skill_state: user_id, taxonomy_node_id, mastery (float), speed_sec (float), stability (float), last_seen_at, pk(user_id, taxonomy_node_id)
- user_construct_state: user_id (pk), constructs (jsonb), updated_at // e.g. {C.ATTENTION:48,...}

H) analytics snapshots (for dashboard speed)

- analytics_snapshots: id (uuid pk), user_id (fk), scope ('partial_baseline'|'full_baseline'|'cycle_end'|'checkpoint'), coverage (jsonb), readiness (float), radar (jsonb), constructs (jsonb), top_weak_skills (jsonb), top_error_tags (jsonb), created_at

I) plan cycles + tasks

- plan_cycles: id (uuid pk), user_id (fk), cycle_index (int), day_index (int), total_days (int), status ('active'|'completed'), created_at
- plan_tasks: id (uuid pk), cycle_id (fk), type (task_type), title, minutes (int), status (task_status), is_required (bool), ref_type ('module'|'flashcards'|'mock'|'review'), ref_id (text), unlock_rule (jsonb nullable), order_index (int), created_at, updated_at

J) checkpoint (re-cycle)

- recycle_checkpoints: id (uuid pk), user_id, cycle_id, checkpoint_index (int), locked (bool), eta_min (int), structure ('single'|'mini_modules'), created_at
- recycle_checkpoint_questions: checkpoint_id (fk), question_id (fk), order_index, pk(checkpoint_id, question_id)

K) AI audit

- ai_runs: id (uuid pk), job_type (ai_job_type), prompt_version (text), model (text), input_json (jsonb), output_json (jsonb), tokens_in (int), tokens_out (int), cost_estimate (numeric nullable), status (ai_run_status), created_by (uuid nullable), created_at
- content_review_queue: id (uuid pk), item_type ('question'|'module'), ref_id (text), status ('pending'|'approved'|'rejected'), notes (text), reviewer_id (uuid), created_at, updated_at

--- INDEXES (RECOMMENDED) ---

- attempts(user_id, created_at)
- attempts(user_id, question_id)
- user_skill_state(user_id)
- plan_tasks(cycle_id, order_index)
- baseline_module_questions(baseline_module_id, order_index)

# ======================== 6) SECURITY (RLS) REQUIREMENTS (MUST IMPLEMENT)

- Use Supabase RLS on ALL tables.
- Roles:
  - student: can read published content; can read/write own attempts, own state, own plans, own snapshots.
  - admin: can CRUD taxonomy, tags, questions, modules, baseline definitions; can read analytics aggregate; can run content ops.

RLS rules (high level):

- profiles: user can read own; admin read all.
- taxonomy/tags/constructs: readable by all authenticated; writable only by admin.
- questions: students can read only status='published'; admin can read all.
- question_versions: students can read only if parent question is published AND latest version; admin all.
- modules/baseline defs: readable by students if published; writable by admin.
- attempts: students can insert/select only where user_id = auth.uid().
- plan_cycles/plan_tasks/recycle_checkpoints: students can select only own user_id.
- ai_runs: only admin can select/insert; or allow insertion from edge functions with service role only.

IMPORTANT:

- Never expose AI provider keys to client.
- All AI calls done in edge functions using secrets.
- Rate limit edge functions (basic).
- Log prompt_version + tokens in ai_runs.

# ======================== 7) EDGE FUNCTIONS (SERVER-SIDE)

Implement Supabase Edge Functions in TypeScript:

1. generate_plan
   Input: user_id
   Logic (deterministic):

- Verify baseline complete.
- Read latest analytics_snapshot full_baseline or compute.
- Create new plan_cycle with 3–7 tasks based on package_days & time_budget_min & weakest skills.
- Tasks refs:
  - drill_focus uses a module_id selected by micro-skill mix
  - drill_mixed uses prebuilt mixed module or generated module composition logic
  - flashcards uses micro-skill ids
  - mock uses mock module definition or question set
    Return: plan_cycle + tasks

2. submit_attempt
   Input: attempt payload (question_id, selected_option, time_spent, confidence, context baseline_module_id/module_id)
   Logic:

- Validate access to question.
- Compute is_correct.
- Derive rule-based error tags using:
  - option_tag_id from question_option_meta
  - time_spent vs expected_time
- Insert attempt + attempt_error_tags.
- Update user_skill_state and user_construct_state (deterministic formulas).
  Return: attempt result

3. finalize_baseline_module
   Input: baseline_module_id
   Logic:

- Mark baseline module done for user (store completion tracking; can be derived from attempts).
- Compute partial analytics snapshot for completed modules.
  Return: updated baseline progress + partial analytics

4. finalize_cycle_if_needed
   Triggered after task completion:

- If required tasks done, set user phase RECYCLE_UNLOCKED, create recycle_checkpoint question set.

5. create_recycle_checkpoint
   Input: user_id, cycle_id
   Logic:

- pick targeted questions from red-zone micro-skills + controls.
  Return: checkpoint payload

6. finalize_checkpoint
   Input: checkpoint_id
   Logic:

- compute delta analytics snapshot, mark cycle completed, create next plan cycle (or require user tap to generate).
  Optionally call Tier-1 AI session_summary job using aggregated stats (no full question text).

7. admin_content_ops endpoints (admin-only)

- admin_generate_items (AI job C)
- admin_auto_tag (AI job D)
- admin_qc (AI job E)
- admin_publish (moves to published)
  All must store ai_runs.

# ======================== 8) AI “COOKBOOK” (PROMPTS + I/O CONTRACTS)

Rules for all AI jobs:

- Output MUST be strict JSON only.
- Never generate real UTBK leaked questions; generate original items only.
- Always include metadata: micro_skill_id, difficulty, tags, expected_time, construct_weights (inherit OK).
- Store ai_runs with prompt_version.

AI JOB A: Taxonomy Builder
Input JSON: {exam, year, component, source_notes, id_prefix}
Output JSON: taxonomy_version, nodes[] fields: node_id, parent_id, name, description, typical_forms, cognitive_level, common_traps, default_construct_weights, expected_time_sec
Prompt: (use strict JSON instruction)

AI JOB B: Tag Scheme Generator
Output: error_tags[], question_tags[], option_tags[] with definitions and signals.

AI JOB C: Item Generator (questions + explanations + flashcards)
Output: items[] with:

- question_id, micro_skill_id, difficulty, stem, options[{id,text}], answer{correct_option_id}, explanation{steps[],shortcut,trap_warning}, flashcards[{front,back}], tags[], construct_weights(optional), expected_time_sec
  Also include option_tags mapping to enable rule-based diagnosis:
- options_meta[{option_id, option_tag_id}]

AI JOB D: Auto-tagging & Linking (imported content)
Output: micro_skill_id, difficulty, tags, construct_weights, confidence

AI JOB E: Quality Check (QC)
Output: qc_results[] status pass|revise|reject and issues[]

AI JOB G: Tier-1 Session Summary (batch insight, low token)
IMPORTANT: input must be aggregated stats only (no question text).
Output: insights[] {title,evidence,action}

AI JOB H: On-demand Explanation (Tier-2)
Only called when user taps "Explain".
Input includes full question text; output concise explanation.

Token strategy:

- Default: no per-question AI diagnosis.
- Use deterministic option_tag + time heuristics for error tags.
- Tier-1 called once per module/session or checkpoint completion.
- Tier-2 only on user demand.

# ======================== 9) PLANNING & ANALYTICS LOGIC (DETERMINISTIC)

- Readiness score = weighted function of accuracy, speed_index, stability, coverage.
- Construct scores derive from attempt outcomes weighted by question.construct_weights:
  - e.g., attention score decreases with careless-like errors (incorrect_fast)
- Careless-like rule:
  incorrect AND time_spent < 0.6 \* expected_time_sec
- Speed index:
  avg_time / expected_time_sec
- Store analytics snapshots after:
  - baseline module completion (partial)
  - baseline completion (full)
  - checkpoint completion (cycle_end)

# ======================== 10) ADMIN CONSOLE (MUST BUILD)

Admin routes:

- /admin/taxonomy (manage taxonomy versions & nodes)
- /admin/tags (error/question/option tags)
- /admin/questions (generate/import, auto-tag, QC, publish)
- /admin/modules (compose modules, publish)
- /admin/baseline (define baseline micro-modules and question sets)
- /admin/ai-runs (view ai_runs logs, tokens, status)

Admin workflow:

1. Define taxonomy + constructs + tag schemes
2. Generate items for micro-skills
3. Auto-tag & QC
4. Human approve (review queue)
5. Publish
6. Compose baseline modules (3–5 min each) from published questions
7. Publish baseline checkpoint and enable student onboarding

# ======================== 11) IMPLEMENTATION DETAILS

- Use Supabase Auth with middleware to enforce routes.
- Use server components where helpful; client components for runner and charts.
- Use optimistic UI for task completion.
- Store minimal local state; source of truth in Supabase.
- Add mock seed script for baseline modules and sample questions for prototyping.

# ======================== 12) DELIVERABLES

Generate a complete codebase with:

- Next.js app (student + admin)
- Supabase SQL migrations (schema + RLS policies)
- Edge functions for plan generation, attempts, checkpoints, admin content ops
- Mock data seeding
- UI screens and components per spec
- README with setup steps

END.
