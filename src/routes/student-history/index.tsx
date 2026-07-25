import { useEffect, useState } from "react"

import { Banner, Card, CardBody, CardHeader, EmptyState, Icon, MoodFace } from "@design/components"

import { moodEntryForValue } from "../checkin/moods"
import { getMyHistory, HistoryApiError, type HistoryResponse } from "./api"
import { historyDateLabel } from "./format"

// FR-08-01 · SC-025 — the student's OWN check-in history: their own moods over time + their own
// reflections, never anyone else's (BE `GET /students/me/history` is self-scoped via `StudentDep`
// — no student_id param exists anywhere in the request, structurally the same guarantee FR-04-01's
// submit endpoint already established).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// MyHistory.tsx` is a STATIC PREVIEW (PhoneFrame device chrome, a hardcoded 7-day streak, a
// hardcoded "This week" mood summary, a dead `href="#"` "Month ›" link, and 4 fixture rows) — read
// as the reference, never imported. This screen reuses the SAME approved primitives the preview
// composes from (`Card`/`CardHeader`/`CardBody`/`MoodFace`/`Icon`/`EmptyState`) for its ONE section
// that maps to real data — the "Recent" list (mood + note per day) — and drops the streak counter,
// "this week" summary tiles, and the "Month ›" drill-in link: none of those are backed by any field
// this ticket's endpoint returns (`moods_over_time[]` / `reflections[]` only), and inventing a
// streak/weekly-aggregate figure or a dead link is exactly what CLAUDE.md step 7 and the "no dead
// controls" rule forbid. Flagged here rather than silently narrowed.
//
// SHELL — same logged deviation as every other student/staff route this session (e.g.
// `roster/index.tsx`): the approved screen wraps itself in its own device frame; this route mounts
// under the real routed `StudentShell` (`/student` layout route), so only the approved CONTENT
// (the Recent list) is composed here.

interface HistoryRow {
  date: string
  mood: ReturnType<typeof moodEntryForValue>
  reflection: string | null
}

function toRows(data: HistoryResponse): HistoryRow[] {
  const reflectionByDate = new Map(data.reflections.map((r) => [r.local_date, r.reflection_text]))
  return data.moods_over_time.map((m) => ({
    date: m.local_date,
    mood: moodEntryForValue(m.mood_value),
    reflection: reflectionByDate.get(m.local_date) ?? null,
  }))
}

export function MyHistoryApp() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getMyHistory()
      .then((data) => {
        if (cancelled) return
        setRows(toRows(data))
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(
          e instanceof HistoryApiError ? e.message : "Couldn't load your history. Please try again.",
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  function body() {
    if (loadError) {
      return (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>
            {loadError}
          </Banner>
        </div>
      )
    }
    if (rows === null) return <EmptyState title="Loading your history…" />
    if (rows.length === 0) {
      // Ticket Scenario 3 — a clear empty state, never an error, before any check-ins exist.
      return (
        <EmptyState icon={<Icon.Clock />} title="No check-ins yet">
          Your moods and reflections will show up here once you check in for the first time.
        </EmptyState>
      )
    }
    return (
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div
            key={r.date}
            className="flex items-center gap-3 rounded-[10px] border border-neutral-200 bg-surface px-3.5 py-2.5" // token-ok: approved value, verbatim from screens/MyHistory.tsx:92 (do-not-restyle)
          >
            {r.mood ? <MoodFace mood={r.mood.mood} size={34} className="shrink-0" /> : null}
            <div>
              <div className="text-[12.5px] font-bold">{historyDateLabel(r.date)}</div> {/* token-ok: approved value, verbatim from screens/MyHistory.tsx:95 (do-not-restyle) */}
              {r.reflection ? (
                <div className="text-[12px] font-medium text-neutral-500">{r.reflection}</div> // token-ok: approved value, verbatim from screens/MyHistory.tsx:96 (do-not-restyle)
              ) : null}
            </div>
            {r.mood ? (
              <span
                className="ml-auto text-[12px] font-semibold text-neutral-600" // token-ok: approved value, verbatim from screens/MyHistory.tsx:98 (do-not-restyle)
              >
                {r.mood.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader icon={<Icon.Clock />} title="My history" />
      <CardBody flush>{body()}</CardBody>
    </Card>
  )
}
