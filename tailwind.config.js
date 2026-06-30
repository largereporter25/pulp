/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pulp-canvas': '#0d0d0d',
        'pulp-page': '#111111',
        'pulp-dark': '#1a0800',
        'pulp-deeper': '#2d0e00',
        'pulp-gold': '#f5b942',
        'pulp-ink': '#f0ece0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Courier Prime', 'Courier New', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        code: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'scale-in': 'scaleIn 150ms ease-out',
      },
    },
  },
  plugins: [],
};
