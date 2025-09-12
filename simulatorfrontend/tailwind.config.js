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
          200: '#AED6F1',
          400: '#5DADE2',
          500: '#3498DB',
          600: '#2980B9',
          700: '#2471A3',
          800: '#154360',
          900: '#1B4F72',
        }
      },
      backgroundColor: {
        dark: {
          DEFAULT: '#121212',
          surface: '#1E1E1E',
          card: '#242424',
          hover: '#2A2A2A'
        }
      },
      textColor: {
        dark: {
          primary: '#E4E6EB',
          secondary: '#B0B3B8',
          tertiary: '#808285'
        }
      },
      borderColor: {
        dark: {
          DEFAULT: '#2D2D2D',
          hover: '#404040'
        }
      }
    },
  },
  plugins: [],
}
