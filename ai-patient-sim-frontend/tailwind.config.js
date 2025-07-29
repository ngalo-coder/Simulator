// ai-patient-sim-frontend/tailwind.config.js - UPDATED FOR PRODUCTION
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        medical: {
          emergency: '#dc2626',
          warning: '#d97706', 
          success: '#059669',
          info: '#0284c7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [
    // Add useful plugins for forms and typography
    require('@tailwindcss/forms')({
      strategy: 'class', // Only apply to elements with 'form-' classes
    }),
  ],
  // Production optimizations - Updated for Tailwind CSS v3.0+
  safelist: [
    // Keep dynamic classes that might be generated
    'bg-red-100', 'bg-green-100', 'bg-blue-100', 'bg-yellow-100',
    'text-red-800', 'text-green-800', 'text-blue-800', 'text-yellow-800',
    'border-red-500', 'border-green-500', 'border-blue-500', 'border-purple-500',
    // Animation classes
    'animate-spin', 'animate-pulse', 'animate-bounce'
  ]
}