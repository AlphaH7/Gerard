/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontSize: {
      xxs: '0.6rem',
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
    },
    extend: {
      rotate: {
        '--90': '-90deg',
      },
      colors: {
        default: {
          primary50: '#e9efee',
          primary100: '#659388',
          primary200: '#397566',
          primary: '#246655',
          primary300: '#205b4c',
          primary400: '#1c5144',
          primary500: '#153d33',
        },
        gray: {
          100: '#f2f4fb',
          200: '#c1c1c1',
          300: '#b8b8b8',
          400: '#afafaf',
          500: '#a7a7a7',
          600: '#969696',
          700: '#818181',
          800: '#747474',
          900: '#646464',
          1000: '#616D77',
        },
      },
    },
  },
  plugins: [],
};
