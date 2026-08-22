/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0E0C22',
          950: '#08071A',
          900: '#0E0C22',
          800: '#151330',
          700: '#1D1A42',
        },
        iris: {
          DEFAULT: '#1C1A3F',
          panel: '#181635',
          light: '#28234F',
          border: '#332E60',
        },
        pearl: {
          DEFAULT: '#F4F2FB',
          dim: '#C9C5E0',
          faint: '#8E88B3',
        },
        violet: {
          400: '#9C8CFF',
          500: '#7C6CFF',
          600: '#6151E8',
        },
        teal: {
          300: '#7FF0DA',
          400: '#4FD1C5',
          500: '#2FB8AC',
        },
        blush: '#FF7A93',
        amber: '#FFB454',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'aurora': 'linear-gradient(120deg, #7C6CFF 0%, #9C8CFF 35%, #4FD1C5 100%)',
        'aurora-soft': 'linear-gradient(120deg, rgba(124,108,255,0.18) 0%, rgba(79,209,197,0.14) 100%)',
        'iris-radial': 'radial-gradient(120% 120% at 10% 0%, #221F4A 0%, #0E0C22 60%)',
        'glass-sheen': 'linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 35%)',
      },
      boxShadow: {
        'glow-violet': '0 0 60px -12px rgba(124,108,255,0.55)',
        'glow-teal': '0 0 60px -14px rgba(79,209,197,0.45)',
        'panel': '0 24px 60px -20px rgba(4,3,16,0.65)',
        'inset-line': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      keyframes: {
        'aurora-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-120%) rotate(8deg)' },
          '100%': { transform: 'translateX(120%) rotate(8deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(124,108,255,0.45)' },
          '100%': { boxShadow: '0 0 0 22px rgba(124,108,255,0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'aurora-shift': 'aurora-shift 8s ease infinite',
        'sweep': 'sweep 3.2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
      opacity: {
        3: '0.03',
        4: '0.04',
        6: '0.06',
        7: '0.07',
      },
    },
  },
  plugins: [],
}