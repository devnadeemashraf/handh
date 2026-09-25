import tailwindcssAnimate from 'tailwindcss-animate';

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1440px'
      }
    },
    extend: {
      colors: {
        // shadcn/ui semantic HSL bindings
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

        // Luxury Design Tokens (docs/frontend-design-spec/02_DESIGN_TOKENS.md)
        canvas: 'var(--color-bg-canvas)',
        surface: 'var(--color-bg-surface)',
        sunken: 'var(--color-bg-sunken)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-strong': 'var(--color-border-strong)',
        scrim: 'var(--color-overlay-scrim)',

        // Royal Accent
        royal: {
          DEFAULT: 'var(--color-accent-royal)',
          hover: 'var(--color-accent-royal-hover)',
          tint: 'var(--color-accent-royal-tint)'
        },

        // Semantic Feedback Tokens
        status: {
          success: 'var(--color-success)',
          'success-tint': 'var(--color-success-tint)',
          error: 'var(--color-error)',
          'error-tint': 'var(--color-error-tint)',
          warning: 'var(--color-warning)',
          'warning-tint': 'var(--color-warning-tint)',
          sale: 'var(--color-sale)'
        },

        // Backward compatibility mappings
        emerald: {
          DEFAULT: '#0A2E24',
          hover: '#07221A',
          subtle: '#E8EFEA'
        },
        gold: {
          DEFAULT: '#C5A880',
          hover: '#B59465',
          light: '#F5EFE6',
          bronze: '#7D5926'
        },
        beige: {
          DEFAULT: '#FDFBF7',
          surface: '#FFFFFF',
          soft: '#F5EFE6',
          border: '#EBE7DF'
        },
        darkgray: {
          DEFAULT: '#171A19',
          muted: '#5C6460',
          border: '#2C3330',
          subtle: '#8BAAA0'
        }
      },
      borderRadius: {
        sm: 'var(--radius-sm, 2px)',
        md: 'var(--radius-md, 4px)',
        lg: 'var(--radius-md, 4px)', // Strictly enforces max 4px radius
        full: '9999px'
      },
      boxShadow: {
        'elevation-0': 'var(--elevation-0, none)',
        'elevation-1': 'var(--elevation-1, 0 1px 3px rgba(31, 27, 24, 0.06))',
        'elevation-2': 'var(--elevation-2, 0 8px 24px rgba(31, 27, 24, 0.10))'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'sans-serif']
      },
      transitionDuration: {
        instant: 'var(--duration-instant, 100ms)',
        fast: 'var(--duration-fast, 180ms)',
        base: 'var(--duration-base, 240ms)',
        slow: 'var(--duration-slow, 400ms)'
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard, cubic-bezier(0.4, 0, 0.2, 1))',
        emphasized: 'var(--ease-emphasized, cubic-bezier(0.2, 0, 0, 1))',
        decelerate: 'var(--ease-decelerate, cubic-bezier(0, 0, 0.2, 1))',
        accelerate: 'var(--ease-accelerate, cubic-bezier(0.4, 0, 1, 1))'
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
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        'accordion-up': 'accordion-up 180ms cubic-bezier(0.4, 0, 1, 1)',
        shimmer: 'shimmer 1.5s infinite'
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
