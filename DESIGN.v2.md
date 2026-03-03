# GASPOL DESIGN SYSTEM v2

## Complete UI/UX Guidelines for AI Code Generation

> **Purpose**: This document is the authoritative design reference for building Gaspol's adaptive learning platform. It provides comprehensive specifications for visual design, interaction patterns, and user experience flows optimized for the target user persona.

---

## 1. User Psychology & Design Principles

### 1.1 Target User Persona

**Primary User: Indonesian High School Student (17-19 years old)**

| Attribute           | Details                                            |
| ------------------- | -------------------------------------------------- |
| **Context**         | Preparing for UTBK (university entrance exam)      |
| **Time Pressure**   | Limited days until exam (countdown anxiety)        |
| **Emotional State** | Anxious, overwhelmed, seeking reassurance          |
| **Device Usage**    | 80%+ mobile, often studying in bed or transit      |
| **Session Pattern** | Short bursts (10-20 min), frequent returns         |
| **Motivation**      | Goal-oriented (target university), fear of failure |
| **Tech Literacy**   | High - native digital users, familiar with apps    |

### 1.2 Psychological Design Principles

**Reduce Anxiety, Build Confidence**

- Use warm, calming colors (pastels over harsh primaries)
- Show progress prominently - users need to see they're moving forward
- Celebrate small wins frequently (not just big milestones)
- Avoid red for negative states; use softer alternatives

**Combat Overwhelm**

- One clear action per screen
- Progressive disclosure - hide complexity until needed
- Clear visual hierarchy - users should know where to look first
- Chunked content - never show a wall of text

**Support Focus & Flow**

- Minimize distractions during assessments (clean UI, no ads)
- Consistent navigation so users never feel lost
- Quick transitions - don't break mental flow with slow loads

**Build Trust Through Transparency**

- Always show "why" - why this task? why this score?
- Honest progress indicators (no fake gamification)
- Clear data attribution (where does this info come from?)

### 1.3 Core Design Values

```
CLARITY > CLEVERNESS
Progress should be immediately understandable

CALM > EXCITEMENT
Reassurance over hype for anxious test-takers

EFFICIENCY > BEAUTY
Every pixel should serve the learning goal

ENCOURAGEMENT > JUDGMENT
Show growth potential, not just deficits
```

---

## 2. Visual Language: Soft Neubrutalism

### 2.1 Design DNA

**"Soft Neubrutalism / Friendly Dashboard"**

A blend of:

- **Neubrutalism's bold structure**: Strong borders, offset shadows, clear shapes
- **Soft/friendly aesthetic**: Rounded corners, pastel colors, warm accents
- **Dashboard clarity**: Card-based layouts, clear data visualization

The result feels **modern, playful, trustworthy** - like a friend helping you study, not a cold testing system.

### 2.2 Design Tokens

```typescript
// SPACING SCALE (8px base unit)
const spacing = {
  "2xs": "4px", // Tight elements
  xs: "8px", // Compact spacing
  sm: "12px", // Default gap
  md: "16px", // Section padding
  lg: "24px", // Card padding
  xl: "32px", // Section gaps
  "2xl": "48px", // Page sections
  "3xl": "64px", // Major divisions
}

// RADIUS SCALE
const radius = {
  sm: "8px", // Small buttons, chips
  md: "12px", // Inputs, small cards
  lg: "16px", // Standard cards
  xl: "24px", // Large cards, modals
  "2xl": "32px", // Feature cards
  full: "9999px", // Pills, avatars
}

// BORDER
const border = {
  width: "2px",
  color: "#2D3748", // charcoal
}

// SHADOWS (offset style for neubrutalism)
const shadows = {
  soft: "3px 3px 0px rgba(45, 55, 72, 0.08)",
  card: "4px 4px 0px rgba(45, 55, 72, 0.12)",
  elevated: "6px 6px 0px rgba(45, 55, 72, 0.15)",
  pressed: "2px 2px 0px rgba(45, 55, 72, 0.08)",
}

// TRANSITIONS
const transitions = {
  fast: "100ms ease-out",
  normal: "200ms ease-out",
  smooth: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
}
```

---

## 3. Color System

### 3.1 Core Palette

```typescript
const colors = {
  // BASE
  background: {
    primary: "#FAFAF9", // Off-white (main bg)
    secondary: "#F5F5F4", // Light gray (section bg)
    elevated: "#FFFFFF", // Pure white (cards)
  },

  // INK (Text & Borders)
  ink: {
    primary: "#1A1A1A", // Near-black (headings)
    secondary: "#4A5568", // Dark gray (body text)
    tertiary: "#718096", // Medium gray (captions)
    disabled: "#A0AEC0", // Light gray (disabled)
    inverse: "#FFFFFF", // White (on dark backgrounds)
  },

  border: {
    default: "#2D3748", // Charcoal (card borders)
    subtle: "#E2E8F0", // Light gray (dividers)
    focus: "#4A90D9", // Blue (focus rings)
  },

  // PASTEL SURFACES (Card backgrounds by context)
  surface: {
    yellow: "#FEF3C7", // Warm yellow - baseline, warmth
    lavender: "#E9D5FF", // Soft purple - analytics, insights
    sky: "#DBEAFE", // Light blue - plan, progress
    mint: "#D1FAE5", // Soft green - success, covered
    peach: "#FECACA", // Soft coral - attention needed
    cream: "#FEF9EF", // Warm cream - material cards
  },

  // SEMANTIC COLORS
  primary: {
    DEFAULT: "#F97316", // Warm coral/orange (CTAs)
    hover: "#EA580C", // Darker on hover
    active: "#C2410C", // Darkest on press
    subtle: "#FFF7ED", // Very light orange bg
  },

  success: {
    DEFAULT: "#22C55E", // Green
    soft: "#DCFCE7", // Light green bg
    text: "#15803D", // Dark green text
  },

  warning: {
    DEFAULT: "#F59E0B", // Amber
    soft: "#FEF3C7", // Light amber bg
    text: "#B45309", // Dark amber text
  },

  error: {
    DEFAULT: "#EF4444", // Red (use sparingly)
    soft: "#FEE2E2", // Light red bg
    text: "#DC2626", // Dark red text
  },

  info: {
    DEFAULT: "#3B82F6", // Blue
    soft: "#DBEAFE", // Light blue bg
    text: "#1D4ED8", // Dark blue text
  },

  // DARK MODE (for dark cards/panels)
  dark: {
    surface: "#1E293B", // Slate-800
    elevated: "#334155", // Slate-700
    text: "#F1F5F9", // Slate-100
  },
}
```

### 3.2 Color Usage Guidelines

| Context              | Background       | Border          | Text         |
| -------------------- | ---------------- | --------------- | ------------ |
| **Baseline modules** | surface.yellow   | border.default  | ink.primary  |
| **Plan/tasks**       | surface.sky      | border.default  | ink.primary  |
| **Analytics**        | surface.lavender | border.default  | ink.primary  |
| **Material cards**   | surface.cream    | border.default  | ink.primary  |
| **Success/covered**  | success.soft     | success.DEFAULT | success.text |
| **Needs attention**  | warning.soft     | warning.DEFAULT | warning.text |
| **Featured/promo**   | dark.surface     | none            | dark.text    |
| **Primary CTA**      | primary.DEFAULT  | none            | ink.inverse  |

### 3.3 Accessibility Requirements

| Requirement            | Specification                                        |
| ---------------------- | ---------------------------------------------------- |
| **Contrast Ratio**     | Minimum 4.5:1 for body text, 3:1 for large text      |
| **Focus Indicators**   | 2px solid border.focus with 2px offset               |
| **Color Independence** | Never use color alone to convey info; add icons/text |
| **Touch Targets**      | Minimum 44×44px for all interactive elements         |

---

## 4. Typography

### 4.1 Font Stack

```typescript
const fonts = {
  // Primary: Rounded, friendly sans-serif
  sans: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',

  // Fallback
  mono: '"JetBrains Mono", "Fira Code", monospace',
}
```

**Why Plus Jakarta Sans?**

- Rounded letterforms feel friendly and approachable
- Excellent readability on mobile
- Good weight variety for hierarchy
- Free and widely supported

### 4.2 Type Scale

```typescript
const typography = {
  // DISPLAY (Hero sections, very large)
  "display-lg": {
    size: "48px",
    lineHeight: "1.1",
    weight: "800",
    tracking: "-0.02em",
  },
  display: {
    size: "36px",
    lineHeight: "1.2",
    weight: "800",
    tracking: "-0.02em",
  },

  // HEADINGS
  h1: {
    size: "28px",
    lineHeight: "1.25",
    weight: "700",
    tracking: "-0.01em",
  },
  h2: {
    size: "24px",
    lineHeight: "1.3",
    weight: "700",
    tracking: "-0.01em",
  },
  h3: {
    size: "20px",
    lineHeight: "1.35",
    weight: "600",
    tracking: "0",
  },
  h4: {
    size: "18px",
    lineHeight: "1.4",
    weight: "600",
    tracking: "0",
  },

  // BODY
  "body-lg": {
    size: "18px",
    lineHeight: "1.6",
    weight: "400",
    tracking: "0",
  },
  body: {
    size: "16px",
    lineHeight: "1.6",
    weight: "400",
    tracking: "0",
  },
  "body-sm": {
    size: "14px",
    lineHeight: "1.5",
    weight: "400",
    tracking: "0",
  },

  // UTILITY
  caption: {
    size: "12px",
    lineHeight: "1.4",
    weight: "500",
    tracking: "0.02em",
  },
  overline: {
    size: "11px",
    lineHeight: "1.3",
    weight: "600",
    tracking: "0.08em",
    transform: "uppercase",
  },
  button: {
    size: "15px",
    lineHeight: "1",
    weight: "600",
    tracking: "0.01em",
  },
  label: {
    size: "14px",
    lineHeight: "1",
    weight: "500",
    tracking: "0",
  },
}
```

### 4.3 Typography Best Practices

```
✓ Maximum line length: 65 characters for body text
✓ Paragraph spacing: 1.5x line height
✓ Use sentence case for most text; Title Case for nav only
✓ Math/equations: Use KaTeX with proper vertical alignment
✓ Indonesian language: Ensure proper diacritic support
✓ Numbers: Use tabular figures in tables/scores
```

---

## 5. Component Library

### 5.1 Cards

The card is the fundamental building block. All content lives in cards.

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │   ← 4px offset shadow
│ │                                     │ │
│ │  padding: 16-24px                   │ │   ← 2px border, charcoal
│ │  border-radius: 16px                │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Card Variants:**

| Variant            | Usage              | Background       | Shadow          |
| ------------------ | ------------------ | ---------------- | --------------- |
| `default`          | Standard content   | white            | shadow-card     |
| `surface-yellow`   | Baseline content   | surface.yellow   | shadow-card     |
| `surface-sky`      | Plan/tasks         | surface.sky      | shadow-card     |
| `surface-lavender` | Analytics          | surface.lavender | shadow-card     |
| `surface-mint`     | Success/completed  | surface.mint     | shadow-card     |
| `surface-cream`    | Material cards     | surface.cream    | shadow-card     |
| `dark`             | Featured/spotlight | dark.surface     | shadow-elevated |
| `flat`             | Nested/subtle      | transparent      | none            |
| `interactive`      | Clickable          | white            | lifts on hover  |

**Card States:**

```typescript
// Interactive card hover/press
const cardInteraction = {
  default: {
    transform: "translateY(0)",
    shadow: "shadow-card",
  },
  hover: {
    transform: "translateY(-2px)",
    shadow: "shadow-elevated",
    transition: "transitions.fast",
  },
  active: {
    transform: "translateY(0)",
    shadow: "shadow-pressed",
  },
}
```

### 5.2 Buttons

**Primary Button (CTA)**

```
┌──────────────────────────┐
│    Continue →            │  bg: primary.DEFAULT
└──────────────────────────┘  border-radius: 12px
                              height: 48px (mobile), 44px (desktop)
                              font: button
                              shadow: 3px 3px 0 rgba(0,0,0,0.1)
```

**Button Variants:**

| Variant     | Usage                 | Appearance                            |
| ----------- | --------------------- | ------------------------------------- |
| `primary`   | Main CTA              | Coral/orange, white text              |
| `secondary` | Alternative action    | White, charcoal border, charcoal text |
| `ghost`     | Tertiary action       | Transparent, charcoal text            |
| `danger`    | Destructive action    | Red background (use rarely)           |
| `success`   | Positive confirmation | Green background                      |

**Button Sizes:**

| Size | Height | Padding   | Font |
| ---- | ------ | --------- | ---- |
| `sm` | 36px   | 12px 16px | 14px |
| `md` | 44px   | 12px 20px | 15px |
| `lg` | 52px   | 16px 24px | 16px |

**Button States:**

```typescript
const buttonStates = {
  default: { scale: 1, opacity: 1 },
  hover: { scale: 1.02, brightness: 1.05 },
  active: { scale: 0.98, brightness: 0.95 },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
  loading: { opacity: 0.7, cursor: "wait" }, // show spinner
}
```

### 5.3 Chips/Pills

Used for filters, tags, and status indicators.

**Chip Variants:**

| Variant  | Active State          | Inactive State              |
| -------- | --------------------- | --------------------------- |
| `filter` | Dark fill, white text | White fill, charcoal border |
| `status` | Semantic color bg     | Light gray bg               |
| `tag`    | No active state       | White/gray with border      |

```
┌─────────────┐  ┌─────────────┐
│  Active ●   │  │  Inactive   │
└─────────────┘  └─────────────┘
   bg: ink.primary       bg: white
   text: ink.inverse     border: border.default
   height: 32px          text: ink.secondary
   padding: 0 12px
   border-radius: full
```

### 5.4 Progress Indicators

**Points Progress (X/20 points)**

```
Skill Name                    [12/20 pts]
┌─────────────────────────────────────────┐
│████████████████░░░░░░░░░░░░░░░░░░░░░░░░│  60% fill
└─────────────────────────────────────────┘
height: 8px, radius: full
background: border.subtle
fill: gradient(primary.DEFAULT → success.DEFAULT as approaches 20)
```

**Readiness Ring**

```
        ╭────────╮
      ╱            ╲
     │      72%     │    Circular progress
     │   Readiness  │    stroke-width: 8px
      ╲            ╱     colors: primary gradient
        ╰────────╯
      vs Target: 85%
```

**Coverage Progress (Subtopic)**

```
Aljabar                              [3/8 skills]
┌─────────────────────────────────────────┐
│ ✓ ✓ ✓ ○ ○ ○ ○ ○                        │
└─────────────────────────────────────────┘
✓ = covered (≥20pts), ○ = uncovered
```

**Timeline Progress**

```
   ●━━━━━●━━━━━●━━━━━○━━━━━○
   ↑     ↑     ↑     ↑     ↑
 Start  Day   Day   Day   Exam
       3     8     15    Day

Active step: filled primary color
Completed: filled success color
Upcoming: hollow gray
```

### 5.5 Navigation Components

**Bottom Navigation (Mobile)**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   📋       📚        📖       📊                    │
│  Plan     Drill    Review  Analytics               │
│   ●                                                │ ← Active indicator
└─────────────────────────────────────────────────────┘
height: 64px + safe-area-bottom
active: primary.DEFAULT pill background behind icon+label
icons: outline style when inactive, filled when active
```

**Top Header**

```
┌─────────────────────────────────────────────────────┐
│  ←  Module Title                        💡 🔔      │
└─────────────────────────────────────────────────────┘
height: 56px
back button: shown on detail pages
actions: contextual icons (help, notifications)
```

**Side Navigation (Admin/Desktop)**

```
┌────────┐
│  Logo  │
├────────┤
│  📊    │ ← Icon + active pill
│  📝    │
│  📚    │
│  ⚙️    │
├────────┤
│  👤    │
└────────┘
width: 72px (collapsed), 240px (expanded)
```

### 5.6 Form Elements

**Text Input**

```
Label
┌─────────────────────────────────────────┐
│ Placeholder text...                     │
└─────────────────────────────────────────┘
Helper text or error message

height: 48px
border: 2px border.default (focus: border.focus)
radius: 12px
padding: 12px 16px
```

**States:**

- Default: border.subtle
- Focus: border.focus + subtle shadow
- Error: error.DEFAULT border + error.text message
- Disabled: background.secondary, opacity 0.6

**Select/Dropdown**

```
┌─────────────────────────────────────────┐
│ Selected value                        ▼ │
└─────────────────────────────────────────┘
```

**Calendar Picker (for Exam Date)**

```
┌─────────────────────────────────────────┐
│         ◀  March 2026  ▶               │
├─────────────────────────────────────────┤
│  Su  Mo  Tu  We  Th  Fr  Sa            │
│   1   2   3   4   5   6   7            │
│   8   9  10  [11] 12  13  14           │ ← Selected date
│  15  16  17  18  19  20  21            │
│  22  23  24  25  26  27  28            │
│  29  30  31                            │
└─────────────────────────────────────────┘
Selected date: primary.DEFAULT bg with pill shape
Today: subtle border indicator
Disabled dates: opacity 0.3
```

### 5.7 Feedback Components

**Toast Notifications**

```
┌───────────────────────────────────────────┐
│ ✓  Module completed! +15 points           │
└───────────────────────────────────────────┘
position: bottom-center, above bottom nav
duration: 3-4 seconds
animation: slide up + fade in
variants: success (green left border), error (red), info (blue)
```

**Empty States**

```
┌─────────────────────────────────────────┐
│                                         │
│           📚                            │
│     (illustration)                      │
│                                         │
│   No modules completed yet              │  ← h3
│   Start with baseline to build          │  ← body, ink.tertiary
│   your learning profile                 │
│                                         │
│   [ Start Baseline ]                    │  ← primary button
│                                         │
└─────────────────────────────────────────┘
Always provide: illustration, title, description, action
```

**Loading States**

```
Card skeleton:
┌─────────────────────────────────────────┐
│ ███████████████░░░░░░                   │ ← shimmer animation
│ █████████████████████████░░░░░          │
│ ████████░░░░░░░░                        │
└─────────────────────────────────────────┘

Spinner (for buttons/inline):
○╮  ← circular, 20px, stroke: 2px
 ╰○    animation: rotate 1s linear infinite
```

**Error States**

```
┌─────────────────────────────────────────┐
│  ⚠ Something went wrong                 │
│                                         │
│  We couldn't load your data.            │
│  This might be a temporary issue.       │
│                                         │
│  [ Try Again ]  [ Contact Support ]     │
└─────────────────────────────────────────┘
tone: apologetic, not blaming user
always offer: retry option, support contact
```

---

## 6. Animation & Motion

### 6.1 Animation Principles

```
PURPOSE > DECORATION
Every animation should aid comprehension or provide feedback

FAST > SLOW
Users are studying; don't waste their time

SUBTLE > FLASHY
Avoid distracting from content

CONSISTENT > VARIED
Same animation for same action type
```

### 6.2 Timing Guidelines

| Action Type     | Duration | Easing      |
| --------------- | -------- | ----------- |
| Button press    | 100ms    | ease-out    |
| Card hover      | 150ms    | ease-out    |
| Page transition | 200ms    | ease-in-out |
| Modal open      | 250ms    | spring      |
| Modal close     | 200ms    | ease-in     |
| Toast appear    | 300ms    | spring      |
| Progress fill   | 600ms    | ease-out    |
| Celebration     | 800ms    | spring      |

### 6.3 Core Animations

**Micro-interactions:**

```typescript
// Button press
press: {
  scale: 0.98,
  duration: 100,
  easing: 'ease-out',
}

// Card lift on hover
cardHover: {
  translateY: -2,
  shadow: 'shadow-elevated',
  duration: 150,
  easing: 'ease-out',
}

// Checkbox/toggle
toggle: {
  scale: [1, 1.2, 1],
  duration: 200,
  easing: 'spring',
}
```

**Page Transitions:**

```typescript
// Navigate forward
pageEnter: {
  opacity: [0, 1],
  translateX: [20, 0],
  duration: 200,
}

// Navigate back
pageExit: {
  opacity: [1, 0],
  translateX: [0, -20],
  duration: 150,
}

// Tab switch (no slide, just fade)
tabSwitch: {
  opacity: [0, 1],
  duration: 150,
}
```

**Progress Animations:**

```typescript
// Points awarded
pointsAward: {
  // Number flies up and fades
  translateY: [0, -20],
  opacity: [1, 0],
  scale: [1, 1.2],
  duration: 600,
}

// Progress bar fill
progressFill: {
  width: ['0%', 'targetWidth'],
  duration: 800,
  easing: 'ease-out',
  delay: 200, // wait for element to mount
}

// Skill covered celebration
skillCovered: {
  // Checkmark appears with bounce
  scale: [0, 1.2, 1],
  opacity: [0, 1, 1],
  duration: 400,
  easing: 'spring',
}
```

**Celebration Moments:**

```typescript
// Module passed
modulePassed: {
  // Confetti burst (use lightweight library like canvas-confetti)
  confetti: {
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
  },
  // Success checkmark
  checkmark: {
    scale: [0, 1.5, 1],
    rotate: [0, -10, 10, 0],
    duration: 600,
  },
}

// Cycle completed
cycleComplete: {
  // More elaborate celebration
  confetti: {
    particleCount: 100,
    spread: 120,
    colors: ['#22C55E', '#F97316', '#3B82F6'],
  },
}
```

---

## 7. Screen-by-Screen Specifications

### 7.1 Onboarding Flow

**Screen 1: Welcome**

```
┌─────────────────────────────────────┐
│                                     │
│        🎯                           │
│     (Mascot/Logo)                   │
│                                     │
│   "Persiapan UTBK yang             │
│    personal untukmu"               │
│                                     │
│   Adaptive learning yang           │
│   menyesuaikan dengan              │
│   kemampuanmu                      │
│                                     │
│   [ Mulai Persiapan ]              │
│                                     │
│        ● ○ ○ ○                     │
└─────────────────────────────────────┘
```

**Screen 2: Exam Date (Critical)**

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│   📅 Kapan ujianmu?                │
│                                     │
│   Pilih tanggal UTBK untuk         │
│   menghitung waktu persiapanmu     │
│                                     │
│   ┌───────────────────────────┐    │
│   │    < Mei 2026 >           │    │
│   │  ─────────────────────    │    │
│   │  Su Mo Tu We Th Fr Sa     │    │
│   │          1  2  3  4  5    │    │
│   │   6  7  8  9 10 11 12     │    │
│   └───────────────────────────┘    │
│                                     │
│   Kamu punya 67 hari               │
│   untuk persiapan! 💪              │
│                                     │
│   [ Lanjut ]                       │
│        ● ● ○ ○                     │
└─────────────────────────────────────┘
Highlight: Show calculated days immediately on date selection
```

**Screen 3: Time Budget**

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│   ⏰ Berapa lama bisa belajar      │
│      setiap hari?                  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │                             │  │
│   │   [ 30 ] [ 60 ] [90] [120]  │  │
│   │          menit/hari         │  │
│   │                             │  │
│   └─────────────────────────────┘  │
│                                     │
│   💡 30 menit = 2-3 modul/hari    │
│                                     │
│   [ Lanjut ]                       │
│        ● ● ● ○                     │
└─────────────────────────────────────┘
Preset options as large tap targets
```

**Screen 4: Target University (Optional)**

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│   🎓 Mau masuk kampus mana?        │
│                                     │
│   Kami akan membandingkan          │
│   kesiapanmu dengan skor target    │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ 🔍 Cari universitas...      │  │
│   └─────────────────────────────┘  │
│                                     │
│   Pilihan populer:                 │
│   ┌─────────────────────────────┐  │
│   │ • UI - Universitas Indonesia│  │
│   │ • ITB - Institut Teknologi..│  │
│   │ • UGM - Universitas Gadjah..│  │
│   └─────────────────────────────┘  │
│                                     │
│   [ Lewati dulu ]  [ Lanjut ]      │
│        ● ● ● ●                     │
└─────────────────────────────────────┘
Searchable dropdown with popular options shown
```

### 7.2 Plan Page (Timeline Hub)

**With Baseline in Progress:**

```
┌─────────────────────────────────────────────────────┐
│  Gaspol                              Profile   🔔   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Hari ke-5 • H-62 menuju ujian              │   │
│  │  ━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━○     │   │
│  │  Start                               Ujian  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ BASELINE ─────────────────────── 2/5 ──────┐   │
│  │                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │ ✓ Aljabar    │  │ ✓ Geometri   │        │   │  ← Scrollable
│  │  │   15 soal    │  │   12 soal    │        │   │
│  │  └──────────────┘  └──────────────┘        │   │
│  │  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │ → Statistik  │  │   Verbal     │        │   │
│  │  │   10 soal    │  │   15 soal    │        │   │
│  │  └──────────────┘  └──────────────┘        │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ GENERATE PLAN ─────────────────────── 🔒 ───┐   │
│  │                                              │   │
│  │  Selesaikan semua baseline dulu             │   │
│  │  untuk membuka rencana belajarmu            │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│   📋       📚        📖       📊                    │
│  Plan     Drill    Review  Analytics               │
└─────────────────────────────────────────────────────┘
```

**With Active Plan:**

```
┌─────────────────────────────────────────────────────┐
│  Gaspol                              Profile   🔔   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─── READINESS ───────────────────────────────┐   │
│  │                                              │   │
│  │     ╭────────╮                              │   │
│  │   ╱    72%    ╲    vs Target: 85%           │   │
│  │  │   Readiness │    UI - Teknik Informatika │   │
│  │   ╲           ╱                              │   │
│  │     ╰────────╯     [ Lihat Detail ]         │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ TUGAS CYCLE 1 ─────────────────── 2/5 ─────┐   │
│  │                                              │   │
│  │  ✓  Aljabar Dasar          selesai          │   │
│  │  ✓  Geometri Bidang        selesai          │   │
│  │  →  Statistika             3/10 soal        │   │
│  │  ○  Penalaran Verbal                        │   │
│  │  ○  Reading Comprehension                   │   │
│  │                                              │   │
│  │  [ Lanjutkan Statistika ]                   │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ RECYCLE ───────────────────────────── 🔒 ───┐   │
│  │  Selesaikan semua tugas untuk membuka       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│   📋       📚        📖       📊                    │
│  (●)     Drill    Review  Analytics               │
└─────────────────────────────────────────────────────┘
```

### 7.3 Drill Page

```
┌─────────────────────────────────────────────────────┐
│  ←  Drill                                    🔍     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ [ Semua ] [ Tugas ]  [ Selesai ]              │ │  ← Filter chips
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📌 TUGAS WAJIB                                    │
│                                                     │
│  ┌──────────────────────────────────── 🟡 ─────┐   │
│  │  Statistika Dasar                            │   │
│  │  10 soal • ~15 menit • 3/10 selesai         │   │
│  │  ████████░░░░░░░░░░░░░░░░░░░░░ 30%          │   │
│  │                           [ Lanjutkan → ]    │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Penalaran Verbal                            │   │
│  │  12 soal • ~18 menit                        │   │
│  │                              [ Mulai → ]     │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  📚 MODUL LAINNYA                                  │
│                                                     │
│  ┌──────────────────────────────────── ✓ ──────┐   │
│  │  Aljabar Dasar              Nilai: 85%       │   │
│  │  15 soal • selesai                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│   📋       📚        📖       📊                    │
│  Plan    (●)      Review  Analytics               │
└─────────────────────────────────────────────────────┘
```

### 7.4 QuestionRunner (Assessment)

```
┌─────────────────────────────────────────────────────┐
│  ← Statistika                    Soal 3/10    ⏱ 2:34│
├─────────────────────────────────────────────────────┤
│  ███████████████░░░░░░░░░░░░░░░░░ 30%              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Diketahui data: 5, 7, 3, 9, 6                     │
│                                                     │
│  Berapakah nilai rata-rata dari                    │
│  data tersebut?                                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  A.  5                                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  ●  B.  6                                   │   │  ← Selected
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  C.  7                                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  D.  8                                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○  E.  9                                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ◀ Sebelumnya          Selanjutnya ▶        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

Timer: Show remaining time, turns orange at 25%, red at 10%
Progress bar: Shows question progress
Exit confirmation: "Yakin keluar? Progress akan tersimpan."
```

**Module Result - Passed:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                   🎉                                │
│                                                     │
│             MODUL SELESAI!                         │
│                                                     │
│                 85%                                 │
│              ████████████████████░░                 │
│            (Lulus: min. 70%)                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📊 Performa                                │   │
│  │  Benar: 17/20                               │   │
│  │  Waktu: 12:34                               │   │
│  │  +85 poin skill                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Skills yang meningkat:                            │
│  ✓ Mean & Median  [18 → 20/20 pts] COVERED! 🎯    │
│  ✓ Simpangan Baku [12 → 17/20 pts]                │
│                                                     │
│  [ Kembali ke Plan ]                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Module Result - Failed:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                   💪                                │
│                                                     │
│           HAMPIR LULUS!                            │
│                                                     │
│                 62%                                 │
│              ████████████████░░░░░░                 │
│            (Perlu: min. 70%)                       │
│                                                     │
│  Sebelum coba lagi, pelajari konsep:              │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📖 Simpangan Baku           [ Buka ]       │   │
│  │  📖 Distribusi Normal        [ Buka ]       │   │
│  │  📖 Kuartil                  [ Buka ]       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [ Pelajari Dulu ]       [ Coba Lagi ]             │
│                                                     │
└─────────────────────────────────────────────────────┘

Tone: Encouraging, not judgmental
"Hampir!" not "Gagal!"
Show specific concepts to study
```

### 7.5 Review Page

```
┌─────────────────────────────────────────────────────┐
│  Review                                      🔍     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Pilih topik untuk melihat materi                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▼ Aljabar                        3/8 skills │  │
│  │   ─────────────────────────────────────────  │  │
│  │   ❌ SPLDV                    12/20 pts 📖  │  │
│  │   ❌ Persamaan Kuadrat        8/20 pts  📖  │  │
│  │   ✅ Fungsi Linear            23/20 pts     │  │
│  │   ❌ Pertidaksamaan           15/20 pts 📖  │  │
│  │   ✅ Barisan Aritmatika       21/20 pts     │  │
│  │   ❌ Barisan Geometri         5/20 pts  📖  │  │
│  │   ❌ Logaritma                3/20 pts  📖  │  │
│  │   ❌ Eksponen                 0/20 pts  📖  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶ Geometri                       5/6 skills │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶ Statistika                     2/5 skills │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ▶ Penalaran Verbal               1/7 skills │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│   📋       📚        📖       📊                    │
│  Plan     Drill    (●)     Analytics               │
└─────────────────────────────────────────────────────┘

Legend:
❌ = uncovered (<20 pts), show 📖 icon to open material card
✅ = covered (≥20 pts), green checkmark
Progress shown as X/20 pts
```

### 7.6 Material Card View

```
┌─────────────────────────────────────────────────────┐
│  ←  SPLDV                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Progress: 12/20 pts                         │  │
│  │  ████████████████░░░░░░░░░░░░░░░░░░          │  │
│  │  Butuh 8 poin lagi untuk menguasai          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────── 💡 IDE UTAMA ────────────────────────┐  │
│  │                                              │  │
│  │  SPLDV (Sistem Persamaan Linear Dua         │  │
│  │  Variabel) adalah sistem yang terdiri       │  │
│  │  dari dua persamaan linear dengan dua       │  │
│  │  variabel (x dan y).                        │  │
│  │                                              │  │
│  │  Solusinya adalah nilai x dan y yang        │  │
│  │  memenuhi kedua persamaan secara            │  │
│  │  bersamaan.                                 │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────── 📋 FAKTA PENTING ────────────────────┐  │
│  │                                              │  │
│  │  • Metode penyelesaian: Substitusi,         │  │
│  │    Eliminasi, atau Grafik                   │  │
│  │  • Solusi bisa berupa: satu titik,          │  │
│  │    tidak ada, atau tak hingga banyak        │  │
│  │  • Bentuk umum: ax + by = c                 │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────── ⚠️ KESALAHAN UMUM ───────────────────┐  │
│  │                                              │  │
│  │  • Salah tanda saat melakukan eliminasi     │  │
│  │  • Lupa substitusi balik untuk              │  │
│  │    mendapatkan variabel kedua               │  │
│  │  • Keliru menentukan variabel mana          │  │
│  │    yang harus dieliminasi                   │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────── 📝 CONTOH SOAL ──────────────────────┐  │
│  │                                              │  │
│  │  Diketahui:                                 │  │
│  │  2x + y = 7                                 │  │
│  │  x - y = 2                                  │  │
│  │                                              │  │
│  │  Penyelesaian (Eliminasi):                  │  │
│  │  2x + y + x - y = 7 + 2                     │  │
│  │  3x = 9                                     │  │
│  │  x = 3                                      │  │
│  │                                              │  │
│  │  Substitusi ke persamaan 2:                 │  │
│  │  3 - y = 2                                  │  │
│  │  y = 1                                      │  │
│  │                                              │  │
│  │  ✓ Solusi: (3, 1)                          │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘

Background: surface.cream
Sections: Collapsible accordion style, all expanded by default
Math: Use KaTeX for proper equation rendering
```

### 7.7 Analytics Page

```
┌─────────────────────────────────────────────────────┐
│  Analytics                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─── READINESS SCORE ─────────────────────────┐   │
│  │                                              │   │
│  │        ╭────────────╮                       │   │
│  │      ╱       72%      ╲                     │   │
│  │     │    Readiness     │                    │   │
│  │      ╲                ╱                     │   │
│  │        ╰────────────╯                       │   │
│  │                                              │   │
│  │     Target: UI - Teknik Informatika         │   │
│  │     Skor dibutuhkan: 85%                    │   │
│  │     Gap: -13%                               │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── COGNITIVE PROFILE ───────────────────────┐   │
│  │                                              │   │
│  │           Attention                         │   │
│  │              68                              │   │
│  │           ╱      ╲                          │   │
│  │    Reading        Speed                     │   │
│  │       62    ●────●   72                     │   │
│  │           ╲      ╱                          │   │
│  │        Computation                          │   │
│  │           78                                │   │
│  │              ↓                              │   │
│  │          Reasoning                          │   │
│  │             65                              │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── COVERAGE BY TOPIC ───────────────────────┐   │
│  │                                              │   │
│  │  Aljabar        ████████░░░░ 3/8            │   │
│  │  Geometri       ██████████░░ 5/6            │   │
│  │  Statistika     ████░░░░░░░░ 2/5            │   │
│  │  Verbal         ██░░░░░░░░░░ 1/7            │   │
│  │  Reading        ████████░░░░ 4/6            │   │
│  │                                              │   │
│  │  Total: 15/32 skills covered (47%)          │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── FOCUS AREAS (Top 5 Weak) ────────────────┐   │
│  │                                              │   │
│  │  1. Silogisme           5/20 pts  [ 📖 ]    │   │
│  │  2. Logaritma           3/20 pts  [ 📖 ]    │   │
│  │  3. Eksponen            0/20 pts  [ 📖 ]    │   │
│  │  4. Reading HOTS        8/20 pts  [ 📖 ]    │   │
│  │  5. Persamaan Kuadrat   8/20 pts  [ 📖 ]    │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│   📋       📚        📖       📊                    │
│  Plan     Drill    Review   (●)                    │
└─────────────────────────────────────────────────────┘

Charts: Use Recharts library
Radar chart: 5 constructs with filled area
Bar chart: Horizontal bars with skill coverage counts
```

### 7.8 Delta Analytics (Post-Recycle)

```
┌─────────────────────────────────────────────────────┐
│  Recycle Complete                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                 🎉                                  │
│          Cycle 1 Selesai!                          │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │  PENINGKATAN READINESS                       │  │
│  │                                              │  │
│  │     62%   →   71%                           │  │
│  │    Sebelum    Sesudah                       │  │
│  │                                              │  │
│  │         ↑ +9%                               │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  PERUBAHAN KONSTRUK                          │  │
│  │                                              │  │
│  │  Attention      55 → 68    ↑ +13            │  │
│  │  Speed          70 → 72    ↑ +2             │  │
│  │  Reasoning      58 → 65    ↑ +7             │  │
│  │  Computation    65 → 78    ↑ +13            │  │
│  │  Reading        60 → 62    ↑ +2             │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  SKILLS BARU DIKUASAI                        │  │
│  │                                              │  │
│  │  ✅ Mean & Median                           │  │
│  │  ✅ Fungsi Linear                           │  │
│  │  ✅ Barisan Aritmatika                      │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [ Generate Plan Cycle 2 ]                         │
│                                                     │
└─────────────────────────────────────────────────────┘

Celebration: Confetti animation on load
Numbers: Animate counting up
Arrows: Color coded (green for improvement)
```

---

## 8. Responsive Design

### 8.1 Breakpoints

```typescript
const breakpoints = {
  sm: "640px", // Large phones
  md: "768px", // Tablets
  lg: "1024px", // Small laptops
  xl: "1280px", // Desktops
  "2xl": "1536px", // Large desktops
}
```

### 8.2 Mobile-First Patterns

**Layout Transformations:**

| Component  | Mobile         | Tablet        | Desktop         |
| ---------- | -------------- | ------------- | --------------- |
| Navigation | Bottom tabs    | Bottom tabs   | Side rail       |
| Cards      | Stack vertical | 2-column grid | 3-4 column grid |
| Charts     | Full width     | Full width    | Half width      |
| Forms      | Full width     | 60% width     | 40% width       |
| Modals     | Full screen    | Centered 80%  | Centered 50%    |

**Touch Considerations:**

```
Minimum touch target: 44×44px
Thumb-friendly zone: Bottom 2/3 of screen
Primary actions: Bottom of screen
Swipe gestures: Horizontal scroll for carousels
Pull-to-refresh: On list pages
```

**Content Adaptation:**

```
Mobile: Single column, large text, simplified charts
Tablet: Two columns, standard charts
Desktop: Multi-column, detailed charts, data tables
```

---

## 9. Accessibility (A11y)

### 9.1 WCAG 2.1 AA Compliance

**Color Contrast:**

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum
- Focus indicators: Clearly visible

**Keyboard Navigation:**

- All interactive elements focusable
- Logical tab order
- Skip links for navigation
- Escape closes modals

**Screen Readers:**

- Semantic HTML structure
- ARIA labels for icons
- Live regions for dynamic content
- Alt text for images

### 9.2 Implementation Checklist

```
☑ All buttons have accessible names
☑ Form fields have associated labels
☑ Error messages are linked to inputs
☑ Progress is announced to screen readers
☑ Timer changes are announced
☑ Charts have text alternatives
☑ Color is not sole indicator
☑ Focus is managed in modals
☑ Touch targets are 44px minimum
```

---

## 10. Dark Mode (Optional)

### 10.1 Dark Palette Mapping

```typescript
const darkColors = {
  background: {
    primary: "#0F172A", // Slate-900
    secondary: "#1E293B", // Slate-800
    elevated: "#334155", // Slate-700
  },

  ink: {
    primary: "#F8FAFC", // Slate-50
    secondary: "#CBD5E1", // Slate-300
    tertiary: "#94A3B8", // Slate-400
    disabled: "#64748B", // Slate-500
  },

  border: {
    default: "#475569", // Slate-600
    subtle: "#334155", // Slate-700
  },

  // Pastel surfaces become muted versions
  surface: {
    yellow: "#78350F", // Amber-900
    lavender: "#581C87", // Purple-900
    sky: "#1E3A5F", // Blue-900
    mint: "#14532D", // Green-900
  },
}
```

### 10.2 Dark Mode Toggle

- System preference detection by default
- Manual toggle in settings
- Transition: 200ms fade between modes
- Persist preference in localStorage

---

## 11. Content Formatting

### 11.1 Math & Equations

```
Use KaTeX for all mathematical expressions

Inline math: $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$
Block math:
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n
$$

Styling:
- Font size: Same as surrounding text for inline
- Block equations: Centered, slight vertical padding
- Mobile: Horizontal scroll for overflow equations
```

### 11.2 Code Blocks (for technical subjects)

```
Use syntax highlighting with Prism or similar
Font: JetBrains Mono
Background: Slightly darker than card
Border-radius: 8px
Padding: 16px
```

### 11.3 Tables (MCK question type)

```
┌─────────────────────────────────────────────┐
│  Pernyataan               │  Benar │ Salah │
├─────────────────────────────────────────────┤
│  Air mendidih pada 100°C  │   ●    │   ○   │
│  Besi lebih ringan...     │   ○    │   ●   │
│  Matahari terbit...       │   ●    │   ○   │
└─────────────────────────────────────────────┘

Mobile: Horizontal scroll if needed
Headers: Sticky on scroll
Row hover: Subtle highlight
Selected: Primary color indicator
```

---

## 12. Gamification & Motivation

### 12.1 Points Visualization

```
Every correct answer shows points flying up:

        +5 pts
          ↑
    [Answer Option] → User taps correct answer

Animation:
- Text appears at tap location
- Floats up 20-30px
- Fades out
- Duration: 600ms
- Color: Based on difficulty (L1=blue, L2=purple, L3=gold)
```

### 12.2 Skill Coverage Celebration

```
When skill reaches 20 points:

┌─────────────────────────────────────────────┐
│                                             │
│     🎯 SKILL DIKUASAI!                     │
│                                             │
│     Mean & Median                           │
│     ████████████████████ 20/20 pts         │
│                                             │
│     (+2 poin dari soal ini)                │
│                                             │
└─────────────────────────────────────────────┘

Show as toast notification
Duration: 3s
Animation: Slide up with slight bounce
```

### 12.3 Progress Milestones

**Celebrate at:**

- First module completed
- First skill covered (20 pts)
- First cycle completed
- 10/50/100% skills covered
- Target readiness reached

**Celebration intensity scales:**

- Small win: Toast + checkmark animation
- Medium win: Larger modal + confetti
- Big win: Full-screen celebration + detailed stats

### 12.4 Streak Indicators (Future)

```
┌─────────────────┐
│  🔥 5 hari      │  ← If user studies daily
│  berturut-turut │
└─────────────────┘

Show in header when active
Motivates consistent study
Don't punish missed days harshly
```

---

## 13. Error Handling & Edge Cases

### 13.1 Network Errors

```
┌─────────────────────────────────────────────┐
│  ⚠️ Koneksi Terputus                        │
│                                             │
│  Jawaban kamu tersimpan di perangkat.       │
│  Akan dikirim saat koneksi pulih.          │
│                                             │
│  [ Coba Lagi ]                              │
└─────────────────────────────────────────────┘

- Queue failed submissions locally
- Auto-retry when connection restored
- Show offline indicator in header
- Allow continuing in offline mode
```

### 13.2 Session Timeout

```
┌─────────────────────────────────────────────┐
│  ⏰ Sesi Habis                              │
│                                             │
│  Kamu tidak aktif selama 30 menit.         │
│  Progress tersimpan sampai soal terakhir.  │
│                                             │
│  [ Login Kembali ]                          │
└─────────────────────────────────────────────┘
```

### 13.3 No Data States

**No modules available:**

```
"Belum ada modul tersedia untuk topik ini.
Admin sedang menyiapkan konten. Coba lagi nanti!"
```

**No weak skills (all covered):**

```
"🎉 Luar biasa! Semua skill sudah kamu kuasai.
Tetap latihan untuk mempertahankan penguasaan."
```

**No target university selected:**

```
"Pilih target kampus untuk melihat
perbandingan skor readiness kamu."
[ Pilih Kampus ]
```

---

## 14. Performance Considerations

### 14.1 Loading Priorities

```
Critical (load first):
- Navigation shell
- Current page skeleton
- Above-the-fold content

Non-critical (lazy load):
- Charts and visualizations
- Historical data
- Images
- Below-fold content
```

### 14.2 Skeleton Patterns

```
Always show skeletons, never blank screens

Card skeleton: Rectangles mimicking content layout
List skeleton: 3-5 items with shimmer effect
Chart skeleton: Gray placeholder with label outlines
```

### 14.3 Optimistic Updates

```
For user actions:
- Show success state immediately
- Sync with server in background
- Revert on error with explanation

Example: Answer submission
- Mark answer as selected immediately
- Show points animation
- Send to server async
- Handle sync errors gracefully
```

---

## 15. Implementation Notes for AI Code Generation

### 15.1 Technology Mapping

| Design Element         | Implementation                                     |
| ---------------------- | -------------------------------------------------- |
| Colors                 | Tailwind CSS custom colors in `tailwind.config.ts` |
| Typography             | Custom font classes in `globals.css`               |
| Shadows                | Custom shadow tokens in Tailwind config            |
| Animations             | Framer Motion or CSS transitions                   |
| Icons                  | Lucide React icons                                 |
| Charts                 | Recharts library                                   |
| Math rendering         | KaTeX                                              |
| Component library base | shadcn/ui                                          |

### 15.2 File Structure for Design System

```
lib/
├── design-tokens.ts      # All tokens exported as constants
├── utils.ts              # cn() utility for class merging

components/
├── ui/                   # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── shared/               # Custom shared components
│   ├── ProgressBar.tsx
│   ├── PointsAnimation.tsx
│   ├── SkeletonCard.tsx
│   └── Toast.tsx
├── assessment/           # Assessment-specific
├── analytics/            # Analytics-specific
├── plan/                 # Plan-specific
└── review/               # Review-specific

app/
├── globals.css           # Global styles, font imports
└── ...pages
```

### 15.3 CSS Custom Properties

```css
:root {
  /* Colors */
  --color-bg-primary: #fafaf9;
  --color-ink-primary: #1a1a1a;
  --color-primary: #f97316;
  /* ... all tokens ... */

  /* Spacing */
  --spacing-md: 16px;

  /* Radius */
  --radius-lg: 16px;

  /* Shadows */
  --shadow-card: 4px 4px 0px rgba(45, 55, 72, 0.12);

  /* Transitions */
  --transition-fast: 100ms ease-out;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #0f172a;
    /* ... */
  }
}
```

### 15.4 Key Component Props Patterns

```typescript
// All cards should support surface variants
interface CardProps {
  variant?:
    | "default"
    | "yellow"
    | "sky"
    | "lavender"
    | "mint"
    | "cream"
    | "dark"
  interactive?: boolean
  children: React.ReactNode
}

// Progress components need consistent props
interface ProgressProps {
  current: number
  max: number
  label?: string
  showPercentage?: boolean
  animated?: boolean
}

// All interactive elements need loading states
interface ButtonProps {
  loading?: boolean
  disabled?: boolean
  variant: "primary" | "secondary" | "ghost"
  size: "sm" | "md" | "lg"
}
```

---

## 16. Quick Reference Checklist

### 16.1 Before Building Any Screen

```
☑ What is the user's emotional state on this screen?
☑ What is the ONE primary action?
☑ How does this connect to the overall journey?
☑ What happens on error?
☑ What happens when loading?
☑ What happens when empty?
☑ Is this accessible?
```

### 16.2 Visual Consistency Checks

```
☑ Cards have 2px border and offset shadow
☑ Border radius is consistent (use tokens)
☑ Spacing follows 8px grid
☑ Touch targets are 44px minimum
☑ Typography follows scale
☑ Colors use semantic tokens
☑ Animations are fast (<300ms)
```

### 16.3 Mobile-Specific Checks

```
☑ Bottom nav is present and fixed
☑ Primary actions are thumb-reachable
☑ Text is readable without zooming
☑ Forms are easy to complete one-handed
☑ Scroll behavior is smooth
☑ Loading states are visible
```

---

**Document End**

_Version 2.0 - Enhanced for AI Code Generation_
_Based on PROJECT_BLUEPRINT_v2.md specifications_
