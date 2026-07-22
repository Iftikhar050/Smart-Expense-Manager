/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#312e81', // Deep Indigo
        secondary: '#ff7f50', // Coral
        accent: '#ffbf00', // Amber
        neutral: '#64748b', // Slate Gray
      }
    },
  },
  plugins: [],
}
