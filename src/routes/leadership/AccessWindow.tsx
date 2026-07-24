/**
 * SC-063 — Access-window configuration (FR-16-02 · US-16-02, surfacing config that FR-07-03/
 * FR-07-04 will later ENFORCE and resolve against a calendar period — this ticket only stores +
 * surfaces start/end/timezone, it does not build enforcement). REUSES
 * `design/approved/screens/AccessWindow.tsx` in structure, copy and classes, composed from
 * `@design/components`. Adds the delta — a real GET-backed snapshot, native `type="time"` inputs
 * wired to state, the Save action wired to a real PATCH, loading/error states, and real disabled
 * states while a save is in flight.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('leadership', ...)}>` wrapper — same reasoning already logged on
 *      `StaffManagement.tsx` in this folder.
 *  (b) The approved screen's Timezone `<Select>` has exactly ONE hardcoded option
 *      ("Europe/London (GMT+1)") — a single-choice select is a dead control. This ticket surfaces
 *      a small, REAL set of IANA zones (the BE validates any IANA name via `zoneinfo`), so the
 *      control actually changes what gets saved.
 *  (c) "Opens"/"Closes" use native `<input type="time">` (still the shared `Input` primitive,
 *      just with `type="time"`) instead of a plain text default value, for a real, constrained
 *      time picker rather than free text that could 422 on save for a typo.
 */
import { useCallback, useEffect, useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, Input, PageHeader, Select,
} from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { getSettings, leadershipErrorMessage, updateAccessWindow, type SchoolSettings } from "./api"

// A real, working set of IANA zones — not exhaustive, but every entry is a genuine choice the BE
// accepts (validated via Python's `zoneinfo`), so the control is never a single dead option.
const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
]

const DEFAULT_START = "08:30"
const DEFAULT_END = "09:30"
const DEFAULT_TZ = "UTC"

export function AccessWindow() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [windowStart, setWindowStart] = useState(DEFAULT_START)
  const [windowEnd, setWindowEnd] = useState(DEFAULT_END)
  const [timezone, setTimezone] = useState(DEFAULT_TZ)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    getSettings(schoolId)
      .then((res) => {
        setSettings(res.settings)
        const w = res.settings.access_window
        setWindowStart(w?.window_start.slice(0, 5) ?? DEFAULT_START)
        setWindowEnd(w?.window_end.slice(0, 5) ?? DEFAULT_END)
        setTimezone(w?.timezone ?? DEFAULT_TZ)
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

  function save() {
    if (!schoolId) return
    setSaving(true)
    setSaveError(null)
    updateAccessWindow(schoolId, { window_start: windowStart, window_end: windowEnd, timezone })
      .then((res) => {
        setSettings(res.settings)
        setSaving(false)
      })
      .catch((e: unknown) => {
        setSaveError(leadershipErrorMessage(e))
        setSaving(false)
      })
  }

  function body() {
    if (loading) return <EmptyState title="Loading access window…" />
    if (error || !settings) {
      return (
        <EmptyState icon={<Icon.Alert />} title="Access window could not be loaded">{error}</EmptyState>
      )
    }
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens">
            <Input
              type="time"
              aria-label="Opens"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
            />
          </Field>
          <Field label="Closes">
            <Input
              type="time"
              aria-label="Closes"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Timezone">
          <Select
            aria-label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </Select>
        </Field>
        <Banner icon={<Icon.Check />}>
          Enforced server-side — check-ins outside the window are blocked.
        </Banner>
        {saveError && <Banner tone="danger" icon={<Icon.Alert />}>{saveError}</Banner>}
        <div className="flex gap-2.5">
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
        crumb="Calendar & window"
        title="Access-window configuration"
        sub="When students can check in each school day"
      />

      <div className="max-w-[580px]"> {/* token-ok: approved value (do-not-restyle, screens/AccessWindow.tsx:13) */}
        <Card>
          <CardHeader icon={<Icon.Clock />} title="Check-in window" />
          <CardBody>{body()}</CardBody>
        </Card>
      </div>
    </>
  )
}
