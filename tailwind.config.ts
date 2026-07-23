import { theme } from './src/styles/tailwind.theme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Vendored approved design components (./design/, a local copy) — scan them so Tailwind
    // generates the classes they use (reuse, not regenerate).
    './design/**/*.{ts,tsx}',
  ],
  theme: { extend: theme },
  plugins: [],
}
