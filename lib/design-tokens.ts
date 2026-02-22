/**
 * Soft Neubrutalism Design System
 * Phase 0: Design tokens for UTBK Prep Platform
 *
 * Style characteristics:
 * - Pastel color palette with high contrast charcoal borders
 * - Rounded corners (8-16px radius)
 * - Card-based layouts with subtle shadows
 * - Bold, chunky buttons with offset shadows
 * - Playful but professional aesthetic
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Pastel primary palette
  pastel: {
    pink: '#FFD6E8',
    lavender: '#E4D4F4',
    mint: '#C7F0DB',
    peach: '#FFE5CC',
    sky: '#D6E8FF',
    lemon: '#FFF4CC',
    coral: '#FFD9CC',
    sage: '#E0F2E0',
  },

  // Charcoal borders & text
  charcoal: {
    DEFAULT: '#2D2D2D',
    light: '#4A4A4A',
    dark: '#1A1A1A',
  },

  // Semantic colors
  semantic: {
    success: '#7EC876',
    warning: '#F4B740',
    error: '#FF6B6B',
    info: '#5DADE2',
  },

  // Construct colors (for analytics)
  construct: {
    teliti: '#FFD6E8',    // Pink - careful/meticulous
    speed: '#D6E8FF',     // Sky blue - fast
    reasoning: '#E4D4F4', // Lavender - analytical
    computation: '#FFE5CC', // Peach - calculation
    reading: '#C7F0DB',   // Mint - comprehension
  },

  // Status colors
  status: {
    strong: '#7EC876',
    developing: '#F4B740',
    weak: '#FF6B6B',
    untested: '#E5E5E5',
  },

  // Neutral palette
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background & surface
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSubdued: '#F5F5F5',
} as const

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },

  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

// ============================================
// SPACING SCALE
// ============================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  DEFAULT: '0.5rem', // 8px - most common
  md: '0.625rem',   // 10px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const

// ============================================
// SHADOWS (Neubrutalism style)
// ============================================

export const shadows = {
  // Offset shadows (neubrutalism characteristic)
  brutal: {
    sm: '2px 2px 0px #2D2D2D',
    DEFAULT: '4px 4px 0px #2D2D2D',
    lg: '6px 6px 0px #2D2D2D',
    xl: '8px 8px 0px #2D2D2D',
  },

  // Soft shadows for cards
  soft: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },

  // No shadow
  none: 'none',
} as const

// ============================================
// BORDER WIDTHS
// ============================================

export const borderWidth = {
  0: '0',
  DEFAULT: '2px', // Chunky borders for neubrutalism
  2: '2px',
  3: '3px',
  4: '4px',
} as const

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },

  timing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const

// ============================================
// COMPONENT-SPECIFIC TOKENS
// ============================================

export const components = {
  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth[2],
    borderColor: colors.charcoal.DEFAULT,
    shadow: shadows.brutal.DEFAULT,
    background: colors.surface,
  },

  button: {
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,
      md: `${spacing[3]} ${spacing[6]}`,
      lg: `${spacing[4]} ${spacing[8]}`,
    },
    borderRadius: borderRadius.DEFAULT,
    borderWidth: borderWidth[2],
    shadow: shadows.brutal.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  input: {
    padding: spacing[3],
    borderRadius: borderRadius.DEFAULT,
    borderWidth: borderWidth[2],
    borderColor: colors.charcoal.DEFAULT,
    focusBorderColor: colors.pastel.lavender,
    background: colors.surface,
  },

  badge: {
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: borderRadius.full,
    borderWidth: borderWidth[2],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
} as const

// ============================================
// BREAKPOINTS (Mobile-first)
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get construct color by name
 */
export function getConstructColor(construct: keyof typeof colors.construct): string {
  return colors.construct[construct]
}

/**
 * Get status color by mastery level
 */
export function getStatusColor(status: keyof typeof colors.status): string {
  return colors.status[status]
}

/**
 * Generate brutal shadow with custom offset
 */
export function brutalShadow(offsetX: number, offsetY: number, color = colors.charcoal.DEFAULT): string {
  return `${offsetX}px ${offsetY}px 0px ${color}`
}

/**
 * Type-safe design token access
 */
export type Color = typeof colors
export type Typography = typeof typography
export type Spacing = typeof spacing
export type Shadow = typeof shadows
export type Component = typeof components
