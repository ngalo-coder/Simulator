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
        // Medical Primary Colors - Professional medical blue palette
        medical: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3', // Primary medical blue
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        // Emergency/Critical Colors
        emergency: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#F44336', // Critical red
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
        // Success/Stable Colors
        stable: {
          50: '#E8F5E8',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Success green
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        // Warning/Caution Colors
        warning: {
          50: '#FFF8E1',
          100: '#FFF3C4',
          200: '#FFF59D',
          300: '#FFEE58',
          400: '#FFEB3B',
          500: '#FFEB3B', // Warning yellow
          600: '#FDD835',
          700: '#F9A825',
          800: '#F57F17',
          900: '#FF6F00',
        },
        // Information Colors
        info: {
          50: '#E1F5FE',
          100: '#B3E5FC',
          200: '#81D4FA',
          300: '#4FC3F7',
          400: '#29B6F6',
          500: '#03A9F4', // Info blue
          600: '#039BE5',
          700: '#0288D1',
          800: '#0277BD',
          900: '#01579B',
        },
        // Medical Specialty Colors
        specialty: {
          cardiology: '#E91E63',
          neurology: '#9C27B0',
          oncology: '#673AB7',
          pediatrics: '#3F51B5',
          surgery: '#2196F3',
          radiology: '#00BCD4',
          laboratory: '#009688',
          pharmacy: '#4CAF50',
          nursing: '#8BC34A',
          emergency: '#FF5722',
        },
        // Enhanced Dark Mode Colors
        dark: {
          primary: '#E3F2FD',
          secondary: '#B3E5FC',
          tertiary: '#81D4FA',
          surface: '#121212',
          'surface-2': '#1E1E1E',
          'surface-3': '#242424',
          card: '#2A2A2A',
          hover: '#333333',
          border: '#404040',
          'border-2': '#555555',
        },
        // Legacy primary colors (keeping for backward compatibility)
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
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        medical: ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-medical': 'pulseMedical 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite both',
        'loading-medical': 'loadingMedical 1.4s ease-in-out infinite both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseMedical: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.1)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(1)' },
        },
        loadingMedical: {
          '0%, 100%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        'medical': '0 4px 6px -1px rgba(33, 150, 243, 0.1), 0 2px 4px -1px rgba(33, 150, 243, 0.06)',
        'medical-lg': '0 10px 15px -3px rgba(33, 150, 243, 0.1), 0 4px 6px -2px rgba(33, 150, 243, 0.05)',
        'emergency': '0 4px 6px -1px rgba(244, 67, 54, 0.1), 0 2px 4px -1px rgba(244, 67, 54, 0.06)',
        'stable': '0 4px 6px -1px rgba(76, 175, 80, 0.1), 0 2px 4px -1px rgba(76, 175, 80, 0.06)',
        'warning': '0 4px 6px -1px rgba(255, 235, 59, 0.1), 0 2px 4px -1px rgba(255, 235, 59, 0.06)',
        'dark-medical': '0 4px 6px -1px rgba(227, 242, 253, 0.1), 0 2px 4px -1px rgba(227, 242, 253, 0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-medical': 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
        'gradient-emergency': 'linear-gradient(135deg, #F44336 0%, #FF5722 100%)',
        'gradient-stable': 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
        'gradient-warning': 'linear-gradient(135deg, #FFEB3B 0%, #FFC107 100%)',
        'gradient-dark-medical': 'linear-gradient(135deg, #0D47A1 0%, #01579B 100%)',
      },
    },
  },
  plugins: [],
}
