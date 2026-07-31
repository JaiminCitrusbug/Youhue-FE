/**
 * SC-039 — Flag record: the immutable event timeline (FR-12-09 · US-12-09) + the acknowledge
 * control and escalated state (FR-12-08 · US-12-08, GATE G-8).
 * REUSES `design/approved/screens/AlertDetail.tsx` in structure, copy and classes for the cards
 * these two tickets' real APIs back — the immutable Timeline, the Acknowledge action, and the
 * escalated badge — composed from `@design/components`. The approved screen is a presentational
 * mock with hardcoded fixtures and no data fetching; this file wires it to the real reads/writes.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled (same convention as
 * `TriageQueue.tsx` in this folder):
 *  (a) No `<AppShell {...chrome(...)}>` wrapper — the app shell already wraps every `/app/*`
 *      route; a second nested shell would double-render nav/header.
 *  (b) The approved screen's band/signal/check-in summary tiles, the check-in quote card, and the
 *      "Suggested next steps" card all render data from OTHER tickets' surfaces (a flag-detail
 *      read, FR-13-04 guidance) that are not built yet — omitted rather than faked. Only the
 *      immutable Timeline and the acknowledge/escalated surface — the DoD of the two tickets this
 *      screen now serves — are real.
 *  (c) FR-12-08 delta: the approved screen's "Acknowledge" button is now wired to the real
 *      `POST /alerts/{flagId}/acknowledge` (previously omitted — FR-12-09 logged it as a dead
 *      control with no backing endpoint yet; this ticket is that endpoint). "Guided response",
 *      "Private note" and "Intervention log" still call OTHER tickets' write paths (FR-13-04/05,
 *      M-13 Phase 2) that do not exist yet — still omitted rather than shipped as dead controls
 *      (root CLAUDE.md: "every control must still route/do something").
 *  (d) FR-12-08 delta: an "Escalated" badge (approved screen has no dedicated escalated-state
 *      element beyond its timeline entries) is added next to the title, in the SAME `Tag`
 *      primitive/position the approved screen uses for its band Tag. It is DERIVED from the
 *      already-fetched timeline (an `escalated` event present) rather than a second endpoint —
 *      escalation is a system/background process (ticket DoD), not a control this screen
 *      triggers, so there is no "Escalate" button here.
 */
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { Button, Card, CardHeader, EmptyState, Icon, PageHeader, Tag, Timeline, type TimelineEntry } from "@design/components"

import {
  acknowledgeAlert, alertActionErrorMessage, getFlagEvents, type FlagTimelineEvent,
} from "./risk-api"

const TYPE_LABEL: Record<FlagTimelineEvent["type"], string> = {
  alerted: "Alerted",
  viewed: "Viewed",
  acted: "Acted",
  escalated: "Escalated",
}

const TYPE_TONE: Record<FlagTimelineEvent["type"], TimelineEntry["tone"]> = {
  alerted: "system",
  escalated: "system",
  viewed: "acted",
  acted: "acted",
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function toEntry(e: FlagTimelineEvent): TimelineEntry {
  return {
    time: timeLabel(e.at),
    who: e.actor ?? "System",
    tone: TYPE_TONE[e.type],
    event: <>{TYPE_LABEL[e.type]}</>,
  }
}

export function AlertDetail() {
  const { flagId } = useParams<{ flagId: string }>()
  const [events, setEvents] = useState<FlagTimelineEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acknowledging, setAcknowledging] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  // Separate from the load `error` (which replaces the card with a full EmptyState) — a failed
  // acknowledge must not claim the timeline "could not be loaded" when it clearly did (same split
  // as `Notifications.tsx`'s `actionError`).
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!flagId) return
    setEvents(null)
    setError(null)
    setAcknowledged(false)
    setActionError(null)
    getFlagEvents(flagId)
      .then((res) => setEvents(res.events))
      .catch(() => setError("Could not load the flag's timeline. Please try again."))
  }, [flagId])

  const loading = events === null && !error
  // Escalation is a system/background process (ticket DoD), not a control this screen triggers —
  // its STATE is derived from the real, already-fetched timeline, never a second endpoint.
  const escalated = events?.some((e) => e.type === "escalated") ?? false

  function handleAcknowledge() {
    if (!flagId) return
    setAcknowledging(true)
    setActionError(null)
    acknowledgeAlert(flagId)
      .then(() => setAcknowledged(true))
      .catch((e: unknown) => setActionError(alertActionErrorMessage(e)))
      .finally(() => setAcknowledging(false))
  }

  return (
    <>
      <PageHeader
        crumb="Alerts & triage"
        title={<>Flag record {escalated && <Tag tone="warn" icon={<Icon.ArrowUp />}>Escalated</Tag>}</>}
        sub={flagId ? `Flag · ${flagId}` : undefined}
      />

      {/* actions — a human acts; acknowledge is primary (FR-12-08 delta: wired for real) */}
      {events && (
        <div className="mb-4 flex flex-wrap gap-2.5">
          <Button
            variant="ink"
            icon={<Icon.CheckCircle />}
            onClick={handleAcknowledge}
            disabled={acknowledging || acknowledged}
          >
            {acknowledged ? "Acknowledged" : "Acknowledge"}
          </Button>
        </div>
      )}
      {actionError && <p className="mb-3 text-xs text-status-danger">{actionError}</p>}

      <Card>
        <CardHeader
          icon={<Icon.Clock />}
          title="Timeline"
          action={<Tag tone="mut" icon={<Icon.Lock />}>Immutable · append-only</Tag>}
        />
        {loading && <EmptyState title="Loading the timeline…" />}
        {error && (
          <EmptyState icon={<Icon.Alert />} title="Timeline could not be loaded">
            {error}
          </EmptyState>
        )}
        {events && events.length === 0 && (
          <EmptyState icon={<Icon.Clock />} title="No events recorded yet">
            Nothing has been alerted, viewed, acted on, or escalated for this flag yet.
          </EmptyState>
        )}
        {events && events.length > 0 && <Timeline entries={events.map(toEntry)} />}
      </Card>
    </>
  )
}
