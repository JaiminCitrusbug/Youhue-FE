import { theme } from './src/styles/tailwind.theme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Reused approved design components live in the design repo — scan them so Tailwind
    // generates the classes they use (agents/design-handoff.md: reuse, not regenerate).
    '../Youhue-DESIGN/approved/**/*.{ts,tsx}',
  ],
  theme: { extend: theme },
  plugins: [],
}
