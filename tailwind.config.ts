import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"
import { colors, typography, shadows, borderRadius as dtBorderRadius, transitions } from "./lib/design-tokens"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			// Design token colors — SoT from design-tokens.ts (T-063)
  			pastel: colors.pastel,
  			charcoal: colors.charcoal,
  			semantic: colors.semantic,
  			construct: colors.construct,
  			status: colors.status,
  			// Surface context colors (T-065)
  			surface: {
  				baseline: colors.pastel.lemon,   // yellow = baseline context
  				plan: colors.pastel.sky,          // sky = plan context
  				drill: colors.pastel.peach,       // peach = drill context
  				review: colors.pastel.mint,       // mint = review context
  				analytics: colors.pastel.lavender, // lavender = analytics context
  				recycle: colors.pastel.coral,     // coral = recycle context
  			},
  		},
  		fontFamily: {
  			sans: [typography.fontFamily.sans],
  			mono: [typography.fontFamily.mono],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			brutal: dtBorderRadius.DEFAULT,
  			'brutal-lg': dtBorderRadius.lg,
  			'brutal-xl': dtBorderRadius.xl,
  		},
  		boxShadow: {
  			'brutal-sm': shadows.brutal.sm,
  			brutal: shadows.brutal.DEFAULT,
  			'brutal-lg': shadows.brutal.lg,
  			'brutal-xl': shadows.brutal.xl,
  			'soft-sm': shadows.soft.sm,
  			soft: shadows.soft.DEFAULT,
  			'soft-lg': shadows.soft.lg,
  		},
  		transitionDuration: {
  			fast: transitions.duration.fast,
  			normal: transitions.duration.normal,
  			slow: transitions.duration.slow,
  		},
  		transitionTimingFunction: {
  			'ease-spring': transitions.timing.spring,
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'confetti-fall': {
  				'0%': { transform: 'translateY(-100%) rotate(0deg)', opacity: '1' },
  				'100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' }
  			},
  			'points-fly': {
  				'0%': { transform: 'translateY(0)', opacity: '1' },
  				'100%': { transform: 'translateY(-60px)', opacity: '0' }
  			},
  			'skeleton-pulse': {
  				'0%, 100%': { opacity: '0.4' },
  				'50%': { opacity: '0.8' }
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'confetti-fall': 'confetti-fall 2s ease-in forwards',
  			'points-fly': 'points-fly 600ms ease-out forwards',
  			'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(function({ addUtilities }) {
      addUtilities({
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.transform-style-3d': {
          transformStyle: 'preserve-3d',
        },
        '.backface-hidden': {
          backfaceVisibility: 'hidden',
        },
        '.rotate-y-180': {
          transform: 'rotateY(180deg)',
        },
        // T-064: Minimum touch target utility
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
      })
    }),
  ],
}

export default config
