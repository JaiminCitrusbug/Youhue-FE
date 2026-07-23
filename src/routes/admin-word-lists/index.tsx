import { useState } from "react"

import { saveDefaultConcernWords } from "./api"
import { DefaultWordListsScreen } from "./screens"

// SC-079 · FR-19-05 — Admin console screen: maintain the platform DEFAULT concern-word list.
// Admin-gated by the enclosing route (RequireRole allow={ROLE_ROUTES.admin}); the BE re-checks the
// `manage_word_lists` permission and returns 403 for a role that lacks it (surfaced, never silent).
//
// State model: the working set is the full replacement list the BE persists. There is no read
// endpoint in the BE contract, so it opens empty; Save (PUT) establishes/replaces the default and
// returns the normalized, de-duped list, which we adopt as the new working set. A default change
// never touches a school override (GATE G-6, enforced BE-side).

export function DefaultWordListsApp() {
  const [words, setWords] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  function addWord(word: string) {
    // Prevent an obvious duplicate (case-insensitive) client-side; the BE remains authoritative
    // (it lowercases, trims and de-dupes on save).
    const exists = words.some((w) => w.toLowerCase() === word.toLowerCase())
    if (!exists) setWords((prev) => [...prev, word])
    setSavedCount(null)
    setError(null)
  }

  function removeWord(word: string) {
    setWords((prev) => prev.filter((w) => w !== word))
    setSavedCount(null)
    setError(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSavedCount(null)
    try {
      const res = await saveDefaultConcernWords(words)
      // Adopt the BE's normalized, de-duped list so the UI reflects exactly what was persisted.
      setWords(res.words)
      setSavedCount(res.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the default word list. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DefaultWordListsScreen
      words={words}
      onAdd={addWord}
      onRemove={removeWord}
      onSave={save}
      saving={saving}
      error={error}
      savedCount={savedCount}
    />
  )
}
