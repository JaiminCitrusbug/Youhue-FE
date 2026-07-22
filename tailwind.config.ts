import { theme } from './src/styles/tailwind.theme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: theme },
  plugins: [],
}
