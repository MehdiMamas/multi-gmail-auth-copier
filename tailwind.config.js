/** @type {import('tailwindcss').Config} */
export default {
  content: ['./entrypoints/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f3efe6',
        ink: '#1c1915',
        moss: '#0f6e56',
        mossdeep: '#0b5344',
        clay: '#8c4a32',
        line: '#e2d9cb',
      },
      fontFamily: {
        sans: ['Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Cascadia Code', 'ui-monospace', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
