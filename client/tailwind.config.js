/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        felt: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        domino: {
          ivory: '#fefce8',
          dark: '#1c1917',
          dot: '#1c1917',
        },
        gold: '#d4af37',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'bounce-soft': 'bounceSoft 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'tile-place': 'tilePlace 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'hand-tile': 'handTile 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'winner-glow': 'winnerGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(0.9)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        tilePlace: {
          from: { transform: 'scale(0.7) rotate(-5deg)', opacity: '0' },
          to: { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        handTile: {
          from: { transform: 'translateY(30px) scale(0.8)', opacity: '0' },
          to: { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        winnerGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(212,175,55,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'felt-texture': "radial-gradient(ellipse at center, #1a6b3c 0%, #145a31 50%, #0f4524 100%)",
        'felt-dark': "radial-gradient(ellipse at center, #0f4524 0%, #0a3019 50%, #061a0e 100%)",
      },
    },
  },
  plugins: [],
};
