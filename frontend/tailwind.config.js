/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Display face — used only for headline/eyebrow text on the public marketing
        // homepage. Body copy and the authenticated app keep Inter everywhere else.
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep Ocean Navy — primary surfaces/text anchor, dark-mode background family
        ocean: {
          50: '#f1f6fa',
          100: '#dbe7f0',
          200: '#b7cfe1',
          300: '#8bb0cc',
          400: '#5a8bb0',
          500: '#3d6d93',
          600: '#2d5476',
          700: '#254361',
          800: '#1c3349',
          900: '#132538',
          950: '#0a1524',
        },
        // Existing brand/aqua kept (already used across the app) + extended
        brand: {
          50: '#eff8ff', 100: '#d9edff', 200: '#bce0ff', 300: '#8ecdff', 400: '#59b0ff',
          500: '#3390fc', 600: '#1c6ff2', 700: '#155adf', 800: '#1849b4', 900: '#1a408d', 950: '#152a56',
        },
        aqua: {
          50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee',
          500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344',
        },
        teal: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
          500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2c',
        },
        // Semantic status colors — used consistently for meaning, not decoration
        status: {
          healthy: '#10b981',   // emerald
          'healthy-soft': '#d1fae5',
          warning: '#f59e0b',   // amber
          'warning-soft': '#fef3c7',
          critical: '#ef4444',  // red
          'critical-soft': '#fee2e2',
          info: '#3390fc',      // brand blue
          'info-soft': '#eff8ff',
        },
      },
      backgroundImage: {
        'aqua-gradient': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 45%, #22d3ee 100%)',
        'aqua-mesh': 'radial-gradient(at 20% 20%, rgba(34,211,238,0.35) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(59,130,246,0.30) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(20,184,166,0.30) 0px, transparent 50%)',
        'ocean-gradient': 'linear-gradient(160deg, #0a1524 0%, #132538 45%, #1c3349 100%)',
        'wave-lines': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40' viewBox='0 0 200 40'%3E%3Cpath d='M0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20' fill='none' stroke='%2306b6d4' stroke-opacity='0.08' stroke-width='2'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(8, 51, 68, 0.20)',
        'glass-lg': '0 20px 60px -10px rgba(8, 51, 68, 0.35)',
        card: '0 1px 2px 0 rgba(10, 21, 36, 0.04), 0 1px 3px 0 rgba(10, 21, 36, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(10, 21, 36, 0.10), 0 2px 4px -2px rgba(10, 21, 36, 0.06)',
        'glow-aqua': '0 0 0 1px rgba(6,182,212,0.15), 0 0 24px -4px rgba(6,182,212,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in-right': { from: { opacity: 0, transform: 'translateX(12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' }, '70%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0)' } },
        // ---- Marketing homepage motion system ----
        'hero-rise': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'hero-rise-x': { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        'reveal-up': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'wave-drift': { '0%': { backgroundPositionX: '0px' }, '100%': { backgroundPositionX: '400px' } },
        'flow-dash': { to: { strokeDashoffset: '-200' } },
        'ripple-soft': { '0%': { transform: 'scale(0.9)', opacity: 0.5 }, '100%': { transform: 'scale(1.9)', opacity: 0 } },
        'bob': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        'grow-bar': { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
        'draw-line': { from: { strokeDashoffset: 'var(--line-length, 400)' }, to: { strokeDashoffset: '0' } },
        // ---- Authentication motion system ----
        // One-time brand-mark entrance — never loops, never bounces.
        'logo-in': {
          from: { opacity: 0, transform: 'scale(0.85)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        // Forward transition when swapping Login -> Forgot Password panel.
        'panel-in': {
          from: { opacity: 0, transform: 'translateX(10px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        // Reverse transition when swapping Forgot Password -> Login panel.
        'panel-in-back': {
          from: { opacity: 0, transform: 'translateX(-10px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.92)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'hero-rise': 'hero-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'hero-rise-x': 'hero-rise-x 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'reveal-up': 'reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'wave-drift': 'wave-drift 18s linear infinite',
        'flow-dash': 'flow-dash 6s linear infinite',
        'ripple-soft': 'ripple-soft 2.4s ease-out infinite',
        bob: 'bob 5s ease-in-out infinite',
        'grow-bar': 'grow-bar 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'draw-line': 'draw-line 1.4s cubic-bezier(0.65, 0, 0.35, 1) both',
        'logo-in': 'logo-in 0.4s ease-out both',
        'panel-in': 'panel-in 0.25s ease-out both',
        'panel-in-back': 'panel-in-back 0.25s ease-out both',
        'pop-in': 'pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      transitionDelay: {
        150: '150ms',
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
}
