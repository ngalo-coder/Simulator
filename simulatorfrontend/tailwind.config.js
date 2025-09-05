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
        background: {
          DEFAULT: '#F9FAFB',
          alt: '#F3F4F6',
          dark: '#111827',
          'dark-alt': '#1F2937',
        },
        text: {
          DEFAULT: '#1F2937',
          muted: '#6B7280',
          dark: '#F9FAFB',
          'dark-muted': '#9CA3AF',
        },
        primary: {
          DEFAULT: '#2563EB',
          light: '#60A5FA',
          dark: '#1D4ED8',
          'dark-DEFAULT': '#60A5FA',
          'dark-light': '#93C5FD',
          'dark-dark': '#3B82F6',
        },
        secondary: {
          DEFAULT: '#93C5FD',
          dark: '#374151',
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#374151',
        },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
