/**
 * SC-060 — Concern-word lists (FR-16-02 · US-16-02, surfacing FR-19-05's platform default +
 * FR-12-01's consumer). REUSES `design/approved/screens/ConcernWords.tsx` in structure, copy and
 * classes, composed from `@design/components`. Adds the delta — a real GET-backed snapshot, the
 * add/remove/reset/save interactions wired to the real PATCH, loading/error states, and real
 * disabled states while a save is in flight.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('leadership', ...)}>` wrapper — same reasoning already logged on
 *      `StaffManagement.tsx` in this folder.
 *  (b) "Reset to default" clears the LOCAL, unsaved edit back to zero additions — it does not
 *      call the API by itself; "Save" is what persists (matches the two-button layout: reset then
 *      save, not two independent server actions).
 */
import { useCallback, useEffect, useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, Chip, EmptyState, Field, Icon, Input, PageHeader,
} from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { getSettings, leadershipErrorMessage, updateConcernWords, type SchoolSettings } from "./api"

export function ConcernWords() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [additions, setAdditions] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    getSettings(schoolId)
      .then((res) => {
        setSettings(res.settings)
        setAdditions(res.settings.concern_words.school_additions)
        setLoading(false)
      })
      .catch((e: unknown) => {
        setError(leadershipErrorMessage(e))
        setLoading(false)
      })
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  function addWord() {
    const value = inputValue.trim().toLowerCase()
    if (!value) return
    const defaults = settings?.concern_words.platform_defaults ?? []
    if (!defaults.includes(value) && !additions.includes(value)) {
      setAdditions((prev) => [...prev, value])
    }
    setInputValue("")
  }

  function removeWord(word: string) {
    setAdditions((prev) => prev.filter((w) => w !== word))
  }

  function resetToDefault() {
    setAdditions([])
  }

  function save() {
    if (!schoolId) return
    setSaving(true)
    setSaveError(null)
    updateConcernWords(schoolId, additions)
      .then((res) => {
        setSettings(res.settings)
        setAdditions(res.settings.concern_words.school_additions)
        setSaving(false)
      })
      .catch((e: unknown) => {
        setSaveError(leadershipErrorMessage(e))
        setSaving(false)
      })
  }

  function body() {
    if (loading) return <EmptyState title="Loading concern words…" />
    if (error || !settings) {
      return (
        <EmptyState icon={<Icon.Alert />} title="Concern words could not be loaded">
          {error}
        </EmptyState>
      )
    }
    return (
      <>
        <p className="mb-3 text-[13px] text-neutral-700"> {/* token-ok: approved value (do-not-restyle, screens/ConcernWords.tsx:28) */}
          Your school&rsquo;s list = platform defaults + your additions. Default words cannot be
          removed; additions you made show an <b>×</b> and can be taken off.
        </p>

        <div className="mb-3.5 flex flex-wrap gap-2">
          {settings.concern_words.platform_defaults.map((w) => <Chip key={w}>{w}</Chip>)}
          {additions.map((w) => <Chip key={w} onRemove={() => removeWord(w)}>{w}</Chip>)}
        </div>

        <Field label="Add a word or phrase">
          <Input
            placeholder="Type a word, then press Enter to add…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addWord()
              }
            }}
          />
        </Field>

        {saveError && <Banner tone="danger" icon={<Icon.Alert />}>{saveError}</Banner>}

        <div className="mt-3 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" disabled={saving} onClick={resetToDefault}>
            Reset to default
          </Button>
          <Button type="button" variant="ink" icon={<Icon.Check />} disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        crumb="Safeguarding config · what text triggers a flag"
        title="Concern-word lists"
        sub="Platform defaults + your school additions"
      />

      <Banner tone="warn" icon={<Icon.Flag />}>
        Editing these changes what triggers a flag — err toward flagging.
      </Banner>

      <Card>
        <CardHeader
          icon={<Icon.Flag />}
          title="Concern words (school)"
          hint="defaults locked · additions removable"
        />
        <CardBody>{body()}</CardBody>
      </Card>
    </>
  )
}
