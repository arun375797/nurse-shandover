/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3f8',
          100: '#d5e0ed',
          200: '#abC1db',
          500: '#2f5a8a',
          700: '#1e3a5f',
          800: '#162f4d',
          900: '#0f243b',
        },
        teal: {
          50: '#eef9f7',
          100: '#d5f0eb',
          400: '#3db8ad',
          500: '#2a9d8f',
          600: '#21867a',
          700: '#1a6b61',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 36 59 / 0.06), 0 8px 24px -4px rgb(15 36 59 / 0.08)',
      },
      fontFamily: {
        sans: ['Candara', 'Calibri', '"Segoe UI"', '"Helvetica Neue"', 'sans-serif'],
        display: ['Calibri', 'Candara', '"Segoe UI"', '"Helvetica Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
