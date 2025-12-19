/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          yellow: '#FFFF00',
          green: '#00FF00',
        },
      },
      boxShadow: {
        'neon-yellow': '0 0 10px #FFFF00, 0 0 20px #FFFF00, 0 0 30px #FFFF00',
        'neon-green': '0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00',
        'neon-yellow-sm': '0 0 5px #FFFF00, 0 0 10px #FFFF00',
        'neon-green-sm': '0 0 5px #00FF00, 0 0 10px #00FF00',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { 'box-shadow': '0 0 5px #FFFF00, 0 0 10px #FFFF00' },
          '100%': { 'box-shadow': '0 0 10px #FFFF00, 0 0 20px #FFFF00, 0 0 30px #FFFF00' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
    },
  },
  plugins: [],
}

