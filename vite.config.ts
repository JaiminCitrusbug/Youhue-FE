/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy: the SPA calls the BE with a relative `/api/v1` base (src/api/client.ts keeps the
    // token in memory and never hardcodes a host). In dev, forward those calls to the FastAPI BE.
    // Override the target with VITE_API_TARGET if the BE runs elsewhere.
    proxy: {
      '/api/v1': {
        target: process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/setup.ts', 'src/vite-env.d.ts', 'src/styles/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
