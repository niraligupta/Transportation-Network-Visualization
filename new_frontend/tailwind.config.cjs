// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ['./index.html', './src/**/*.{js,jsx}'],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'metro-blue': '#0b5db5',
        'metro-light-blue': '#dff3fb',
      },
      boxShadow: {
        hero: '0 10px 30px rgba(2,6,23,0.15)',
      }
    }
  },
  plugins: [],
}

