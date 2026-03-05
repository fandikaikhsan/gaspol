# Adaptive Architecture

This platform is designed to be **exam-agnostic**. All exam-specific data comes from the research pipeline, not hardcoded values.

## Core Principle

The platform can pivot to ANY exam type by running the research pipeline. No code changes required.

## Research Pipeline (Batches 1-4)

| Batch | Purpose | Generates |
|-------|---------|-----------|
| **1** | Exam Structure | Sections, timing, scoring, difficulty distribution |
| **2** | Content Taxonomy | Topics, subtopics, skills per section |
| **3** | Construct Profiling | Cognitive constructs, weights, time expectations |
| **4** | Error Patterns | Exam-specific error tags, detection signals, tips |

## What Gets Generated

### Constructs (from Batch 3)
- Stored in `exam_constructs` table
- Each exam can have different cognitive constructs
- Default 5: C.ATTENTION, C.SPEED, C.REASONING, C.COMPUTATION, C.READING
- Can be extended for specific exams (e.g., C.SPATIAL for architecture exams)

### Error Tags (from Batch 4)
- Stored in `tags` table with `exam_id`
- Exam-specific codes (e.g., ERR.UTBK.SIGN_ERROR)
- Include tips and remediation from research
- Detection signals for automatic tagging

## Data Flow

```
[Research Pipeline]
       │
       ▼
┌─────────────────┐    ┌─────────────────┐
│ exam_constructs │    │      tags       │
│   (constructs)  │    │  (error_tags)   │
└────────┬────────┘    └────────┬────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│          Analytics Dashboard            │
│  - ConstructRadarChart (dynamic)        │
│  - ErrorPatternAnalysis (dynamic)       │
└─────────────────────────────────────────┘
```

## Components Updated for Adaptivity

### `ConstructRadarChart.tsx`
- Supports dynamic number of constructs
- Fetches construct info from `exam_constructs` table
- Falls back to default constructs if no research data

### `ErrorPatternAnalysis.tsx`
- Fetches error tag metadata from `tags` table
- Tips and descriptions come from research, not hardcoded
- Falls back to generic tips if no research data

### `lib/analytics/exam-config.ts`
- Helper functions to fetch exam-specific configuration
- `getExamConstructs(examId)` - Get constructs for an exam
- `getExamErrorTags(examId)` - Get error tags for an exam
- `getExamConfig(examId)` - Get full configuration

## Database Tables

### `exam_constructs`
```sql
- exam_id: UUID (references exams)
- code: TEXT (e.g., 'C.ATTENTION')
- name: TEXT (e.g., 'Attention & Accuracy')
- short_name: TEXT (e.g., 'Teliti')
- description: TEXT
- icon: TEXT (emoji)
- color: TEXT (CSS class)
- improvement_tips: JSONB
```

### `tags` (extended)
```sql
- exam_id: UUID (null = global, set = exam-specific)
- source: TEXT ('manual', 'research', 'ai')
- tips: JSONB (improvement tips array)
- remediation: JSONB (short and detailed remediation)
- prevalence: JSONB (per content area prevalence)
```

## Adding a New Exam

1. Create exam record in `exams` table
2. Run research pipeline (Admin > Exam Research)
3. Wait for all 4 batches to complete
4. Platform automatically uses exam-specific data

## Backwards Compatibility

- Old snapshots with hardcoded construct keys still work
- Default constructs provided as fallback
- Generic error tags work if no exam-specific tags exist

## Configuration Check

Run this SQL to verify exam is fully configured:

```sql
SELECT * FROM exam_configuration_status;
```

Returns:
- `construct_count` - Number of constructs for this exam
- `error_tag_count` - Number of error tags for this exam
- `configuration_status` - 'ready' or 'incomplete'
