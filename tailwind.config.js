/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        goflex: {
          blue: '#27AAE1',
          'blue-dark': '#0178B7',
          'blue-light': '#06B4D7',
        },
        'goflex-blue': '#27AAE1',
        'goflex-blue-dark': '#0178B7',
        'goflex-bg': '#020617',
        'goflex-card': '#0B1120',
      },
      fontFamily: {
        sans: ['Montserrat Alt1', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
