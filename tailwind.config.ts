import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#00FF41',
          dark: '#00CC34',
          50: '#E6FFF0',
          100: '#CCFFDF',
          200: '#99FFBF',
          300: '#66FF9F',
          400: '#33FF7F',
          500: '#00FF41',
          600: '#00CC34',
          700: '#009927',
          800: '#00661A',
          900: '#00330D',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          2: '#111111',
          3: '#1A1A1A',
          4: '#222222',
          5: '#2A2A2A',
          50: '#1A1A1A',
          100: '#141414',
          200: '#111111',
          300: '#0D0D0D',
          400: '#0A0A0A',
        },
        // CSS variable based (allows runtime color changes)
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          button: 'var(--brand-button)',
        },
        // Shadcn
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-neon':  'linear-gradient(135deg, #00FF41 0%, #00CC34 100%)',
        'gradient-brand': 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-button) 100%)',
        'hero-gradient':  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%)',
        'card-gradient':  'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'fade-up':    'fadeUp 0.6s ease-out',
        'scale-in':   'scaleIn 0.4s ease-out',
        'float':      'float 3s ease-in-out infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp:    { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideUp:   { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        float:     { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseNeon: { '0%, 100%': { boxShadow: '0 0 20px rgba(0,255,65,0.5)' }, '50%': { boxShadow: '0 0 40px rgba(0,255,65,0.9)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'neon':    '0 0 20px rgba(0,255,65,0.5), 0 0 40px rgba(0,255,65,0.25)',
        'neon-sm': '0 0 10px rgba(0,255,65,0.4)',
        'neon-lg': '0 0 40px rgba(0,255,65,0.6), 0 0 80px rgba(0,255,65,0.3)',
        'card':    '0 4px 20px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      screens: {
        'xs': '320px',
        'sm': '390px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
