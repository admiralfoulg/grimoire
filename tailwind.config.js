/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vvd: {
          dark: '#0e1015',
          panel: '#14171f',
          surface: '#181b24',
          border: 'rgba(255, 255, 255, 0.08)',
          gold: '#c8963e',
          'gold-hover': '#dfa94b',
        }
      }
    },
  },
  plugins: [],
}
