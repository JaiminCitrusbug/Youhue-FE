import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Banner, Card, CardBody, CardHeader, EmptyState, Icon, KV, MoodFace, PageHeader } from "@design/components"

import { moodEntryForValue } from "../checkin/moods"
import { historyDateLabel } from "../student-history/format"
import {
  getStudentDetail, getStudentSummary, StudentDetailApiError,
  type StudentDetail, type StudentSummary,
} from "./api"

// FR-10-02 · SC-028 — a teacher's drill-in from the class dashboard into a single student: mood
// history, reflections and participation (this ticket's DoD, verbatim: `GET /students/{id}/detail`
// -> `{ mood_history, reflections, participation_rate }`).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// StudentDetail.tsx` is a STATIC PREVIEW bundling FAR more than this ticket's DoD: an "Immediate
// flag" tag (risk/alert data — FR-12-*/FR-13-*, not built by this ticket), an "Assign
// activity"/"Suggested activity" panel (Premium AI-suggested activities — FR-14-03, explicitly
// Phase 3 out-of-scope per this ticket's own out-of-scope line), and a "Respond" panel (guided
// response / private note / intervention log — the M-13 shared intervention log, explicitly Phase
// 2 out-of-scope). None of those has a backing field this ticket's endpoint returns — composing
// them would either fabricate data or ship dead controls (both banned by step 7), so they are
// DROPPED here, logged rather than silently narrowed. The mood-over-time section is ALSO not
// reproduced as the approved screen's hand-plotted SVG polyline (that shape has no real x/y-per-
// pixel data behind it) — instead it reuses the SAME real-data list pattern FR-08-01's own
// `student-history` screen already established for "moods over time" (`MoodFace` + `moodEntryForValue`
// per entry), which is the more honest rendering of a real, variable-length `mood_history[]`.
//
// SHELL — same logged deviation as every other staff route this session: this mounts under the
// real routed `AppShell` (`/app` layout route), so only the approved CONTENT (participation KV +
// mood history + reflections) is composed here.

export function StudentDetailApp() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<StudentSummary | null>(null)
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return
    let cancelled = false
    Promise.all([getStudentSummary(studentId), getStudentDetail(studentId)])
      .then(([s, d]) => {
        if (cancelled) return
        setSummary(s)
        setDetail(d)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(
          e instanceof StudentDetailApiError ? e.message : "Couldn't load this student. Please try again.",
        )
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loadError) {
    return (
      <div role="alert">
        <Banner tone="danger" icon={<Icon.Alert />}>
          {loadError}
        </Banner>
      </div>
    )
  }
  if (summary === null || detail === null) return <EmptyState title="Loading student…" />

  return (
    <>
      <PageHeader
        crumb="Roster"
        title={summary.display_name}
        sub={`Age band ${summary.age_band}`}
        right={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[13px] font-semibold text-coral-text" // token-ok: text-[13px] muted-meta scale already used platform-wide (e.g. subscription/index.tsx)
          >
            ← Back to dashboard
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-1">
        <KV label="Participation this week">
          {`${Math.round(detail.participation_rate * 100)}%`}
        </KV>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<Icon.Heart />} title="Mood over time" />
          <CardBody flush>
            {detail.mood_history.length === 0 ? (
              <EmptyState icon={<Icon.Clock />} title="No check-ins yet">
                This student's moods will show up here once they check in.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-2.5 p-3.5">
                {detail.mood_history.map((m) => {
                  const mood = moodEntryForValue(m.mood_value)
                  return (
                    <div key={m.local_date} className="flex items-center gap-3">
                      {mood ? <MoodFace mood={mood.mood} size={28} className="shrink-0" /> : null}
                      <div className="text-[12.5px] font-bold">{historyDateLabel(m.local_date)}</div> {/* token-ok: approved value, verbatim from screens/MyHistory.tsx:95 (do-not-restyle) */}
                      {mood ? (
                        <span className="ml-auto text-[12px] font-semibold text-neutral-600"> {/* token-ok: approved value, verbatim from screens/MyHistory.tsx:98 (do-not-restyle) */}
                          {mood.label}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<Icon.Message />} title="Reflections" />
          <CardBody flush>
            {detail.reflections.length === 0 ? (
              <EmptyState icon={<Icon.Message />} title="No reflections yet">
                This student's reflections will show up here once they add one.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-2.5 p-3.5">
                {detail.reflections.map((r) => (
                  <div key={r.local_date}>
                    <div className="text-[12.5px] font-bold">{historyDateLabel(r.local_date)}</div> {/* token-ok: approved value, verbatim from screens/MyHistory.tsx:95 (do-not-restyle) */}
                    <div className="text-[12px] font-medium text-neutral-500">{r.reflection_text}</div> {/* token-ok: approved value, verbatim from screens/MyHistory.tsx:96 (do-not-restyle) */}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
