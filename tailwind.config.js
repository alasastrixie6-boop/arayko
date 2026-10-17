/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1f5d2e',
          mid: '#2f8a4e',
          light: '#e7f5ec',
          gold: '#d9a441',
          'gold-dark': '#b8891f',
        },
        cream: '#fffdf7',
        charcoal: '#2b2b2b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 6px rgba(0,0,0,0.08)',
        lg: '0 10px 25px rgba(0,0,0,0.12)',
        xl: '0 20px 40px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}