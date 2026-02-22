TITLE: ADMIN-ONLY MASTER PROMPT — UTBK Last-Minute Prep (Content Ops + Supabase + Edge AI)

You are a full product+engineering team (Tech Lead, Product Designer, Security Engineer, Prompt Engineer).
Generate the ADMIN CONSOLE + ADMIN BACKEND ONLY (no student app UI in this prompt) for an UTBK last-minute prep platform.

The admin console enables: taxonomy/tag management, AI-assisted content generation (questions/explanations/flashcards), auto-tagging, QC, review queue, publishing, module assembly, baseline micro-assessment builder (3–5 min modules), mock assembly, and full audit of AI runs (tokens/cost/prompt versions).

# ======================================== 0) HARD CONSTRAINTS

- Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + Auth + Storage) + Supabase Edge Functions (TypeScript)
- AI calls ONLY from Edge Functions (server-side). Never expose AI keys client-side.
- Strict JSON outputs from AI jobs. No prose, no markdown, no extra keys.
- Version EVERYTHING: prompt_version, taxonomy_version, question_version.
- Admin-only: all routes under /admin require admin role.
- Mobile-first UI even for admin, but can be desktop-friendly.

========================================

1. # ADMIN PRODUCT SCOPE
   Admin must be able to:
   A) Define and maintain:

- taxonomy versions: subtest -> topic -> micro-skill nodes (stable text IDs)
- constructs: C.ATTENTION (teliti), C.SPEED, C.REASONING, C.COMPUTATION, C.READING
- tag schemes:
  - error tags (ERR.\*) + signals
  - question tags (Q.\*)
  - option tags (OPT.\*) for distractor/misconception mapping

B) Content Ops pipeline (AI-assisted + human review):

1. Generate items for selected micro-skill(s): questions + options + correct answer + explanation + shortcut + trap warning + flashcards.
2. Auto-tagging/linking: assign micro-skill, tags, construct weights, expected time; assign option tags for distractors.
3. Quality checks: ambiguity, answer-consistency, weak distractors; output pass/revise/reject with issue codes.
4. Human review queue: approve / reject / request revision.
5. Publish content: make questions available to students (published status), and lock versions.

C) Assemble learning structures:

- Modules: drill focused, drill mixed, mock
- Baseline micro-assessment modules: 3–5 min each (6–10 questions), grouped by cluster/topic; used for Checkpoint 1 baseline.
- Baseline checkpoint configuration: list of baseline modules + their question sets.
- Mock blueprint templates (optional): full or mini mocks.

D) Monitor AI usage:

- ai_runs: job type, prompt version, model, tokens_in/out, cost_estimate, status
- content throughput: generated, QC pass rate, publish rate

# ======================================== 2) ADMIN UX / IA (ROUTES + SCREENS)

All admin routes under /admin.

(1) /admin (Overview)

- summary cards: published questions, draft, in review, failed QC, baseline modules count, AI tokens last 7d
- quick actions: “Generate Items”, “QC Queue”, “Baseline Builder”, “Publish”

(2) /admin/taxonomy

- list taxonomy versions
- view/edit taxonomy nodes tree
- edit node: name, description, typical_forms, common_traps, default_construct_weights, expected_time_sec

(3) /admin/constructs

- manage constructs list and descriptions

(4) /admin/tags

- manage tags (error/question/option)
- tag create/edit: id, definition, signals (for error tags)

(5) /admin/questions
Tabs:

- Draft
- In Review
- QC Failed
- Published
  Actions:
- Generate items (AI job)
- Import items (manual JSON)
- Auto-tag/link (AI job)
- Run QC (AI job)
- Review & Approve
- Publish
  Question detail view:
- stem/options/answer/explanation/flashcards
- micro-skill link + tags + construct weights + expected time
- option_tag mapping per option
- revision history (question_versions)

(6) /admin/modules

- create module manually (select question ids)
- compose module from criteria (mixed micro-skills, difficulty mix, timebox)
- publish module

(7) /admin/baseline

- baseline checkpoint config (CP1)
- create baseline module (3–5 min, 6–10 Q) by selecting micro-skills or question pool rules
- preview module composition
- publish baseline module set

(8) /admin/ai-runs

- list all AI runs with filter by job type/date/status
- show tokens/cost, input/output JSON, prompt_version

(9) /admin/settings

- safety rules, prompt versions, default generation parameters

UI Style: use “Soft Neubrutalism / Friendly Dashboard” (see section 10).

# ======================================== 3) SUPABASE AUTH + ADMIN ACCESS CONTROL

- Use Supabase Auth.
- profiles table includes role: 'admin'|'student'.
- Admin middleware: on server, verify session + role=admin; otherwise redirect.

All write operations to content tables require admin.

# ======================================== 4) DATABASE SCHEMA (ADMIN-RELEVANT)

Create these tables (public schema). Use UUID PK for internal; stable TEXT IDs for taxonomy/questions/modules.

Enums:

- role_type: admin|student
- question_status: draft|reviewed|published|retired
- module_status: draft|published
- review_status: pending|approved|rejected|needs_revision
- ai_job_type: taxonomy_builder|tag_scheme|item_gen|auto_tag|qc|module_compose|session_summary|explain_on_demand
- ai_run_status: success|failed

Tables:
A) profiles

- id uuid pk = auth.users.id
- display_name text
- role role_type default 'student'
- created_at

B) taxonomy_versions

- id text pk (e.g., UTBK26_v1)
- exam text, year int, notes text, created_at

C) taxonomy_nodes

- id text pk (e.g., UTBK26.TPS.PU.001)
- taxonomy_version_id fk
- parent_id fk self
- name, description
- cognitive_level text
- typical_forms jsonb
- common_traps jsonb
- default_construct_weights jsonb // {C.REASONING:0.6,...}
- expected_time_sec int
- created_at

D) constructs

- id text pk (C.ATTENTION, C.SPEED, etc.)
- label text
- description text

E) tags

- id text pk (ERR._, Q._, OPT.\*)
- tag_type text (error|question|option)
- name text
- definition text
- signals jsonb nullable (only for error tags)

F) questions (versioned)

- id text pk (Q.UTBK26.000123)
- taxonomy_node_id text fk (micro-skill)
- difficulty text (easy|medium|hard)
- format text (mcq|tf|swipe)
- status question_status default draft
- construct_weights jsonb nullable (override; if null, inherit micro-skill defaults)
- expected_time_sec int nullable (override)
- created_at, updated_at

G) question_versions

- id uuid pk
- question_id fk
- version int
- stem text
- options jsonb // [{id:"A",text:"..."}]
- answer jsonb // {correct_option_id:"C"}
- explanation jsonb // {steps:[], shortcut:"", trap_warning:""}
- flashcards jsonb // [{front:"",back:""}]
- hash text (dedupe)
- created_by uuid fk profiles
- created_at
  Unique(question_id, version)

H) question_tag_map

- question_id fk
- tag_id fk
  PK(question_id, tag_id)

I) question_option_meta

- question_id fk
- version int
- option_id text
- option_tag_id text fk tags(id) where tag_type='option'
  PK(question_id, version, option_id)

J) modules

- id text pk (M.UTBK26.00077)
- title text
- mode text (topical|drill|mock)
- estimated_time_min int
- status module_status default draft
- created_by uuid
- created_at

K) module_items

- module_id fk
- question_id fk
- order_index int
  PK(module_id, question_id)

L) baseline_checkpoints

- id text pk (CP1)
- taxonomy_version_id fk
- title text
- created_at

M) baseline_modules

- id text pk (BM01)
- checkpoint_id fk
- title text
- eta_min int
- question_count int
- order_index int
- created_at

N) baseline_module_questions

- baseline_module_id fk
- question_id fk
- order_index int
  PK(baseline_module_id, question_id)

O) content_review_queue

- id uuid pk
- item_type text (question|module|baseline_module)
- ref_id text
- status review_status default pending
- issues jsonb nullable
- notes text nullable
- reviewer_id uuid nullable
- created_at, updated_at

P) ai_runs

- id uuid pk
- job_type ai_job_type
- prompt_version text
- model text
- input_json jsonb
- output_json jsonb
- tokens_in int
- tokens_out int
- cost_estimate numeric nullable
- status ai_run_status
- created_by uuid nullable
- created_at

Indexes:

- questions(status, taxonomy_node_id)
- content_review_queue(status, item_type)
- ai_runs(job_type, created_at)

# ======================================== 5) RLS POLICIES (SECURITY ENGINEER REQUIREMENTS)

Enable RLS on all tables.

- profiles:
  - user can select/update own row
  - admin can select all

- taxonomy_versions, taxonomy_nodes, constructs, tags:
  - select: any authenticated user
  - insert/update/delete: admin only

- questions, question*versions, question_tag_map, question_option_meta, modules, module_items, baseline*\*:
  - select: admin only in admin console context (for this admin-only build)
  - insert/update/delete: admin only

- content_review_queue:
  - admin only

- ai_runs:
  - admin only
  - edge functions write using service role; do NOT allow client direct insert

Admin check:

- Implement a Postgres function is_admin(uid) that checks profiles.role='admin'
- Use it in RLS policies.

# ======================================== 6) EDGE FUNCTIONS (ADMIN API)

All functions verify admin role (JWT) or run as service role with internal checks.

(1) admin_generate_items
Input:
{
taxonomy_version,
micro_skill_id,
difficulty,
count,
format,
language,
prompt_version,
generation_constraints
}
Flow:

- Call AI JOB: ITEM_GEN (two-pass recommended: generate then QC)
- Insert questions + question_versions (draft)
- Insert tags + option meta if present
- Create review queue entries
- Insert ai_runs record
  Return: created question IDs + summary

(2) admin_auto_tag
Input: list of question_ids OR raw items JSON
Flow:

- Call AI JOB: AUTO_TAG (no rewrite)
- Update questions: taxonomy_node_id, difficulty, construct_weights, expected_time
- Update question_tag_map
- Insert ai_runs
  Return: classification results

(3) admin_qc_questions
Input: question_ids
Flow:

- Fetch latest version content
- Call AI JOB: QC
- Write qc issues into content_review_queue. Mark needs_revision if problems.
- Insert ai_runs
  Return: qc_results

(4) admin_publish_questions
Input: question_ids
Flow:

- Ensure QC passed OR explicit override requires admin confirmation flag
- Set questions.status='published'
- Insert audit log entry (optional)
  Return: success

(5) admin_compose_module
Input:
{
title,
mode,
criteria: {
micro_skill_ids[],
difficulty_mix,
total_questions,
estimated_time_min,
avoid_recent_duplicates: true
}
}
Flow:

- Prefer deterministic selection from published questions
- Optional AI JOB: MODULE_COMPOSE for title/order only (no question text needed)
- Create module + module_items
- Push to review queue
  Return module_id

(6) admin_create_baseline_modules
Input:
{
checkpoint_id: "CP1",
module_specs: [
{title, eta_min:3-5, question_count:6-10, micro_skill_ids[]}
]
}
Flow:

- Deterministically select published questions per micro-skill
- Create baseline_modules + baseline_module_questions
  Return baseline module IDs

# ======================================== 7) PROMPTING STRATEGY (PROMPT ENGINEER REQUIREMENTS)

Global prompt rules:

- Always request strict JSON only.
- Provide explicit output schema.
- For item generation: prefer 2-pass:
  Pass 1: generate items
  Pass 2: QC items; if revise, regenerate only flagged items
- Use stable IDs; never rely on model to invent consistent IDs without guidance.
- Minimize tokens:
  - For QC and batch insight, do not send long repeated taxonomy; send IDs and short definitions only.
  - Store taxonomy in DB; edge function can fetch only needed nodes and compress them.

Prompt versioning:

- Store prompt templates in code and track prompt_version in ai_runs.
- Any changes bump prompt_version.

Deduping:

- Hash question stem+options; store in question_versions.hash.
- Before inserting, check duplicates.

# ======================================== 8) AI COOKBOOK (ADMIN CONTENT OPS JOBS)

All AI outputs must be valid JSON with no trailing commentary.

JOB A: TAXONOMY_BUILDER
Input JSON:
{ exam, year, component, source_notes, id_prefix, taxonomy_version }
Output JSON:
{
taxonomy_version,
nodes: [
{
node_id, parent_id, name, description,
typical_forms:[], cognitive_level,
common_traps:[],
default_construct_weights:{...},
expected_time_sec
}
]
}
Prompt Template:
SYSTEM: You are an assessment taxonomy designer. Output JSON only.
USER: Build/extend taxonomy for {exam} {year} component {component} using id_prefix {id_prefix}. Source notes: {source_notes}. Output schema exactly as specified.

JOB B: TAG_SCHEME
Output:
{ error_tags:[{tag_id,name,definition,signals[]}], question_tags:[...], option_tags:[...] }

JOB C: ITEM_GEN (Questions + Explanations + Flashcards + Option Tags)
Input JSON:
{
taxonomy_version,
micro_skill_id,
micro_skill_description,
default_construct_weights,
expected_time_sec,
difficulty,
count,
format,
constraints:{ no_leaks:true, unambiguous:true }
}
Output JSON:
{
items:[
{
question_id,
micro_skill_id,
difficulty,
format,
expected_time_sec,
construct_weights, // optional override
stem,
options:[{id,text}],
answer:{correct_option_id},
options_meta:[{option_id, option_tag_id}],
tags:[...],
explanation:{steps:[], shortcut:"", trap_warning:""},
flashcards:[{front,back}]
}
]
}
Prompt Template:
SYSTEM: You are an exam item writer. Output JSON only. Rules: no copyrighted/leaked UTBK questions; items must be unambiguous; include option_tags for distractors.
USER: Generate {count} items for micro_skill_id {micro_skill_id} with the output schema. Provide options_meta with option_tag_id (OPT.\*) describing misconception/trap.

JOB D: AUTO_TAG (classify existing items)
Input: items[] with stem/options/answer
Output: classified_items[] {question_id, micro_skill_id, difficulty, tags[], construct_weights, expected_time_sec, confidence}

JOB E: QC
Input: items[] (full content)
Output: qc_results[] {question_id, status:pass|revise|reject, issues:[{code,severity,note}], suggested_fix}

QC issue codes to enforce:

- AMBIGUOUS
- WRONG_KEY
- WEAK_DISTRACTOR
- INCONSISTENT_EXPLANATION
- TOO_LONG_FOR_TIME
- FORMAT_ERROR

# ======================================== 9) ADMIN UI BEHAVIOR REQUIREMENTS

- Bulk actions: generate, auto-tag, QC, publish should support multi-select.
- Review queue: show issues from QC; allow approve/reject/needs_revision.
- Question editor: allow inline edits; saving creates new question_version (increment version).
- Publishing locks latest version as canonical for students (draft edits create new version but not live until republish).
- Baseline builder: show per-module ETA 3–5 min, 6–10 questions; preview question list; lock publish.

# ======================================== 10) UI STYLE ADDENDUM (MATCH THIS TASTE)

Design language: “Soft Neubrutalism / Friendly Dashboard”

- Off-white background, charcoal borders, 2px outlines, rounded cards (16–24), subtle shadow offset (sticker feel).
- Pastel accent cards (yellow, lavender, sky blue) + coral/orange CTA.
- Pills for filters; active pill filled dark.
- Consistent spacing scale (8/12/16/24).
- Hover/press: slight lift and shadow increase.

Apply to admin console too: cards, pills, tables inside rounded containers, clear hierarchy.

# ======================================== 11) DELIVERABLES

Generate:

- Next.js admin console with routes above
- Supabase SQL migrations: schema + RLS + is_admin helper function
- Supabase Edge Functions for admin content ops
- Minimal seed data: constructs, sample taxonomy_version, a few nodes, tags
- README with setup steps (Supabase env vars, edge function deployment, local dev)

END OF ADMIN MASTER PROMPT
