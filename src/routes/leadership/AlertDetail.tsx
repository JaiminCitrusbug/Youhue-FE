/**
 * SC-039 — Flag record: the immutable event timeline (FR-12-09 · US-12-09).
 * REUSES `design/approved/screens/AlertDetail.tsx` in structure, copy and classes for the ONE
 * card this ticket's real API backs — the immutable Timeline — composed from `@design/components`.
 * The approved screen is a presentational mock with hardcoded fixtures and no data fetching; this
 * file wires it to the real, render-only `GET /flags/{id}/events` read.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled (same convention as
 * `TriageQueue.tsx` in this folder):
 *  (a) No `<AppShell {...chrome(...)}>` wrapper — the app shell already wraps every `/app/*`
 *      route; a second nested shell would double-render nav/header.
 *  (b) The approved screen's band/signal/check-in summary tiles, the check-in quote card, and the
 *      "Suggested next steps" card all render data from OTHER tickets' surfaces (a flag-detail
 *      read, FR-13-04 guidance) that are not built yet — omitted rather than faked. Only the
 *      immutable Timeline — this ticket's own DoD — is real.
 *  (c) The approved screen's action buttons (Acknowledge, Guided response, Private note,
 *      Intervention log) call OTHER tickets' write paths (FR-12-08 acknowledge, FR-13-04/05
 *      guidance + note, M-13 Phase 2 intervention log) that do not exist yet — omitted rather than
 *      shipped as dead controls (root CLAUDE.md: "every control must still route/do something").
 *      This screen is render-only for the timeline, per this ticket's own DoD.
 */
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { Card, CardHeader, EmptyState, Icon, PageHeader, Tag, Timeline, type TimelineEntry } from "@design/components"

import { getFlagEvents, type FlagTimelineEvent } from "./risk-api"

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

  useEffect(() => {
    if (!flagId) return
    setEvents(null)
    setError(null)
    getFlagEvents(flagId)
      .then((res) => setEvents(res.events))
      .catch(() => setError("Could not load the flag's timeline. Please try again."))
  }, [flagId])

  const loading = events === null && !error

  return (
    <>
      <PageHeader crumb="Alerts & triage" title="Flag record" sub={flagId ? `Flag · ${flagId}` : undefined} />
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
