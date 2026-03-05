# Gaspol - System Architecture

## Overview

Gaspol is a comprehensive UTBK (Indonesian university entrance exam) preparation platform featuring adaptive learning, deep analytics, and personalized study plans.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Soft Neubrutalism design system
- **UI Components**: shadcn/ui with custom variants
- **State Management**: Zustand (state machine) + React Query (server state)
- **Charts**: Recharts

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno (TypeScript)
- **Storage**: Supabase Storage (for images)

### AI Integration
- **Provider**: Anthropic Claude API
- **Use Cases**: Content generation, auto-tagging, QC, summaries

## System Architecture

```
┌─────────────────────────────────────────────┐
│           Next.js Frontend (App Router)      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Student  │  │  Admin   │  │   Auth   │  │
│  │  Portal  │  │ Console  │  │  Pages   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│            Supabase Backend                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │PostgreSQL│  │   Auth   │  │  Storage │  │
│  │ + RLS    │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
│  Edge Functions:                             │
│  • submit_attempt (scoring & analytics)      │
│  • finalize_baseline_module                  │
│  • generate_plan (adaptive algorithm)        │
│  • admin_content_ops (AI operations)         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         Anthropic Claude API                 │
│  • Content generation                        │
│  • Auto-tagging                              │
│  • Quality control                           │
└─────────────────────────────────────────────┘
```

## Data Model

### Core Entities

**Users & State**
- `profiles` - User data (extends auth.users)
- `user_state` - State machine tracking
- `user_skill_state` - Per-micro-skill performance
- `user_construct_state` - Five-construct profile

**Content Taxonomy**
- `taxonomy_nodes` - Hierarchical (subject → micro-skill)
- `questions` - Question bank (MCQ5, MCK-Table, Fill-in)
- `modules` - Question collections
- `baseline_modules` - Baseline checkpoints

**Assessment & Analytics**
- `attempts` - User answers with error tags
- `module_completions` - Completed modules
- `analytics_snapshots` - Point-in-time analytics

**Planning**
- `plan_cycles` - Generated study plans
- `plan_tasks` - Individual tasks
- `recycle_checkpoints` - Targeted re-assessments

## User Journey

### 1. Onboarding
```
Signup → Select Package (7/14/21/30 days) →
Set Time Budget → Enter Target University
```

### 2. Baseline Assessment
```
View Module Hub → Take Assessment (QuestionRunner) →
Submit Answers → View Partial Analytics
```

### 3. Plan Generation
```
Complete All Baseline Modules → View Full Analytics →
Generate Plan (adaptive algorithm) → View Task List
```

### 4. Study Execution
```
Complete Tasks (Drills/Mocks) → Track Progress →
Unlock Re-cycle → Take Checkpoint → View Delta Analytics
```

### 5. Re-cycle Loop
```
Checkpoint Shows Improvement → Generate Next Cycle →
Repeat Until Exam Day
```

## State Machine

User progresses through phases:

```
ONBOARDING
    ↓
BASELINE_ASSESSMENT_IN_PROGRESS
    ↓
BASELINE_COMPLETE
    ↓
PLAN_ACTIVE
    ↓
RECYCLE_UNLOCKED
    ↓
RECYCLE_ASSESSMENT_IN_PROGRESS
    ↓ (loop)
PLAN_ACTIVE (next cycle)
```

## Core Algorithms

### Readiness Score
```
readiness =
  accuracy × 0.4 +
  speed_index × 0.25 +
  stability × 0.20 +
  coverage × 0.15
```

### Plan Generation
1. Read latest analytics snapshot
2. Identify weak skills (accuracy < 60%)
3. Calculate task count (3-7 based on time budget)
4. Generate balanced mix:
   - Focused drills (weak areas)
   - Mixed drills (variety)
   - Mock tests (exam simulation)
   - Flashcards (quick review)
   - Review (past mistakes)

### Error Tag Derivation
Rules-based system:
- Too fast + wrong → "ceroboh" (careless)
- Too slow + wrong → "konsep_lemah" (weak concept)
- Easy + wrong → "fundamental_gap"
- L3 + wrong → "analytical_weakness"

## Security

### Row Level Security (RLS)
- Students: Can only access own data
- Admins: Full access to content, read-only to student data
- Service role: Used only in Edge Functions

### Authentication
- Supabase Auth (email/password)
- JWT tokens for API calls
- Middleware for route protection

## Performance Optimizations

- **Indexes**: Composite indexes on foreign keys
- **Partial indexes**: For common filtered queries
- **Caching**: React Query for client-side caching
- **Pagination**: For large lists (questions, attempts)

## Mobile-First Design

- Bottom navigation for mobile
- Touch-friendly UI (48px minimum touch targets)
- Responsive layouts (Tailwind breakpoints)
- Horizontal scrolling for carousels
- Swipe gestures (Taktis mode)

## Deployment

### Supabase
1. Create project on Supabase
2. Run migrations
3. Deploy Edge Functions
4. Configure RLS policies

### Next.js
1. Deploy to Vercel/Netlify
2. Set environment variables
3. Configure domain

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL
```

## Future Enhancements

- WebSocket for real-time updates
- Offline mode with PWA
- Mobile apps (React Native)
- Video explanations
- Collaborative study groups
- Gamification & leaderboards

---

Built with ❤️ for Indonesian students
