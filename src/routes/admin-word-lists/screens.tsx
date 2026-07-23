import { useState } from "react"

import { Card, CardBody, CardHeader, Chip, Field, InkButton, PageHeader, WordInput } from "./frame"
import { Icon } from "./icons"

// SC-079 — Default concern-word lists · FR-19-05. Componentized from the approved design
// (Youhue-DESIGN/approved/screens/DefaultWordLists.tsx) on the shared theme ("Ink & Coral",
// src/styles/tailwind.theme.ts). Presentational + light local state for the add-word field only;
// all wiring (load/save via the PUT) lives in the container (./index). Design classes are
// reproduced on the shared theme / 4px scale so token-drift stays 0 (no raw px/hex).
//
// The BE editor model is a FULL-REPLACEMENT set: add/edit/remove entries here, then Save writes the
// whole list. There is no read endpoint, so the working set opens empty and Save establishes the
// platform default that applies to every school without its own override (GATE G-6).

export interface DefaultWordListsScreenProps {
  words: string[]
  onAdd: (word: string) => void
  onRemove: (word: string) => void
  onSave: () => void
  saving?: boolean
  error?: string | null
  /** Set to the persisted entry count after a successful save (drives the confirmation). */
  savedCount?: number | null
}

export function DefaultWordListsScreen({
  words,
  onAdd,
  onRemove,
  onSave,
  saving = false,
  error = null,
  savedCount = null,
}: DefaultWordListsScreenProps) {
  const [draft, setDraft] = useState("")

  function addDraft() {
    const word = draft.trim()
    if (!word) return
    onAdd(word)
    setDraft("")
  }

  return (
    <>
      <PageHeader
        crumb="Concern-word detection defaults"
        title="Default concern-word lists"
        sub="Applied to new schools"
      />

      <div className="max-w-3xl">
        <Card>
          <CardHeader icon={<Icon.Alert />} title="Platform defaults" />
          <CardBody>
            <p className="mb-3.5 text-sm text-neutral-600">
              Platform defaults — schools may override.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {words.length === 0 ? (
                <p className="text-sm text-neutral-400">No default words yet — add one below.</p>
              ) : (
                words.map((w) => (
                  <Chip key={w} onRemove={() => onRemove(w)}>
                    {w}
                  </Chip>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                addDraft()
              }}
            >
              <Field label="Add a default word" htmlFor="add-word">
                <div className="flex gap-2">
                  <WordInput
                    id="add-word"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a word and press add"
                    autoComplete="off"
                  />
                  <InkButton type="submit" disabled={!draft.trim()} icon={<Icon.Plus />}>
                    Add
                  </InkButton>
                </div>
              </Field>
            </form>

            {error ? (
              <p role="alert" className="mb-3 text-sm font-semibold text-status-danger">
                {error}
              </p>
            ) : null}

            {savedCount !== null ? (
              <p role="status" className="mb-3 text-sm font-semibold text-status-ok">
                Saved — {savedCount} default {savedCount === 1 ? "word" : "words"} now apply to
                schools without an override.
              </p>
            ) : null}

            <InkButton
              type="button"
              onClick={onSave}
              disabled={saving || words.length === 0}
              icon={<Icon.Check />}
            >
              {saving ? "Saving…" : "Save"}
            </InkButton>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
