/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        red: {
          primary: '#c62828', bright: '#e53935', accent: '#d32f2f',
          light: '#ef9a9a', glow: 'rgba(198,40,40,0.12)',
          50: '#fff5f5', 100: '#fff0f0',
        },
      },
      fontFamily: { mono: ['"IBM Plex Mono"', 'monospace'], sans: ['"IBM Plex Sans"', 'sans-serif'] },
    },
  },
  plugins: [],
}
