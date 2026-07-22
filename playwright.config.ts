import { defineConfig, devices } from "@playwright/test"

// Runtime gate config for the Youhue whole-product + visual specs (approved deviation W-03:
// runs against LIVE dev servers, not the Docker sandbox).
//
// TWO SERVERS ARE REQUIRED and are started EXTERNALLY (the BE needs its own .venv + DATABASE_URL,
// so it is not managed here):
//
//   BE (FastAPI, :8000)  — from Youhue-BE:
//     $env:DATABASE_URL="postgresql+psycopg://youhue:youhue@localhost:5433/youhue_test"
//     $env:ENVIRONMENT="local"
//     .venv\Scripts\python.exe -m uvicorn main:app --port 8000 --host 127.0.0.1
//   (seed once first:  .venv\Scripts\python.exe seed_e2e.py  with the same DATABASE_URL)
//
//   FE (Vite/React, :5173) — started by the `webServer` block below (npm run dev). The Vite dev
//   proxy forwards `/api/v1` -> http://127.0.0.1:8000 so the SPA talks to the BE.
//
// The specs live in the workspace-root tests/ tree (../tests), shared across FE/BE.

export default defineConfig({
  testDir: "../tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start the FE only; the BE is external (see header). reuseExistingServer keeps an
  // already-running `npm run dev` instead of spawning a second one.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
