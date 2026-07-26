import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // `worktrees` excludes per-ticket git worktrees nested under this repo (Batch-03's convention) —
  // each is a full nested checkout with its own `design/` reference copy; without this, `eslint .`
  // (the exact command `npm run lint` / the gate invoke) walks into every other lane's worktree and
  // fails on ITS pre-existing/unrelated findings (found live, blocking the gate, 2026-07-26 — see
  // KIT_ADAPTATIONS A-8 for the identical mypy-side bug this mirrors).
  { ignores: ['design', 'dist', 'coverage', 'node_modules', '.stryker-tmp', 'reports', 'worktrees'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
