/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#02040a',
          900: '#060a12',
          850: '#0a0f1d',
          800: '#0f172a',
          card: 'rgba(9, 14, 26, 0.75)',
          border: 'rgba(0, 240, 255, 0.18)',
        },
        cyan: {
          glow: '#00f0ff',
          neon: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'obsidian-glow': '0 0 25px -5px rgba(0, 240, 255, 0.12), 0 8px 16px -6px rgba(0, 0, 0, 0.6)',
        'obsidian-card': '0 4px 20px -2px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'cyan-hairline': '0 0 15px -3px rgba(0, 240, 255, 0.25)',
      },
    },
  },
  plugins: [],
}
