/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover: 'var(--color-primary-hover)',
          bg: 'var(--color-primary-bg)',
          50: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          100: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          200: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          400: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          600: 'var(--color-primary-hover)',
          700: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          800: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          900: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}