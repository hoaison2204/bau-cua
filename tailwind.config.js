/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-slow': 'bounce 1s infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(234, 179, 8, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(234, 179, 8, 1), 0 0 50px rgba(234, 179, 8, 0.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      colors: {
        casino: {
          dark: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
          gold: '#f59e0b',
          red: '#ef4444',
          green: '#22c55e',
        }
      }
    },
  },
  plugins: [],
}
