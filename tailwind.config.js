/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Sora', 'sans-serif'],
      },
      colors: {
        'primary-bg': '#091024',
        'card-bg': '#26263f',
        'highlight': '#05e4d5',
        'button-primary': '#02edd4',
        'button-text': 'rgb(41, 41, 61)',
        'text-paragraph': '#c1c2c7',
      },
    },
  },
  plugins: [],
}