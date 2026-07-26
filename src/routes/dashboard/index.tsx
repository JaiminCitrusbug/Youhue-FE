import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  Banner, Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, Input, PageHeader, Select,
  StatTile, Table, Trend,
} from "@design/components"

import {
  getClassDashboard, getClassRoster, getMyClasses, DashboardApiError,
  type ClassDashboard, type RosterStudent,
} from "./api"

// FR-10-01 · SC-027 — the class dashboard: a teacher's weighted mood index + trend for their
// class, and a header stating whose data, which period/timezone, and live-or-as-of (ticket
// §Must-nots — this is header content, not optional).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// ClassDashboard.tsx` is a STATIC PREVIEW with device chrome and THREE stat tiles (mood index,
// participation, open flags) plus a per-student "needing a look" table with mood trend/flag/
// drill-in per row, and no interactive filter control at all (its "This week" text is static
// copy). FR-10-01's own DoD is narrower: `GET /classes/{id}/dashboard` returns ONLY
// `{ mood_index, trend, as_of, period, timezone }` — no participation count, no flag count.
// Composing the participation/flags tiles here would either recompute a figure client-side
// (forbidden — SRS §13.5) or fabricate data with no backing endpoint (forbidden — same class of
// call FR-08-01 made dropping MyHistory's streak/week-summary/dead-link). This screen therefore
// reuses ONLY the approved primitives its real sections need: `PageHeader` (whose/period/tz/live)
// + one `StatTile` (mood index) with a `Trend` chip for the direction.
//
// FR-10-02 ADDS the roster table below (`GET /classes/{id}/roster`, a minimal justified GET-add —
// same precedent as FR-02-03's class-list endpoint — needed because "click into a single student"
// (FR-10-02 Scenario 1) has nothing to click without real rows). Each row drills into
// `/app/dashboard/students/:id` (`student-detail` route module) for that student's own mood
// history/reflections/participation — no flag/trend column per row (no backing data yet; that's
// FR-12-*'s flag pipeline), so only the name + a real "View" action are shown, never a dead
// control. Fetched once on mount — the roster itself doesn't change when the time-range filter
// changes, only the dashboard figures do.
//
// FR-10-03 ADDS the range filter: a `Select` (this week / month / term, from `@design/components`
// forms.tsx — the approved screen has no filter control to copy, so this composes the SAME
// primitive InviteColleague.tsx/ConcernWords.tsx already use for a form control) plus a native
// date `Input` for "around a specific date" (Scenario 2) — selecting either re-fetches the real
// `range=` query, never re-derives the currently-shown figures from the prior fetch. FR-10-05
// (empty/loading/error polish) extends this screen later.
//
// CLASS SELECTION — not in this ticket's scope (no class-picker screen exists yet; "drill into a
// student"/multi-class UX is FR-10-02/03's job). Reuses FR-02-03's existing `GET /classes/mine`
// and shows the FIRST owned class. Known gap, logged rather than silently worked around: `/mine`
// only returns OWNED classes (not shared-scope ones), so a `support` co-teacher with only shared
// access sees "no classes yet" here even though the BE dashboard endpoint itself would happily
// serve them — a real class-picker/broader-listing endpoint is future work, not invented here.
//
// SHELL — same logged deviation as every other staff route this session: the approved screen
// wraps itself in `AppShell` + its own nav; this route mounts under the real routed `AppShell`
// (`/app` layout route), so only the approved CONTENT is composed here.

function trendIcon(dir: ClassDashboard["trend"]) {
  if (dir === "up") return <Icon.ArrowUp />
  if (dir === "down") return <Icon.ArrowDown />
  return <Icon.Minus />
}

function trendLabel(dir: ClassDashboard["trend"]) {
  if (dir === "up") return "Trending up vs last period"
  if (dir === "down") return "Trending down vs last period"
  return "Flat vs last period"
}

const RANGE_OPTIONS = [
  { value: "this_week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "term", label: "This term" },
] as const

export function ClassDashboardApp() {
  const navigate = useNavigate()
  const [classId, setClassId] = useState<string | null>(null)
  const [dash, setDash] = useState<ClassDashboard | null>(null)
  const [roster, setRoster] = useState<RosterStudent[] | null>(null)
  const [noClasses, setNoClasses] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [range, setRange] = useState<string>("this_week")
  const [aroundDate, setAroundDate] = useState("")

  const loadDashboard = useCallback((id: string, r: string) => {
    setLoadError(null)
    getClassDashboard(id, r === "this_week" ? undefined : r)
      .then((d) => setDash(d))
      .catch((e: unknown) => {
        setLoadError(
          e instanceof DashboardApiError ? e.message : "Couldn't load the dashboard. Please try again.",
        )
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    getMyClasses()
      .then((classes) => {
        if (cancelled) return
        if (classes.length === 0) {
          setNoClasses(true)
          return
        }
        const id = classes[0].id
        setClassId(id)
        return Promise.all([getClassDashboard(id, undefined), getClassRoster(id)]).then(([d, r]) => {
          if (cancelled) return
          setDash(d)
          setRoster(r)
        })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(
          e instanceof DashboardApiError ? e.message : "Couldn't load the dashboard. Please try again.",
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  function onRangeChange(value: string) {
    setRange(value)
    setAroundDate("")
    if (classId) loadDashboard(classId, value)
  }

  function onAroundDateChange(value: string) {
    setAroundDate(value)
    if (classId && value) {
      setRange("around")
      loadDashboard(classId, `around:${value}`)
    }
  }

  if (loadError) {
    return (
      <div role="alert">
        <Banner tone="danger" icon={<Icon.Alert />}>
          {loadError}
        </Banner>
      </div>
    )
  }
  if (noClasses) {
    return (
      <EmptyState icon={<Icon.Heart />} title="No classes yet">
        Your class dashboard will show up here once you own or co-teach a class.
      </EmptyState>
    )
  }
  if (dash === null) return <EmptyState title="Loading your class dashboard…" />

  const asOfLabel = `${dash.period.replace("_", " ")} · ${dash.live ? "Live" : "as of"} ${new Date(
    dash.as_of,
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${dash.timezone}`

  return (
    <>
      <PageHeader crumb="My classes" title={dash.class_name} sub={asOfLabel} />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Time range">
          <Select
            aria-label="Time range"
            value={range === "around" ? "this_week" : range}
            onChange={(e) => onRangeChange(e.target.value)}
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Or around a specific date">
          <Input
            type="date"
            aria-label="Or around a specific date"
            value={aroundDate}
            onChange={(e) => onAroundDateChange(e.target.value)}
          />
        </Field>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Class mood index"
          icon={<Icon.Heart />}
          value={dash.mood_index ?? "—"}
          unit={dash.mood_index !== null ? "/ 10" : undefined}
          delta={
            <Trend dir={dash.trend}>
              {trendIcon(dash.trend)}
              {trendLabel(dash.trend)}
            </Trend>
          }
        />
      </div>

      <Card>
        <CardHeader icon={<Icon.Users />} title="Students" hint={`${roster?.length ?? 0} in this class`} />
        <CardBody flush={(roster?.length ?? 0) > 0}>
          {roster && roster.length === 0 ? (
            <EmptyState icon={<Icon.Users />} title="No students yet">
              Students will appear here once they are added to this class.
            </EmptyState>
          ) : (
            <Table
              head={["Name", ""]}
              rows={(roster ?? []).map((s) => [
                <span key="name">{s.display_name}</span>,
                <div key="action" className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={<Icon.Eye />}
                    onClick={() => navigate(`/app/dashboard/students/${s.id}`)}
                  >
                    View
                  </Button>
                </div>,
              ])}
            />
          )}
        </CardBody>
      </Card>
    </>
  )
}
