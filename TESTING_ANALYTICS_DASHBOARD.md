# Analytics Dashboard Testing Guide

## Overview
This guide covers end-to-end testing of the student analytics dashboard.

---

## Test Flow

### **1. Prerequisites**
- [ ] User account with student role
- [ ] At least 10-20 completed question attempts
- [ ] Questions linked to taxonomy nodes
- [ ] Baseline module completion (optional but recommended)

### **2. Data Generation Test**

**Attempt Submission Flow:**
```
Student practices question →
Submit attempt (via submit_attempt edge function) →
Analytics updated (process_attempt_analytics RPC) →
Mastery calculated →
Constructs updated →
Snapshot generated (manual or automatic)
```

**Verify:**
- [ ] Attempts recorded in `attempts` table
- [ ] `user_skill_state` updated with mastery scores
- [ ] `user_construct_state` updated with construct scores
- [ ] Error tags applied correctly (SLOW, RUSHED, CARELESS, STRUGGLE)

### **3. Snapshot Generation Test**

**Manual Generation:**
```typescript
// Call from analytics page "Refresh Analytics" button
supabase.functions.invoke("generate_snapshot", {
  body: { scope: "checkpoint" }
})
```

**Automatic Generation:**
- Baseline completion triggers `full_baseline` snapshot
- Can also trigger `daily` snapshot via cron

**Verify:**
- [ ] Snapshot created in `analytics_snapshots` table
- [ ] Contains all required fields:
  - `coverage` (subject percentages)
  - `readiness` (0-100 score)
  - `radar` (cognitive level mastery)
  - `constructs` (5 construct scores)
  - `top_weak_skills` (array of skills)
  - `top_error_tags` (array of error patterns)

### **4. Analytics Dashboard Display Test**

**Navigate to `/analytics`**

**Empty State Test:**
- [ ] New user with no attempts → Shows "No Analytics Available Yet"
- [ ] "Generate Analytics Now" button works
- [ ] Clear messaging about what to do next

**Data Display Test:**
- [ ] **Readiness Score Component**
  - Circular progress indicator renders
  - Score displays correctly (0-100)
  - Status badge shows (Excellent/Ready/Developing/Not Ready)
  - Breakdown metrics display
  - Colors match status

- [ ] **Construct Radar Chart**
  - Pentagon shape renders correctly
  - All 5 constructs labeled with icons
  - Data polygon fills pentagon
  - Grid levels visible
  - Legend shows status badges
  - Scores match snapshot data

- [ ] **Coverage Map**
  - All subjects listed
  - Progress bars show correct percentages
  - Colors coded correctly (green >70%, yellow 30-70%, red <30%)
  - Status badges display
  - Summary stats accurate

- [ ] **Weak Skills List**
  - Top 5 skills displayed (if applicable)
  - Ranked by priority (#1, #2, etc)
  - Mastery percentages accurate
  - Progress bars render
  - "Practice Now" buttons work
  - Recommendations section visible

- [ ] **Error Pattern Analysis**
  - Error tags listed with counts
  - Accordions expand/collapse
  - Tips display for each error type
  - Progress indicators show impact
  - Icons and colors match error types
  - General strategies section visible

### **5. Interaction Test**

- [ ] **Refresh Button**
  - Click "Refresh Analytics"
  - Loading state shows
  - New snapshot generated
  - Dashboard updates with new data
  - Toast notification appears

- [ ] **Practice Now Buttons**
  - Click from weak skills
  - Navigates to practice/drill page
  - Focus parameter passed correctly

- [ ] **Responsive Design**
  - Desktop: 2-column layout works
  - Mobile: Single column stacks
  - Touch interactions smooth
  - Bottom navigation accessible

### **6. Edge Cases Test**

- [ ] **Partial Data**
  - Only 1-2 subjects: Coverage map handles gracefully
  - No weak skills: Shows positive message
  - No error tags: Shows positive message
  - Empty constructs: Falls back to defaults

- [ ] **Extreme Values**
  - Readiness score = 0: Displays "Not Ready"
  - Readiness score = 100: Displays "Excellent"
  - Coverage = 0% for subject: Shows red
  - Mastery = 0%: Shows "Critical" priority

- [ ] **Error Handling**
  - Network failure: Error message displayed
  - Invalid snapshot data: Graceful degradation
  - Missing fields: Falls back to defaults
  - API timeout: Retry option shown

### **7. Performance Test**

- [ ] Initial page load < 3 seconds
- [ ] Snapshot generation < 5 seconds
- [ ] Smooth animations (no jank)
- [ ] No memory leaks on refresh
- [ ] Charts render without flickering

---

## Test Scenarios

### **Scenario A: New Student**
1. Create account
2. Navigate to /analytics
3. See empty state
4. Click "Generate Analytics Now"
5. See message about needing practice first
6. Navigate to practice
7. Complete 5 questions
8. Return to /analytics
9. Generate snapshot
10. See partial data (low coverage, default constructs)

### **Scenario B: Active Student**
1. User has 50+ attempts
2. Navigate to /analytics
3. See full dashboard with all components
4. Readiness score shows realistic value (40-80)
5. Radar chart shows varied construct scores
6. Coverage map shows progress
7. Weak skills identified correctly
8. Error patterns show real mistakes

### **Scenario C: Advanced Student**
1. User has 200+ attempts
2. High mastery across multiple skills
3. Navigate to /analytics
4. Readiness score 80+
5. Most subjects green (>70% coverage)
6. Few or no weak skills
7. Error patterns minimal
8. Positive encouragement messages

### **Scenario D: Baseline Completion**
1. Complete all baseline checkpoints
2. Snapshot auto-generated with scope "full_baseline"
3. Navigate to /analytics
4. See comprehensive baseline data
5. Coverage across all baseline topics
6. Weak areas identified from baseline
7. Constructs calibrated from baseline

---

## Database Queries for Verification

### Check Snapshot Exists
```sql
SELECT * FROM analytics_snapshots
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 1;
```

### Check User Skill State
```sql
SELECT tn.name, uss.mastery, uss.attempt_count
FROM user_skill_state uss
JOIN taxonomy_nodes tn ON tn.id = uss.taxonomy_node_id
WHERE uss.user_id = '<user_id>'
ORDER BY uss.mastery ASC
LIMIT 10;
```

### Check Construct State
```sql
SELECT * FROM user_construct_state
WHERE user_id = '<user_id>';
```

### Check Recent Attempts
```sql
SELECT COUNT(*),
       SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
FROM attempts
WHERE user_id = '<user_id>'
AND attempted_at >= NOW() - INTERVAL '7 days';
```

### Check Error Tags
```sql
SELECT t.name, COUNT(*) as count
FROM attempt_error_tags aet
JOIN attempts a ON a.id = aet.attempt_id
JOIN tags t ON t.id = aet.tag_id
WHERE a.user_id = '<user_id>'
AND a.attempted_at >= NOW() - INTERVAL '30 days'
GROUP BY t.name
ORDER BY count DESC;
```

---

## Known Issues / Limitations

1. **Snapshot Staleness**: Snapshot not auto-refreshed, user must click refresh
2. **Practice Now Links**: Currently navigate to locked-in mode, not specific skill drill
3. **Loading States**: Generic spinner, need skeleton loaders (Task #29)
4. **Error Recovery**: Basic error handling, need retry mechanisms (Task #31)
5. **Caching**: No client-side caching, regenerates on every refresh (Task #30)

---

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Data displays accurately
✅ Responsive design works
✅ Performance acceptable
✅ Edge cases handled gracefully
✅ User can understand and act on insights

---

## Next Steps After Testing

1. Fix any bugs discovered
2. Implement Task #29: Loading skeletons
3. Implement Task #30: Performance optimization
4. Implement Task #31: Better error handling
5. Gather user feedback
6. Iterate on UX improvements
