# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual\visual.spec.ts >> SC-04 maintenance matches approved design @ desktop
- Location: ..\tests\visual\visual.spec.ts:68:5

# Error details

```
Error: A snapshot doesn't exist at C:\Users\ProductTeam\Desktop\YouhueDryRUn\DocumentsGeneration\Youhue-root\tests\visual\visual.spec.ts-snapshots\maintenance-desktop-chromium-win32.png, writing actual.
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Down for maintenance" [level=1] [ref=e5]
  - paragraph [ref=e6]: Youhue is briefly unavailable.
```

# Test source

```ts
  1  | // Playwright visual-regression suite. Place in the FE repo (e.g. tests/visual/).
  2  | // Baseline screenshots are generated from the APPROVED design component, not a previous build.
  3  | // First run with `--update-snapshots` against the approved render to set baselines, then commit them.
  4  | //
  5  | // ⚠ THE TOLERANCE IS NOT HARDCODED HERE — ON PURPOSE.
  6  | // On school24 someone widened this exact number (0.02 → 0.04) across 9 files to hide font/spacing
  7  | // drift, and only the owner caught it (ledger LED-004). The number lives in `.thresholds.yml`,
  8  | // owner-gated and watched by `make guard`.
  9  | //
  10 | // ⚠ THE SCREEN LIST IS NOT HARDCODED HERE EITHER (Wave-0, audit 09B-4).
  11 | // The kit used to ship two hardcoded example screens from an old project, so "visual regression
  12 | // PASS" could mean "two screens of a different product matched". The list now comes from
  13 | // tests/visual/screens.json, generated from the signed component map — and this suite FAILS
  14 | // CLOSED if the file is missing or empty. Coverage you can see, not coverage you assume.
  15 | //
  16 | //   screens.json — one entry per approved screen/state (design/index/component-map.md):
  17 | //   [ { "id": "SC-01", "name": "login-default", "path": "/login" }, ... ]
  18 | 
  19 | import { existsSync, readFileSync } from "node:fs";
  20 | import { dirname, join } from "node:path";
  21 | import { fileURLToPath } from "node:url";
  22 | import { test, expect } from "@playwright/test";
  23 | import { requireNumber } from "../_thresholds";
  24 | 
  25 | // The tolerance comes from .thresholds.yml (owner-gated, hash-signed). `requireNumber` throws if
  26 | // it is missing, so this gate cannot silently pass with no number.
  27 | const TOLERANCE = requireNumber("gates.visual_regression.max_diff_pixel_ratio");
  28 | 
  29 | // The screen inventory comes from screens.json next to this spec. Missing/empty = FAIL, not skip.
  30 | const HERE = dirname(fileURLToPath(import.meta.url));
  31 | const SCREENS_FILE = join(HERE, "screens.json");
  32 | 
  33 | type Screen = { id: string; name: string; path: string };
  34 | 
  35 | function loadScreens(): Screen[] {
  36 |   if (!existsSync(SCREENS_FILE)) {
  37 |     throw new Error(
  38 |       `[visual] ${SCREENS_FILE} not found. Generate it from the signed component map ` +
  39 |       `(design/index/component-map.md) — one {id, name, path} entry per approved screen/state. ` +
  40 |       `A visual gate with no screen list is not a gate (see screens.json.example).`
  41 |     );
  42 |   }
  43 |   const screens = JSON.parse(readFileSync(SCREENS_FILE, "utf8")) as Screen[];
  44 |   if (!Array.isArray(screens) || screens.length === 0) {
  45 |     throw new Error(
  46 |       `[visual] ${SCREENS_FILE} is empty. Every approved screen in the component map needs a row — ` +
  47 |       `an empty list would make this gate pass while checking nothing.`
  48 |     );
  49 |   }
  50 |   for (const s of screens) {
  51 |     if (!s.id || !s.name || !s.path) {
  52 |       throw new Error(`[visual] bad entry in screens.json (need id, name, path): ${JSON.stringify(s)}`);
  53 |     }
  54 |   }
  55 |   return screens;
  56 | }
  57 | 
  58 | const screens = loadScreens();
  59 | 
  60 | const breakpoints = [
  61 |   { label: "mobile",  width: 375,  height: 812 },
  62 |   { label: "tablet",  width: 768,  height: 1024 },
  63 |   { label: "desktop", width: 1280, height: 800 },
  64 | ];
  65 | 
  66 | for (const s of screens) {
  67 |   for (const bp of breakpoints) {
  68 |     test(`${s.id} ${s.name} matches approved design @ ${bp.label}`, async ({ page }) => {
  69 |       await page.setViewportSize({ width: bp.width, height: bp.height });
  70 |       await page.goto(s.path);
  71 |       await page.waitForLoadState("networkidle");
  72 |       // Baseline = the approved screen. Tolerance from .thresholds.yml (owner-gated) — LED-004.
> 73 |       await expect(page).toHaveScreenshot(`${s.name}-${bp.label}.png`, {
     |       ^ Error: A snapshot doesn't exist at C:\Users\ProductTeam\Desktop\YouhueDryRUn\DocumentsGeneration\Youhue-root\tests\visual\visual.spec.ts-snapshots\maintenance-desktop-chromium-win32.png, writing actual.
  74 |         maxDiffPixelRatio: TOLERANCE,
  75 |         animations: "disabled",
  76 |       });
  77 |     });
  78 |   }
  79 | }
  80 | 
```