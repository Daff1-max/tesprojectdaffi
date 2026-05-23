import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          base:     'var(--bg-base)',
          surface:  'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          border:   'var(--bg-border)',
        },
        risk: {
          low:      'var(--risk-low)',
          medium:   'var(--risk-medium)',
          high:     'var(--risk-high)',
          critical: 'var(--risk-critical)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          muted:   'var(--accent-muted)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
