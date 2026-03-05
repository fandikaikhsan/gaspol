# 02 — Delta Matrix

> Feature-by-feature gap analysis: SoT Requirements → Current State → Gap → Remediation

---

## Legend

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| ✅     | Implemented and aligned with SoT           |
| 🟡     | Partially implemented — needs modification |
| ❌     | Not implemented — must build               |
| ⚠️     | Implemented but diverges from SoT          |

---

## 1. Data Model Deltas

| #   | SoT Requirement                                             | Current State                             | Status | Gap Description                                              | Files Affected                                   |
| --- | ----------------------------------------------------------- | ----------------------------------------- | ------ | ------------------------------------------------------------ | ------------------------------------------------ |
| D01 | `profiles.exam_date` (DATE)                                 | `profiles.package_days` (7/14/21/30 enum) | ⚠️     | Blueprint needs actual exam date; current uses package tiers | Migration, `onboarding/page.tsx`, Edge Functions |
| D02 | `profiles.default_exam_date` from admin                     | Not present                               | ❌     | Admin sets default exam date via research                    | Migration, admin UI                              |
| D03 | `questions.difficulty_level` (L1/L2/L3)                     | `questions.difficulty` (easy/medium/hard) | ⚠️     | Different naming; no point mapping                           | Migration, admin UI, QuestionRunner              |
| D04 | `questions.point_value` (generated: L1→1, L2→2, L3→5)       | Not present                               | ❌     | No point calculation on answers                              | Migration                                        |
| D05 | `user_skill_state.total_points`                             | `user_skill_state.mastery_level` (enum)   | ⚠️     | Completely different tracking model — enum vs numeric        | Migration, submit-attempt, analytics             |
| D06 | `user_skill_state.is_covered` (total_points ≥ 20)           | Not present                               | ❌     | No coverage concept exists                                   | Migration (generated column)                     |
| D07 | `user_skill_state.l1_correct/l2_correct/l3_correct`         | Not present                               | ❌     | No per-difficulty tracking                                   | Migration                                        |
| D08 | `material_cards` table                                      | Not present                               | ❌     | Entire Material Card content system missing                  | Migration, admin CRUD, student UI                |
| D09 | `campus_scores` table                                       | Not present                               | ❌     | No campus/university score comparison                        | Migration, admin CRUD, analytics                 |
| D10 | `modules.pass_threshold`                                    | Not present (hardcoded or absent)         | ❌     | 70% threshold not configurable per module                    | Migration                                        |
| D11 | `attempts.points_awarded`                                   | Not present                               | ❌     | No point tracking per attempt                                | Migration                                        |
| D12 | `taxonomy_nodes.id` as TEXT code (e.g. `UTBK26.TPS.PU.001`) | UUID                                      | ⚠️     | Blueprint prefers human-readable taxonomy codes              | Migration (high risk)                            |

---

## 2. Onboarding Deltas

| #   | SoT Requirement                         | Current State                           | Status | Gap Description                                 | Files Affected                       |
| --- | --------------------------------------- | --------------------------------------- | ------ | ----------------------------------------------- | ------------------------------------ |
| O01 | Calendar picker for exam_date           | Dropdown with package_days (7/14/21/30) | ⚠️     | Need date picker, auto-calculate days remaining | `onboarding/page.tsx`                |
| O02 | Target university (searchable dropdown) | Not present                             | ❌     | Requires `campus_scores` table first            | `onboarding/page.tsx`, campus_scores |
| O03 | Target major input                      | Not present                             | ❌     | Optional field, depends on campus_scores        | `onboarding/page.tsx`                |
| O04 | Daily time budget (minutes)             | Not present                             | ❌     | Time budget influences plan generation          | `onboarding/page.tsx`, profiles      |
| O05 | Admin default exam date                 | Not present                             | ❌     | Pre-fill from exam metadata                     | Admin UI, `onboarding/page.tsx`      |

---

## 3. Baseline Assessment Deltas

| #   | SoT Requirement                                   | Current State                          | Status | Gap Description                                             | Files Affected                           |
| --- | ------------------------------------------------- | -------------------------------------- | ------ | ----------------------------------------------------------- | ---------------------------------------- |
| B01 | Test ALL level-5 micro-skills                     | Modules test by topic/subtopic         | 🟡     | Coverage validation needed — are all L5 skills in baseline? | Admin baseline builder                   |
| B02 | Immediate profile update on each answer           | Batch update on module finalize only   | ⚠️     | Must update `user_skill_state` per answer, not per module   | `submit-attempt/route.ts`, Edge Function |
| B03 | Point-based scoring (L1→1, L2→2, L3→5)            | No point system                        | ❌     | Core scoring model completely missing                       | `submit-attempt`, `user_skill_state`     |
| B04 | Show partial analytics after each module          | Not implemented                        | ❌     | Need inline analytics card post-finalize                    | `baseline/[moduleId]/page.tsx`           |
| B05 | 70% pass threshold on finalize                    | No threshold check                     | ❌     | `finalize-baseline-module` has no pass/fail                 | `finalize-baseline-module/route.ts`      |
| B06 | "Generate Plan" locked until all modules complete | Button exists but gating logic unclear | 🟡     | Verify `GatedCTAButton` logic                               | `plan/page.tsx`, `GatedCTAButton.tsx`    |

---

## 4. QuestionRunner Deltas

| #   | SoT Requirement                                      | Current State                                               | Status | Gap Description                              | Files Affected                            |
| --- | ---------------------------------------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------- | ----------------------------------------- |
| Q01 | 5 question types: MCQ5, MCQ4, MCK-Table, TF, Fill-in | MCQ5, MCK-Table implemented; MCQ4 partial, TF/Fill-in stubs | 🟡     | MCQ4, TF, Fill-in not fully functional       | `QuestionRunner.tsx`, `AnswerOptions.tsx` |
| Q02 | Timer per question                                   | Not present                                                 | ❌     | No countdown timer UI or logic               | `QuestionRunner.tsx`                      |
| Q03 | Navigation (prev/next/review later)                  | Basic next only                                             | 🟡     | No prev, no "review later" flag              | `QuestionRunner.tsx`                      |
| Q04 | Answer persistence (resume on disconnect)            | Uses `window.confirm` for exit; no persistence              | ❌     | Answers lost on page refresh                 | `QuestionRunner.tsx`                      |
| Q05 | Submit single answer → immediate profile update      | Batch submission on finalize                                | ⚠️     | Must change to per-question submission model | `submit-attempt/route.ts`                 |
| Q06 | Fill-in question UI                                  | `FillInInput.tsx` exists but minimal                        | 🟡     | Needs validation, keyboard handling          | `FillInInput.tsx`                         |
| Q07 | `TableOptions.tsx` for MCK format                    | Exists and functional                                       | ✅     | —                                            | —                                         |

---

## 5. Plan System Deltas

| #   | SoT Requirement                                      | Current State                                    | Status | Gap Description                                 | Files Affected                          |
| --- | ---------------------------------------------------- | ------------------------------------------------ | ------ | ----------------------------------------------- | --------------------------------------- |
| P01 | Generate 5 tasks targeting uncovered skills (<20pts) | Plan generates tasks but coverage unclear        | 🟡     | Verify plan generation targets uncovered skills | `generate-plan/route.ts`, Edge Function |
| P02 | Timeline view (baseline → tasks → recycle)           | `ProgressHeader.tsx` exists                      | 🟡     | Needs visual timeline with all 3 phases         | `plan/page.tsx`, `ProgressHeader.tsx`   |
| P03 | Day counter + exam countdown                         | Not present                                      | ❌     | Requires `exam_date` in profiles                | `plan/page.tsx`                         |
| P04 | Readiness ring vs campus target                      | `ReadinessRing.tsx` exists, no campus comparison | 🟡     | Need `campus_scores` integration                | `ReadinessRing.tsx`, analytics          |
| P05 | Task card with clear locked/unlocked states          | `TaskCard.tsx` exists                            | 🟡     | Verify visual states match design spec          | `TaskCard.tsx`                          |

---

## 6. Navigation Deltas

| #   | SoT Requirement                                | Current State                              | Status | Gap Description                                                 | Files Affected                        |
| --- | ---------------------------------------------- | ------------------------------------------ | ------ | --------------------------------------------------------------- | ------------------------------------- |
| N01 | 4 tabs: Plan, Drill, Review, Analytics         | 4 tabs: Plan, Locked-In, Taktis, Analytics | ⚠️     | Wrong tab names and routes                                      | `BottomNav.tsx`, `SideNav.tsx`        |
| N02 | `/drill` route                                 | `/locked-in` route                         | ⚠️     | Route rename needed                                             | `app/(student)/locked-in/` → `drill/` |
| N03 | `/review` route                                | `/taktis` route (flashcard-only)           | ⚠️     | Route rename + complete rebuild for topic tree + Material Cards | `app/(student)/taktis/` → `review/`   |
| N04 | Desktop: Side rail                             | `SideNav.tsx` exists                       | 🟡     | Verify responsive switching at lg breakpoint                    | `SideNav.tsx`                         |
| N05 | Top header 56px with back button               | `TopNav.tsx` exists                        | 🟡     | Verify height and back button behavior                          | `TopNav.tsx`                          |
| N06 | Admin sidebar (72px collapsed, 240px expanded) | Admin layout exists                        | 🟡     | Verify dimensions                                               | `app/admin/layout.tsx`                |

---

## 7. Drill System Deltas

| #    | SoT Requirement                                       | Current State                       | Status | Gap Description                   | Files Affected                           |
| ---- | ----------------------------------------------------- | ----------------------------------- | ------ | --------------------------------- | ---------------------------------------- |
| DR01 | `/drill` page: list all modules                       | `/locked-in/page.tsx` lists modules | ⚠️     | Route wrong; rename to `/drill`   | `locked-in/page.tsx` → `drill/page.tsx`  |
| DR02 | Required tasks highlighted/pinned at top              | Not observed                        | ❌     | Need to filter and pin plan tasks | New drill page logic                     |
| DR03 | Filter: All / Required / Completed                    | Not present                         | ❌     | Filter tabs needed                | Drill page                               |
| DR04 | Pass (≥70%) or fail with Material Card review + retry | No pass/fail; no Material Card flow | ❌     | Entire post-module flow missing   | QuestionRunner results, Material Card UI |
| DR05 | Module card: title, topic, count, time, status        | Basic module cards exist            | 🟡     | Verify all fields present         | Module card component                    |

---

## 8. Material Card System Deltas (NEW)

| #   | SoT Requirement                                                    | Current State                                   | Status | Gap Description                         | Files Affected                            |
| --- | ------------------------------------------------------------------ | ----------------------------------------------- | ------ | --------------------------------------- | ----------------------------------------- |
| M01 | `material_cards` table                                             | Not present                                     | ❌     | Entire table missing                    | Migration                                 |
| M02 | Material Card component (Core Idea, Key Facts, Mistakes, Examples) | `FlashcardStack.tsx` exists (different concept) | ❌     | Need dedicated `MaterialCard.tsx`       | `components/review/MaterialCard.tsx`      |
| M03 | `/review` page with topic tree                                     | `/taktis` has flashcard stack only              | ❌     | Complete rebuild required               | `app/(student)/review/page.tsx`           |
| M04 | `/review/[skillId]` for Material Card detail                       | Not present                                     | ❌     | Detail route missing                    | `app/(student)/review/[skillId]/page.tsx` |
| M05 | Admin Material Card management                                     | Not present                                     | ❌     | CRUD + AI generation + publish workflow | `app/admin/materials/page.tsx`            |
| M06 | AI batch generation of Material Cards                              | Not present                                     | ❌     | Edge Function + admin UI                | Edge Function, admin page                 |
| M07 | Material Cards accessible from analytics weak skills               | Not integrated                                  | ❌     | Link from `WeakSkillsList.tsx`          | `WeakSkillsList.tsx`                      |
| M08 | Material Cards shown on module fail                                | Not present                                     | ❌     | Post-fail review flow                   | QuestionRunner/results page               |

---

## 9. Review Page Deltas (NEW)

| #   | SoT Requirement                                   | Current State | Status | Gap Description                    | Files Affected                  |
| --- | ------------------------------------------------- | ------------- | ------ | ---------------------------------- | ------------------------------- |
| R01 | Level-4 subtopic list, expandable                 | Not present   | ❌     | Topic tree UI needed               | `app/(student)/review/page.tsx` |
| R02 | Level-5 micro-skills with coverage status (✅/❌) | Not present   | ❌     | Requires `is_covered` field        | Review page + user_skill_state  |
| R03 | Current points display (X/20)                     | Not present   | ❌     | Requires `total_points` field      | Review page                     |
| R04 | Click micro-skill → open Material Card            | Not present   | ❌     | Navigation to Material Card detail | Review page routing             |
| R05 | Progress per subtopic (X/Y skills covered)        | Not present   | ❌     | Aggregation query needed           | Review page                     |

---

## 10. Analytics Deltas

| #   | SoT Requirement                                      | Current State                                       | Status | Gap Description                       | Files Affected                       |
| --- | ---------------------------------------------------- | --------------------------------------------------- | ------ | ------------------------------------- | ------------------------------------ |
| A01 | Readiness Score formula: Coverage×0.7 + Progress×0.3 | `readiness-score.ts` defines formula but unused     | 🟡     | Wire up to actual analytics           | `readiness-score.ts`, analytics page |
| A02 | Readiness vs target campus                           | No campus comparison                                | ❌     | Requires `campus_scores` table        | Analytics page                       |
| A03 | Coverage Map by subtopic                             | `CoverageMap.tsx` exists                            | 🟡     | Verify it uses point-based coverage   | `CoverageMap.tsx`                    |
| A04 | Construct Radar Chart                                | `ConstructRadarChart.tsx` exists                    | ✅     | Works (verify 5 dimensions match SoT) | `ConstructRadarChart.tsx`            |
| A05 | Weak Skills with Material Card links                 | `WeakSkillsList.tsx` exists, no Material Card links | 🟡     | Add navigation to Material Cards      | `WeakSkillsList.tsx`                 |
| A06 | Error Pattern Analysis                               | `ErrorPatternAnalysis.tsx` exists                   | ✅     | Works (verify construct names)        | `ErrorPatternAnalysis.tsx`           |
| A07 | Historical progress chart                            | Not present                                         | ❌     | Time-series data needed               | Analytics page                       |
| A08 | Delta analytics (before/after recycle)               | `DeltaAnalyticsCard.tsx` exists                     | 🟡     | Verify it compares snapshots          | `DeltaAnalyticsCard.tsx`             |

---

## 11. Recycle Phase Deltas

| #    | SoT Requirement                           | Current State                   | Status | Gap Description                  | Files Affected              |
| ---- | ----------------------------------------- | ------------------------------- | ------ | -------------------------------- | --------------------------- |
| RC01 | `/recycle` route                          | `app/(student)/recycle/` exists | ✅     | Route present                    | —                           |
| RC02 | Targeted modules for weak skills (<20pts) | Unclear targeting logic         | 🟡     | Verify recycle module generation | Recycle page, Edge Function |
| RC03 | Delta analytics                           | `DeltaAnalyticsCard.tsx`        | 🟡     | Verify snapshot comparison works | Delta card, snapshots       |
| RC04 | "Generate Next Plan" after recycle        | Not observed                    | ❌     | Loop back to plan generation     | Recycle page                |

---

## 12. Real-Time Profile Update Deltas

| #    | SoT Requirement                                 | Current State                   | Status | Gap Description                          | Files Affected                           |
| ---- | ----------------------------------------------- | ------------------------------- | ------ | ---------------------------------------- | ---------------------------------------- |
| RT01 | `submit-attempt` updates `user_skill_state`     | No skill state update on submit | ❌     | Critical gap — core adaptive loop broken | `submit-attempt/route.ts`, Edge Function |
| RT02 | `submit-attempt` updates `user_construct_state` | No construct update on submit   | ❌     | Constructs not recalculated              | `submit-attempt/route.ts`, Edge Function |
| RT03 | `submit-attempt` derives error tags             | No error tag derivation         | ❌     | Rule-based error pattern missing         | `submit-attempt/route.ts`, Edge Function |
| RT04 | Coverage check on every update                  | No coverage concept             | ❌     | Depends on D05, D06                      | —                                        |
| RT05 | Real-time Supabase subscriptions                | Not implemented                 | ❌     | No live data push to client              | Client-side subscription                 |

---

## 13. Campus Score Deltas (NEW)

| #    | SoT Requirement                    | Current State | Status | Gap Description               | Files Affected              |
| ---- | ---------------------------------- | ------------- | ------ | ----------------------------- | --------------------------- |
| CS01 | `campus_scores` table              | Not present   | ❌     | Table + RLS missing           | Migration                   |
| CS02 | Admin CRUD page `/admin/campus`    | Not present   | ❌     | Full admin page needed        | `app/admin/campus/page.tsx` |
| CS03 | AI-assisted research               | Not present   | ❌     | Edge Function for AI research | Edge Function               |
| CS04 | Student readiness vs campus target | Not present   | ❌     | Analytics comparison          | Analytics page              |

---

## 14. Admin Deltas

| #    | SoT Requirement                              | Current State                     | Status | Gap Description                     | Files Affected                   |
| ---- | -------------------------------------------- | --------------------------------- | ------ | ----------------------------------- | -------------------------------- |
| AD01 | Admin role-based auth guard                  | No role check on admin API routes | ❌     | Anyone can call admin APIs          | All admin API routes, middleware |
| AD02 | `/admin/materials` page                      | Not present                       | ❌     | Material Card management            | New admin page                   |
| AD03 | `/admin/campus` page                         | Not present                       | ❌     | Campus score management             | New admin page                   |
| AD04 | AI operation logging (tokens/cost)           | `ai_runs` table + page exists     | ✅     | Already tracking AI operations      | —                                |
| AD05 | Question QC review queue                     | Not present                       | ❌     | Publish workflow for questions      | Admin questions page             |
| AD06 | Material Card publish workflow               | Not present                       | ❌     | Review + publish for Material Cards | Admin materials page             |
| AD07 | Baseline builder with L5 coverage validation | Basic baseline page exists        | 🟡     | Verify micro-skill coverage check   | Admin baseline page              |
| AD08 | Diagnostics auto-fix                         | Broken endpoint                   | ⚠️     | Fix diagnostic troubleshooting      | Admin diagnostics                |

---

## 15. Design / UI Deltas

| #    | SoT Requirement                                              | Current State                                 | Status | Gap Description                              | Files Affected                           |
| ---- | ------------------------------------------------------------ | --------------------------------------------- | ------ | -------------------------------------------- | ---------------------------------------- |
| UI01 | Soft Neubrutalism (2px border, 4px shadow, 16px radius)      | `design-tokens.ts` defines tokens (321 lines) | ⚠️     | Tokens not connected to Tailwind config      | `design-tokens.ts`, `tailwind.config.ts` |
| UI02 | Surface colors per context (yellow=baseline, sky=plan, etc.) | Tokens defined but usage inconsistent         | 🟡     | Audit component usage of context colors      | All page components                      |
| UI03 | 44px touch targets                                           | Not verified                                  | 🟡     | Audit interactive elements                   | All interactive components               |
| UI04 | Celebration confetti on module pass                          | Not present                                   | ❌     | Animation + trigger                          | QuestionRunner results                   |
| UI05 | Points fly-up animation on correct answer                    | Not present                                   | ❌     | Animation component                          | QuestionRunner                           |
| UI06 | Skeleton loading (never blank screens)                       | Not consistently applied                      | 🟡     | Audit loading states                         | All pages                                |
| UI07 | Empty states with illustration + action                      | Not consistently applied                      | 🟡     | Audit empty states                           | All list pages                           |
| UI08 | `database.types.ts` only types 2 tables                      | Should type all 25+ tables                    | ⚠️     | Auto-generate from Supabase CLI              | `database.types.ts`                      |
| UI09 | TanStack React Query for server state                        | Installed but not used anywhere               | ⚠️     | All data fetching is raw `fetch`/`useEffect` | All data-fetching components             |
| UI10 | KaTeX math rendering                                         | Not present                                   | ❌     | Required for math questions                  | QuestionDisplay, MaterialCard            |
| UI11 | i18n coverage (EN + ID)                                      | 10 namespaces, partial coverage               | 🟡     | Audit translation completeness               | `lib/i18n/locales/`                      |

---

## 16. Cross-Cutting / Infrastructure Deltas

| #   | SoT Requirement                        | Current State                   | Status | Gap Description                      | Files Affected         |
| --- | -------------------------------------- | ------------------------------- | ------ | ------------------------------------ | ---------------------- |
| X01 | Testing (unit + integration)           | Zero test files                 | ❌     | No test infrastructure               | New test setup         |
| X02 | CI/CD pipeline                         | Not present                     | ❌     | No automated build/deploy            | GitHub Actions         |
| X03 | Error boundary with recovery           | `ErrorBoundary.tsx` exists      | 🟡     | Verify all routes wrapped            | Layout files           |
| X04 | Middleware guards all 6 phases         | Guards only 2 phases            | ⚠️     | Incomplete phase enforcement         | `middleware.ts`        |
| X05 | `plan/page.tsx` monolithic (726 lines) | Single file, N+1 queries        | ⚠️     | Must decompose + optimize            | `plan/page.tsx`        |
| X06 | Client-rendered student layout         | `"use client"` on entire layout | ⚠️     | Loses server-side rendering benefits | `(student)/layout.tsx` |

---

## Summary Statistics

| Status       | Count  | Percentage |
| ------------ | ------ | ---------- |
| ✅ Aligned   | 5      | 5%         |
| 🟡 Partial   | 24     | 26%        |
| ❌ Missing   | 47     | 51%        |
| ⚠️ Divergent | 16     | 17%        |
| **Total**    | **92** | **100%**   |

> **Key takeaway:** 51% of SoT requirements are completely unimplemented, with the most critical gaps in the **point-based coverage system (D05-D07, B03, RT01-RT04)**, **Material Card system (M01-M08)**, and **Campus scores (CS01-CS04)**. Only 5% of features are fully aligned with the blueprint.
