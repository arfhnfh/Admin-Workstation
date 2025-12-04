/** @type {import('tailwindcss').Config} */
const palette = {
  sand: '#f9f3ea',
  almond: '#f5e4d0',
  peach: '#ffe3cf',
  lilac: '#c9b5ff',
  lavender: '#e3d8ff',
  violet: '#b29bff',
  grape: '#9c88ff',
  blush: '#f6c3c0',
  berry: '#f5828a',
  forest: '#3b6b53',
  charcoal: '#2e2a3b',
}

//asdasasdasdasd//

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: palette,
        'card-border': '#ece2d6',
        'text-muted': '#646079',
      },
      fontFamily: {
        poppins: ['"Poppins"', 'sans-serif'],
      },
      boxShadow: {
        pastel: '0 20px 50px rgba(190, 150, 120, 0.25)',
        card: '0 15px 35px rgba(78, 64, 107, 0.12)',
      },
      backgroundImage: {
        'gradient-sunrise': 'linear-gradient(120deg, #ffbfa3, #ffedc2)',
        'gradient-plum': 'linear-gradient(120deg, #c9b5ff, #f6d5ff)',
        'gradient-mint': 'linear-gradient(120deg, #b0f4d2, #fdf8d8)',
      },
    },
  },
  plugins: [],
}

