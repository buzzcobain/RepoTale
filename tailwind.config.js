import daisyui from 'daisyui';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const daisyuiThemes = require('daisyui/src/theming/themes');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#141722',
          900: '#0f121a',
          950: '#090b10',
        },
        zinc: {
          750: '#202023',
          850: '#141416',
          925: '#0c0c0e',
          950: '#08080a',
        },
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        dim: {
          ...daisyuiThemes['dim'],
          "primary": "#3b82f6",
          "primary-content": "#ffffff",
          "secondary": "#64748b",
          "accent": "#0ea5e9",
          "neutral": "#181b24",
          "neutral-content": "#e2e8f0",
          "base-100": "#090b10",
          "base-200": "#11141c",
          "base-300": "#181c28",
          "base-content": "#e5e7eb",
          "info": "#38bdf8",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.375rem",
        },
      },
      "night",
      "dark",
    ],
    darkTheme: "dim",
    base: true,
    styled: true,
    utils: true,
  },
}

