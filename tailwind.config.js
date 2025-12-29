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
        // Dark navy base + teal accent (landing theme)
        'primary-bg': '#070B1D',
        'card-bg': '#0E1633',
        'highlight': '#00E6D0',
        'button-primary': '#00E6D0',
        'button-text': '#04161A',
        'text-paragraph': '#B8C1D9',
      },
    },
  },
  plugins: [],
}