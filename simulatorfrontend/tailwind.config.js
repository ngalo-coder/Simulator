/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF5FF',
          100: '#D6EAF8',
          500: '#3498DB',
          600: '#2980B9',
          700: '#2471A3',
        }
      }
    },
  },
  plugins: [],
}
