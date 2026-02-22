========================
UI STYLE ADDENDUM (MATCH THIS VISUAL TASTE)
========================
Design language: “Soft Neubrutalism / Friendly Dashboard”

- Overall vibe: clean, modern, playful, warm; lots of whitespace; crisp black/charcoal outlines; soft pastel surfaces; rounded corners; subtle shadow offsets that feel like sticker/cutout cards.
- Layout: card-based grid with clear hierarchy; sections separated by rounded containers; consistent spacing; easy scanning.

Color system (use tokens, optionally map to these vibes):

- Base background: off-white / very light gray.
- Border/ink: charcoal (not pure black).
- Pastel surfaces: warm yellow, lavender/purple, sky blue.
- Primary CTA: warm coral/orange-red button.
- Dark feature panel: charcoal/near-black card with white text + coral CTA.
- Chips/tags: white or light gray pills with charcoal border; active chip filled dark.

Typography:

- Friendly rounded sans (or modern geometric sans).
- Big bold section headers (“My courses” style).
- Medium-weight body text; high contrast; minimal line length.
- Use consistent typographic scale (H1/H2/Body/Caption) and strong hierarchy.

Core visual components (must replicate):

1. Cards:
   - Large rounded rectangles (radius ~16–24).
   - 2px border (charcoal).
   - Soft shadow with small offset (e.g., x=3, y=3, blur small) to create “floating card” feel.
   - Pastel fill backgrounds for primary cards; white for content tables; dark charcoal for spotlight card.
2. Pill chips:
   - Rounded pills with borders.
   - Active state: filled dark with white text.
   - Inactive: white fill, charcoal text.
3. Buttons:
   - Primary “Continue”/CTA in coral/orange-red with rounded corners.
   - Slight shadow/outline consistent with cards.
4. Avatars + badges:
   - Small circular avatars, sometimes overlapping horizontally.
   - Tiny badge pill like “+80 / +120” with border.
5. Icons & nav:
   - Minimal iconography (simple line icons).
   - Desktop/tablet: left vertical rail navigation (icons).
   - Active nav item: highlighted with a rounded colored pill background.

Mobile-first adaptation (keep the same taste):

- Replace left sidebar with bottom navigation bar but KEEP the same icon style + active pill highlight.
- Convert “course cards row” into horizontal scroll carousel with snap.
- Keep chip filters in a horizontal scroll row under the search bar.
- Keep spotlight dark card as a prominent section (full-width on mobile).

Micro-interactions:

- Hover/press: card lifts slightly (translateY -1/-2) and shadow increases subtly.
- Buttons: quick scale/press feedback.
- Transitions: fast, smooth, not flashy.

Consistency rules:

- All surfaces have consistent border thickness and radius.
- Shadows are consistent across cards and buttons.
- Use a tight design system: spacing scale (8/12/16/24), radius tokens, border token, shadow token.

Implementation instruction for code generation:

- Build reusable UI tokens: radius-lg, border-ink, shadow-soft, bg-pastel-yellow/lavender/blue, bg-ink, btn-primary-coral, chip-active.
- # Apply this style across all screens: Baseline hub, runners, Plan dashboard, Taktis mode, Analytics, Admin console.
  # END UI STYLE ADDENDUM
