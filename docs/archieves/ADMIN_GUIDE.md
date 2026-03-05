# Admin Guide - Gaspol Content Management

## Overview

This guide covers content creation and management workflows for the Gaspol platform.

## Access Admin Console

1. Sign up with an email
2. Update your role in Supabase:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. Navigate to `/admin`

## Content Hierarchy

### Taxonomy Structure
```
Subject (Level 1)
  └─ Subtest (Level 2)
      └─ Topic (Level 3)
          └─ Subtopic (Level 4)
              └─ Micro-skill (Level 5)
```

**Example:**
```
Penalaran Umum (PU)
  └─ Matematika
      └─ Aljabar
          └─ Persamaan Linear
              └─ Solving Linear Equations
```

## Creating Content

### 1. Build Taxonomy

**Navigation**: Admin → Taxonomy

1. Create subject (e.g., "Penalaran Umum")
2. Add subtests under subject
3. Add topics under subtests
4. Add subtopics under topics
5. Add micro-skills under subtopics

**Micro-skills** are where questions are tagged.

### 2. Create Questions

**Navigation**: Admin → Questions → New Question

**Required Fields:**
- Micro-skill (select from taxonomy)
- Difficulty (easy/medium/hard)
- Cognitive Level (L1/L2/L3)
- Question Format (MCQ5, MCK-Table, Fill-in)
- Stem (question text)
- Options (answers)
- Correct Answer
- Explanation

**Construct Weights:**
Assign weights (0-1) to five constructs:
- **Teliti** (careful) - attention to detail
- **Speed** - time efficiency
- **Reasoning** - logical thinking
- **Computation** - mathematical calculation
- **Reading** - text comprehension

Total should sum to ~1.0.

**Example:**
```json
{
  "teliti": 0.3,
  "speed": 0.2,
  "reasoning": 0.2,
  "computation": 0.2,
  "reading": 0.1
}
```

### 3. Compose Modules

**Navigation**: Admin → Modules → New Module

1. Select module type (baseline, drill_focus, drill_mixed, mock)
2. Add questions (drag-and-drop interface)
3. Set time limit (optional)
4. Set passing threshold
5. Publish module

### 4. Configure Baseline

**Navigation**: Admin → Baseline

1. Create baseline modules (5-8 recommended)
2. Set checkpoint order (1, 2, 3...)
3. Mark as required/optional
4. Activate baseline modules

Students will complete these in order before plan generation.

## AI Operations

### Content Generation

Use AI to generate questions:

1. Go to Admin → AI Runs
2. Click "Generate Questions"
3. Provide:
   - Micro-skill ID
   - Number of questions
   - Difficulty distribution
4. Review generated questions
5. Edit and publish

### Auto-Tagging

Automatically tag questions with construct weights:

1. Select questions without weights
2. Click "Auto-Tag"
3. AI analyzes question content
4. Review and approve tags

### Quality Control (QC)

Run QC on questions:

1. Select questions for review
2. Click "Run QC"
3. AI checks for:
   - Clarity of stem
   - Answer correctness
   - Explanation quality
   - Appropriate difficulty
4. Review flagged issues
5. Edit and re-publish

## Best Practices

### Question Writing

1. **Clear Stems**: Question should be unambiguous
2. **Plausible Distractors**: Wrong answers should be tempting
3. **Detailed Explanations**: Help students learn
4. **Appropriate Difficulty**: Match cognitive level

### Module Composition

1. **Balanced Difficulty**: Mix easy/medium/hard
2. **Varied Formats**: Include different question types
3. **Appropriate Length**: 10-15 questions for drills, 30-40 for mocks
4. **Time Limits**: ~1-2 minutes per question

### Baseline Configuration

1. **Coverage**: Test all major subtopics
2. **Quick Modules**: 5-10 questions each
3. **Logical Order**: Start easy, increase difficulty
4. **Total Time**: 30-60 minutes for all modules

## Student Data

### Viewing Analytics

Navigate to user profiles to see:
- Readiness scores
- Construct profiles
- Skill mastery levels
- Attempt history

**Note**: Admins have read-only access to student data for privacy.

## Troubleshooting

### Questions Not Appearing

1. Check question status is "published"
2. Verify micro-skill exists in taxonomy
3. Check module status is "published"

### Module Not in Baseline

1. Check baseline_modules table has entry
2. Verify is_active = true
3. Check checkpoint_order is unique

### Plan Not Generating

1. Ensure all baseline modules complete
2. Check analytics_snapshots has data
3. Verify user profile has package_days set

## Maintenance Tasks

### Weekly
- Review new questions
- Check AI run logs for errors
- Monitor student feedback

### Monthly
- Update baseline modules
- Refresh question pool
- Analyze platform metrics

---

For technical support, contact the development team.
