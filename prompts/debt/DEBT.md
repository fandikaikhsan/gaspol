# TECHNICAL DEBT & MISSING FEATURES

**Last Updated:** 2026-02-22
**Context:** Admin features completed (Tasks #1-4), Module Composer in progress (#5)
**Priority:** HIGH - Core analysis system needed for MVP value proposition

---

## 📋 OVERVIEW

The admin console is functional but the **student-facing learning system and analysis engine** are missing. These are CRITICAL for the product's core value: personalized readiness assessment and adaptive learning.

**What works now:**
- ✅ Exam configuration with AI research
- ✅ Taxonomy management (5-level hierarchy)
- ✅ Question CRUD with options
- ✅ AI question generation
- ✅ Module composer (in progress)

**What's missing:**
- ❌ Student attempt tracking
- ❌ Skill state analysis (per taxonomy node)
- ❌ Construct profiling (Attention, Speed, Reasoning, etc.)
- ❌ Error detection and tagging
- ❌ Readiness scoring and analytics
- ❌ Adaptive learning recommendations
- ❌ Student dashboard and study interface

---

## 🎯 PHASE 1: CORE ANALYSIS SYSTEM (Critical Path)

### 1.1 Database Schema Extensions

**Missing Tables:**

#### A) `attempts` - Student answer tracking
```sql
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Context (where did this attempt happen?)
  module_id TEXT NULL REFERENCES modules(id),
  baseline_module_id TEXT NULL REFERENCES baseline_modules(id),
  checkpoint_id TEXT NULL,

  -- Attempt data
  is_correct BOOLEAN NOT NULL,
  user_option JSONB NOT NULL, -- {"selected": "B"} or {"selected": ["A","C"]} for MCK
  time_spent_sec INTEGER NOT NULL,
  confidence SMALLINT NULL CHECK (confidence BETWEEN 1 AND 5),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, question_id, created_at) -- allow retries
);

CREATE INDEX idx_attempts_user ON attempts(user_id, created_at);
CREATE INDEX idx_attempts_question ON attempts(user_id, question_id);
CREATE INDEX idx_attempts_module ON attempts(module_id);
```

#### B) `attempt_error_tags` - Error pattern tracking
```sql
CREATE TABLE attempt_error_tags (
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  -- How was this tag assigned?
  source TEXT NOT NULL CHECK (source IN ('rule', 'ai', 'user_confirmed')),
  confidence DECIMAL(3,2) NULL, -- for AI assignments

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (attempt_id, tag_id)
);

CREATE INDEX idx_attempt_tags_attempt ON attempt_error_tags(attempt_id);
CREATE INDEX idx_attempt_tags_tag ON attempt_error_tags(tag_id);
```

#### C) `user_skill_state` - Mastery tracking per taxonomy node
```sql
CREATE TABLE user_skill_state (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  taxonomy_node_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- Performance metrics
  mastery FLOAT NOT NULL DEFAULT 0.0 CHECK (mastery BETWEEN 0 AND 1),
  speed_sec FLOAT NULL, -- average time spent
  stability FLOAT NULL CHECK (stability BETWEEN 0 AND 1), -- consistency score

  -- Tracking
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ NULL,

  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, taxonomy_node_id)
);

CREATE INDEX idx_user_skill_state_user ON user_skill_state(user_id);
CREATE INDEX idx_user_skill_state_node ON user_skill_state(taxonomy_node_id);
CREATE INDEX idx_user_skill_state_mastery ON user_skill_state(user_id, mastery);
```

#### D) `user_construct_state` - Construct profiling
```sql
CREATE TABLE user_construct_state (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Construct scores (0-100 scale)
  constructs JSONB NOT NULL DEFAULT '{}',
  -- Example: {"C.ATTENTION": 48, "C.SPEED": 62, "C.REASONING": 72, "C.COMPUTATION": 55, "C.READING": 65}

  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_construct_state_updated ON user_construct_state(updated_at);
```

#### E) `analytics_snapshots` - Pre-computed analytics for dashboard speed
```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Snapshot scope
  scope TEXT NOT NULL CHECK (scope IN ('partial_baseline', 'full_baseline', 'cycle_end', 'checkpoint')),

  -- Analytics data
  coverage JSONB NOT NULL DEFAULT '{}', -- {"TPS": 0.85, "TKA": 0.45} - % of taxonomy covered
  readiness FLOAT NULL, -- 0-100 overall readiness score
  radar JSONB NULL, -- {"L1_recall": 75, "L2_application": 60, "L3_analysis": 45}
  constructs JSONB NULL, -- {"C.ATTENTION": 48, "C.SPEED": 62, ...}
  top_weak_skills JSONB NULL, -- [{"node_id": "...", "name": "...", "mastery": 0.3}]
  top_error_tags JSONB NULL, -- [{"tag": "ERR.CARELESS", "count": 15}]

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_snapshots_user ON analytics_snapshots(user_id, created_at);
CREATE INDEX idx_analytics_snapshots_scope ON analytics_snapshots(user_id, scope);
```

---

### 1.2 Question Schema Extensions

**Add construct weights to questions:**

```sql
-- Migration: Add construct_weights to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS construct_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expected_time_sec INTEGER DEFAULT 120;

-- Update taxonomy_nodes to include default construct weights
ALTER TABLE taxonomy_nodes
ADD COLUMN IF NOT EXISTS default_construct_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expected_time_sec INTEGER DEFAULT 120;

COMMENT ON COLUMN questions.construct_weights IS 'Construct weights for this question. If empty, inherits from taxonomy_node.default_construct_weights';
COMMENT ON COLUMN taxonomy_nodes.default_construct_weights IS 'Default construct weights inherited by questions. Example: {"C.REASONING": 0.6, "C.ATTENTION": 0.3, "C.SPEED": 0.1}';
```

---

### 1.3 Edge Functions (Critical for Analysis)

#### A) `submit_attempt` - Process student answers
```typescript
// Input:
{
  question_id: string,
  selected_option: string | string[], // "B" or ["A","C"] for MCK
  time_spent_sec: number,
  confidence?: number (1-5),
  context: {
    module_id?: string,
    baseline_module_id?: string,
    checkpoint_id?: string
  }
}

// Logic:
1. Validate access to question (is it published? is user allowed?)
2. Compute is_correct by comparing with question.correct_answer
3. Insert attempt record
4. Derive rule-based error tags:
   - If time_spent > expected_time * 1.5: add "ERR.SLOW"
   - If time_spent < expected_time * 0.3: add "ERR.RUSHED"
   - If !is_correct: get option_tag_id from question_option_metadata
5. Insert attempt_error_tags
6. Update user_skill_state (see formulas below)
7. Update user_construct_state (weighted by question.construct_weights)
8. Return attempt result with feedback

// Output:
{
  attempt_id: string,
  is_correct: boolean,
  correct_answer: string,
  explanation: object,
  time_spent: number,
  error_tags: string[],
  skill_update: {
    node_id: string,
    new_mastery: number,
    delta: number
  }
}
```

**Mastery Update Formula:**
```typescript
// Simple exponential moving average approach
function updateMastery(currentMastery: number, isCorrect: boolean, difficulty: string): number {
  const learningRate = 0.2 // how quickly mastery changes
  const difficultyWeight = {
    'easy': 0.7,
    'medium': 1.0,
    'hard': 1.3
  }[difficulty]

  const target = isCorrect ? 1.0 : 0.0
  const weight = learningRate * difficultyWeight

  return currentMastery + weight * (target - currentMastery)
}

// Propagate to parent nodes (aggregate)
function propagateToParents(nodeId: string) {
  // Get all child node masteries
  const childMasteries = await getChildNodeMasteries(nodeId)

  // Parent mastery = weighted average of children
  const parentMastery = calculateWeightedAverage(childMasteries)

  // Update parent and recurse upward
  await updateNodeMastery(parentId, parentMastery)
  if (hasParent(parentId)) {
    await propagateToParents(parentId)
  }
}
```

**Construct Update Formula:**
```typescript
function updateConstructs(
  currentConstructs: Record<string, number>,
  questionWeights: Record<string, number>,
  isCorrect: boolean,
  difficulty: string
): Record<string, number> {
  const impact = isCorrect ? +5 : -5 // base impact
  const difficultyMultiplier = { easy: 0.7, medium: 1.0, hard: 1.3 }[difficulty]

  const updated = { ...currentConstructs }

  for (const [construct, weight] of Object.entries(questionWeights)) {
    const delta = impact * weight * difficultyMultiplier
    updated[construct] = Math.max(0, Math.min(100, updated[construct] + delta))
  }

  return updated
}
```

#### B) `compute_analytics_snapshot` - Generate dashboard data
```typescript
// Input:
{
  user_id: string,
  scope: 'partial_baseline' | 'full_baseline' | 'cycle_end' | 'checkpoint'
}

// Logic:
1. Query all user_skill_state for user
2. Calculate coverage by taxonomy branch
3. Calculate readiness score (weighted average of masteries)
4. Get top 10 weakest skills (lowest mastery)
5. Get top error tags from recent attempts
6. Get construct profile from user_construct_state
7. Insert analytics_snapshot
8. Return snapshot

// Output:
{
  snapshot_id: string,
  coverage: object,
  readiness: number,
  weak_areas: array,
  error_patterns: array,
  constructs: object
}
```

#### C) `calculate_readiness` - Readiness scoring algorithm
```typescript
function calculateReadiness(skillStates: UserSkillState[]): number {
  // Weight by taxonomy level (micro-skills matter more)
  const levelWeights = {
    5: 1.0,   // Micro-skill
    4: 0.8,   // Subtopic
    3: 0.6,   // Topic
    2: 0.4,   // Subtest
    1: 0.2    // Subject
  }

  let weightedSum = 0
  let totalWeight = 0

  for (const state of skillStates) {
    const weight = levelWeights[state.taxonomy_node.level]
    weightedSum += state.mastery * weight
    totalWeight += weight
  }

  const rawScore = weightedSum / totalWeight

  // Apply stability modifier (penalize inconsistent performance)
  const avgStability = calculateAverageStability(skillStates)
  const stabilityModifier = 0.8 + (avgStability * 0.2) // 0.8 to 1.0

  return Math.round(rawScore * stabilityModifier * 100) // 0-100 scale
}
```

---

## 🎓 PHASE 2: STUDENT LEARNING INTERFACE

### 2.1 Student Dashboard (`/dashboard`)

**Components needed:**
- Readiness score display (circular progress)
- Construct radar chart
- Coverage heatmap (taxonomy tree visualization)
- Recent activity feed
- Weak areas list (with drill links)
- Error pattern insights

**Data source:** `analytics_snapshots` table (latest for user)

### 2.2 Baseline Assessment (`/baseline`)

**Flow:**
1. Show baseline checkpoint progress
2. List baseline modules (3-5 min each)
3. Module interface:
   - Question presentation (one at a time)
   - Timer (countdown)
   - Answer selection
   - Confidence rating (1-5 stars)
   - Submit → Edge function `submit_attempt`
4. After each module: show mini-summary
5. After full baseline: compute analytics snapshot → show readiness

**Tables used:**
- `baseline_modules`
- `baseline_module_questions`
- `attempts`
- `analytics_snapshots`

### 2.3 Practice Modules (`/practice`)

**Module types:**
- Drill Focus (target specific weak skills)
- Drill Mixed (varied practice)
- Mock Test (timed, exam-like)

**Interface:**
- Module card grid (filtered by type)
- Module detail view (estimated time, question count, topics covered)
- Practice session (same as baseline but different context)
- Results page (performance breakdown by skill/construct)

### 2.4 Study Plan (`/plan`)

**Features:**
- Auto-generated daily tasks based on analytics
- Task types: Drill, Flashcards, Mock, Review
- Progress tracking
- Recycle checkpoint (re-assessment)

**Edge function:** `generate_plan` (not yet implemented)

---

## 🔧 PHASE 3: ADMIN ENHANCEMENTS

### 3.1 Construct Weight Configuration UI

**Location:** `/admin/questions` (edit dialog)

**UI needed:**
- Construct weight sliders (5 constructs)
- Visual display: "This question measures:"
  - Reasoning: ████████░░ 60%
  - Attention: ██████░░░░ 30%
  - Speed: ██░░░░░░░░ 10%
- "Use taxonomy defaults" checkbox
- Preview of inherited weights from taxonomy node

**Implementation:**
```typescript
// In question edit dialog
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label>Construct Weights</Label>
    <Checkbox
      checked={useDefaultWeights}
      onCheckedChange={(checked) => {
        if (checked) {
          // Load from taxonomy_node.default_construct_weights
          loadDefaultConstructWeights(formData.taxonomy_node_ids[0])
        }
      }}
    >
      Use Taxonomy Defaults
    </Checkbox>
  </div>

  {!useDefaultWeights && (
    <>
      {CONSTRUCTS.map(construct => (
        <div key={construct.id}>
          <Label>{construct.name}</Label>
          <Slider
            value={constructWeights[construct.id] * 100}
            onChange={(value) => updateConstructWeight(construct.id, value / 100)}
            min={0}
            max={100}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Total: {getTotalWeight()}% (should sum to 100%)
      </p>
    </>
  )}
</div>
```

### 3.2 Taxonomy Node Enhancement

**Location:** `/admin/taxonomy` (edit dialog)

**Add fields:**
- Default construct weights (same UI as questions)
- Expected time (seconds)
- Cognitive level (L1/L2/L3)
- Typical forms (JSONB: common question patterns)
- Common traps (JSONB: typical misconceptions)

### 3.3 Analytics Dashboard for Admins

**Location:** `/admin/analytics`

**Show:**
- Question bank statistics (by difficulty, cognitive level, taxonomy coverage)
- Student performance aggregates (avg readiness, common weak areas, error patterns)
- AI usage stats (tokens, cost, success rate)
- Content quality metrics (QC pass rate, student feedback)

---

## 📊 DATA FLOW SUMMARY

```
Student answers question
         ↓
submit_attempt Edge Function
         ↓
    ┌────┴────┐
    ↓         ↓
attempts   rule-based error detection
table      (time, option_tag)
    ↓         ↓
    └────┬────┘
         ↓
  attempt_error_tags
         ↓
    ┌────┴────┬────────────┬─────────────┐
    ↓         ↓            ↓             ↓
user_skill_  user_       propagate    update all
state     construct_   to parent     parent nodes
(micro)   state       nodes         (aggregation)
         ↓
    ┌────┴────┐
    ↓         ↓
Dashboard  analytics_snapshots
realtime   (periodic/milestone)
```

---

## 🗂️ FILE STRUCTURE FOR IMPLEMENTATION

```
/app/
  /student/              # NEW
    /dashboard/
      page.tsx           # Main dashboard
    /baseline/
      page.tsx           # Baseline checkpoint list
      /[moduleId]/
        page.tsx         # Module practice interface
    /practice/
      page.tsx           # Practice module list
      /[moduleId]/
        page.tsx         # Practice session
    /plan/
      page.tsx           # Study plan

/supabase/
  /migrations/
    012_student_analysis_schema.sql   # All missing tables
    013_construct_weights.sql         # Add construct fields

  /functions/
    /submit_attempt/
      index.ts           # Process attempts
    /compute_analytics/
      index.ts           # Generate snapshots
    /generate_plan/
      index.ts           # AI-powered study plan

/components/
  /student/              # NEW
    ReadinessScore.tsx   # Circular score display
    ConstructRadar.tsx   # Radar chart
    SkillTreeMap.tsx     # Taxonomy heatmap
    WeakAreaCard.tsx     # Weak skill display
    QuestionCard.tsx     # Question presentation
    ConfidenceRating.tsx # Star rating
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Must-Have (MVP):
1. ✅ Baseline assessment flow (submit_attempt + skill tracking)
2. ✅ Basic dashboard (readiness + weak areas)
3. ✅ Practice modules (drill)
4. ✅ Construct profiling (5 constructs)

### Should-Have (Post-MVP):
5. Error tagging system (rule-based)
6. Study plan generation
7. Analytics dashboard (admin)
8. Construct weight UI (admin)

### Nice-to-Have (Future):
9. AI error detection
10. Flashcards
11. Recycle checkpoints
12. Mock test builder

---

## 📚 REFERENCE DOCUMENTS

- **PRD.v1.md** - Full product requirements (sections 5-7 cover analysis)
- **ADMIN.v2.md** - Admin console specs (sections 1-4 cover content ops)
- **DESIGN.v1.md** - UI/UX guidelines (student interface design)

**Key PRD Sections:**
- Section 5: Database schema (tables G, H with user state tracking)
- Section 6: Security/RLS rules
- Section 7: Edge functions (submit_attempt, finalize_baseline, generate_plan)
- Section 8: AI job specs (construct analysis)

---

## 🚨 CRITICAL NOTES

1. **Construct weights are ESSENTIAL** - Without them, we cannot do construct profiling, which is a core differentiator
2. **submit_attempt must be FAST** - It runs on every question answered (optimize queries)
3. **Analytics snapshots prevent dashboard lag** - Pre-compute on milestones (baseline complete, cycle end)
4. **Mastery formula must be tuned** - Current formula is placeholder, needs data-driven calibration
5. **Error detection is powerful but requires careful signal design** - Start with simple rules (time-based) before AI

---

## ✅ ACCEPTANCE CRITERIA

**Analysis System is Complete when:**
- [ ] Student can take baseline assessment
- [ ] Readiness score is calculated and displayed
- [ ] Dashboard shows construct radar chart
- [ ] Dashboard shows top 3 weak areas
- [ ] Skill state is tracked at all 5 taxonomy levels
- [ ] Parent node mastery aggregates from children
- [ ] Practice modules update skill state
- [ ] Analytics snapshot is generated after baseline

**Admin Enhancement is Complete when:**
- [ ] Admin can set construct weights on questions
- [ ] Admin can set default construct weights on taxonomy nodes
- [ ] Admin can set expected time on questions/taxonomy
- [ ] Question generation includes construct weights
- [ ] Analytics dashboard shows student performance trends

---

## 🔄 NEXT STEPS AFTER TASK #5

1. Create migration `012_student_analysis_schema.sql`
2. Implement `submit_attempt` edge function
3. Build baseline assessment UI (`/student/baseline`)
4. Build dashboard UI (`/student/dashboard`)
5. Implement construct profiling
6. Add construct weight UI to admin
7. Test full flow: baseline → analytics → dashboard → drill

**Estimated Effort:** 3-5 days for core analysis system

---

**END OF DEBT DOCUMENT**
