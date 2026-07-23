import { useCallback, useEffect, useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, Chip, EmptyState, Field, Icon, Input, PageHeader,
} from "@design/components"

import { getDefaultConcernWords, saveDefaultConcernWords } from "./api"

// SC-079 · FR-19-05 — Admin console screen: maintain the platform DEFAULT concern-word list.
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). The visual truth is the vendored,
// approved design library at ./design/approved (alias `@design`). `@design/screens/DefaultWordLists`
// is a STATIC PREVIEW (no props, a hardcoded DEFAULT_WORDS fixture, no wiring), so it is READ as the
// reference and NEVER imported. This screen is composed from the SAME approved primitives that
// preview composes itself from — PageHeader / Card / CardHeader / CardBody / Chip / Field / Input /
// Button / Icon — in the same order, with the same copy and the same classes. The delta wired on top
// is: loading / loaded / load-failure / empty / error / success states, the add + remove controls,
// and the GET (on mount) + PUT (on save).
// This replaces the previous build's `frame.tsx` + `icons.tsx` + `screens.tsx`, which re-implemented
// the approved primitives on the theme scale and silently drifted (720px → max-w-3xl/768px,
// 13px → text-sm/14px, 15px icons → h-4). Those files are deleted.
//
// Admin-gated by the enclosing route (RequireRole allow={ROLE_ROUTES.admin}); the BE re-checks the
// `manage_word_lists` permission and returns 403 for a role that lacks it (surfaced, never silent).
//
// State model: the working set is the full replacement list the BE persists. On mount the screen
// GETs the CURRENT default and adopts it as the working set, so add/edit/remove act on the real list
// — a PUT then replaces the default with the visibly-edited set rather than an empty blank (the
// Blocker-1 trap: adding one word to an empty editor would wipe every unseen word). A load FAILURE is
// NOT treated as an empty list — the editor is withheld behind a retry so nothing can be saved over a
// list we could not read. A change to the default never touches a school override (GATE G-6, BE-side).
//
// SHELL — logged deviation, not a silent reconciliation. The approved screen wraps its content in
// `AppShell {...chrome('admin', 'Word lists', …)}`. This route mounts UNDER the real, routed app
// shell (`src/components/layout/AppShell`, the `/app` layout route), so importing the approved shell
// here would render a second sidebar; and `chrome('admin')` hardcodes a fixture person ("T. Ng") and
// nav `<a>`s with no href/onClick — dead controls, which step 7 bans. The real internal-admin
// console shell is FR-19-02/04/07 scope. Only the approved CONTENT is composed here.

// ── Approved raw values, copied VERBATIM (do-not-restyle) ─────────────────────
// The barrel exposes no content-column primitive, and `_COMPONENT_API.md` licenses screen-level
// layout utilities written inline on the screen (§Rules; every approved screen does this). This one
// carries a raw px, so it is marked as a reviewed exception rather than re-skinned onto the theme
// scale: Tailwind has no 720px step (max-w-2xl = 672px, max-w-3xl = 768px).
// Source: design/approved/screens/DefaultWordLists.tsx:13
const CONTENT_COL_CLS = "max-w-[720px]" // token-ok: approved value (do-not-restyle)

// The approved note paragraph. 13px is off the Tailwind text scale (text-sm = 14px); the deleted
// screens.tsx re-skinned it to `text-sm` — the exact drift this rewire undoes.
// Source: design/approved/screens/DefaultWordLists.tsx:17
const NOTE_CLS = "mb-3.5 text-[13px] text-neutral-600" // token-ok: approved value (do-not-restyle)

export function DefaultWordListsApp() {
  const [words, setWords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  // Explicit-confirmation gate for the one destructive save the UI can otherwise do silently:
  // persisting an EMPTY set (which clears the default for every non-overriding school).
  const [confirmingEmpty, setConfirmingEmpty] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setLoadFailed(false)
    getDefaultConcernWords()
      .then((res) => {
        setWords(res.words)
        setLoading(false)
      })
      .catch(() => {
        // A read failure must NEVER look like "no default yet" — withhold the editor entirely so a
        // Save cannot replace a list we never saw.
        setLoadFailed(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function addDraft() {
    const word = draft.trim()
    if (!word) return
    // Prevent an obvious duplicate (case-insensitive) client-side; the BE remains authoritative
    // (it lowercases, trims and de-dupes on save).
    const exists = words.some((w) => w.toLowerCase() === word.toLowerCase())
    if (!exists) setWords((prev) => [...prev, word])
    setDraft("")
    setSavedCount(null)
    setError(null)
    setConfirmingEmpty(false)
  }

  function removeWord(word: string) {
    setWords((prev) => prev.filter((w) => w !== word))
    setSavedCount(null)
    setError(null)
    setConfirmingEmpty(false)
  }

  async function save() {
    // Guard the only destructive path: a PUT of an empty set replaces the entire default with
    // nothing. Require an explicit, separate confirmation before it can happen — never silently.
    if (words.length === 0 && !confirmingEmpty) {
      setConfirmingEmpty(true)
      setSavedCount(null)
      setError(null)
      return
    }
    setSaving(true)
    setError(null)
    setSavedCount(null)
    try {
      const res = await saveDefaultConcernWords(words)
      // Adopt the BE's normalized, de-duped list so the UI reflects exactly what was persisted.
      setWords(res.words)
      setSavedCount(res.count)
      setConfirmingEmpty(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the default word list. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        crumb="Concern-word detection defaults"
        title="Default concern-word lists"
        sub="Applied to new schools"
      />

      <div className={CONTENT_COL_CLS}>
        <Card>
          <CardHeader icon={<Icon.Alert />} title="Platform defaults" />
          <CardBody>
            {loading ? (
              <div role="status">
                <p className={NOTE_CLS}>Loading the current default word list…</p>
              </div>
            ) : loadFailed ? (
              <>
                <div role="alert">
                  <Banner tone="danger" icon={<Icon.Alert />}>
                    Couldn't load the current default word list. Editing is disabled until it loads —
                    saving now could replace the whole list with only the words on screen.
                  </Banner>
                </div>
                <Button type="button" variant="ink" icon={<Icon.Check />} onClick={load}>
                  Retry
                </Button>
              </>
            ) : (
              <>
                <p className={NOTE_CLS}>Platform defaults — schools may override.</p>

                {words.length === 0 ? (
                  <EmptyState icon={<Icon.Alert />} title="No default words yet">
                    Add the words that should flag a concern for every school that has not overridden
                    the default.
                  </EmptyState>
                ) : (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {words.map((w) => (
                      <Chip key={w} onRemove={() => removeWord(w)}>
                        {w}
                      </Chip>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    addDraft()
                  }}
                >
                  <Field label="Add a default word">
                    <div className="flex gap-2">
                      {/* The approved `Field` renders an unassociated <label>, so the control carries
                          its own accessible name (same fix the FR-19-01 rewire applied to `AuthField`). */}
                      <Input
                        aria-label="Add a default word"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Type a word and press add"
                        autoComplete="off"
                      />
                      <Button
                        type="submit"
                        variant="ink"
                        icon={<Icon.Plus />}
                        className="shrink-0"
                        disabled={!draft.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </Field>
                </form>

                {error ? (
                  <div role="alert">
                    <Banner tone="danger" icon={<Icon.Alert />}>
                      {error}
                    </Banner>
                  </div>
                ) : null}

                {confirmingEmpty ? (
                  <div role="alert">
                    <Banner tone="danger" icon={<Icon.Alert />}>
                      This clears the entire default list. Every school that has not overridden the
                      default will be left with no default concern words. Add words above, or confirm
                      to save an empty list.
                    </Banner>
                  </div>
                ) : null}

                {savedCount !== null ? (
                  <div role="status">
                    <Banner tone="info" icon={<Icon.Check />}>
                      Saved — {savedCount} default {savedCount === 1 ? "word" : "words"} now apply to
                      schools without an override.
                    </Banner>
                  </div>
                ) : null}

                {confirmingEmpty ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      icon={<Icon.Check />}
                      onClick={save}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Confirm — save an empty list"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmingEmpty(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ink"
                    icon={<Icon.Check />}
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
