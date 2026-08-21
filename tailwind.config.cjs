/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        'primary': '#000000',
        'secondary': '#ffffff',
        'accent': '#f5f5f5',
      },
    },
  },
  plugins: [],
}
