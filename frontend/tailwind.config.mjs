/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--bg-elevated)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-dim)',
        gold: 'var(--gold)',
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
