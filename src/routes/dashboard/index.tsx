import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  Banner, Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, Input, PageHeader, Select,
  StatTile, Table, Trend,
} from "@design/components"

import {
  getClassDashboard, getClassRoster, getMyClasses, dashboardErrorMessage,
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
// `range=` query, never re-derives the currently-shown figures from the prior fetch.
//
// FR-10-05 ADDS real empty/loading/error states, each SECTION independently (ticket DoD: "Each
// list/section shows its own empty, loading and error states"):
//  - The class-picker bootstrap (`getMyClasses`) keeps ONE page-level loading/error/no-classes
//    gate — there is nothing else to show before we even know which class this is.
//  - Once a class is known, the mood-index tile and the roster table fetch INDEPENDENTLY (no
//    `Promise.all`) so a failure in one never blanks the other — a real per-section error state,
//    not a shared one.
//  - The mood-index tile itself now branches on the server-owned `data_state`
//    (`has_data|no_data_yet|no_results`): `no_data_yet` ("this class has never checked in") and
//    `no_results` ("a filter matched nothing though data exists") render DISTINCT copy — ticket
//    §Must-nots forbids the two sharing copy (Scenarios 1 & 2).
//  - A 500 (or any unexpected failure) surfaces as a scoped `Banner` in the failing section only —
//    never a crash, never silently dropped (ticket §Must-nots) — reusing the SAME
//    `dashboardErrorMessage`/`DashboardApiError` plumbing FR-10-03's range-filter errors already
//    established (a real server detail when there is one, a generic fallback otherwise).
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

  // Page-level bootstrap: which class are we even showing?
  const [classId, setClassId] = useState<string | null>(null)
  const [className, setClassName] = useState<string>("")
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)
  const [noClasses, setNoClasses] = useState(false)

  // Section 1: mood-index figures (FR-10-01/03) — own loading/error, driven by `data_state`.
  const [dash, setDash] = useState<ClassDashboard | null>(null)
  const [dashLoading, setDashLoading] = useState(false)
  const [dashError, setDashError] = useState<string | null>(null)

  // Section 2: roster table (FR-10-02) — independent of the mood-index fetch/filter.
  const [roster, setRoster] = useState<RosterStudent[] | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)

  const [range, setRange] = useState<string>("this_week")
  const [aroundDate, setAroundDate] = useState("")

  const loadDashboard = useCallback((id: string, r: string) => {
    setDashLoading(true)
    setDashError(null)
    getClassDashboard(id, r === "this_week" ? undefined : r)
      .then((d) => setDash(d))
      .catch((e: unknown) => {
        setDashError(dashboardErrorMessage(e, "Couldn't load the dashboard. Please try again."))
      })
      .finally(() => setDashLoading(false))
  }, [])

  const loadRoster = useCallback((id: string) => {
    setRosterLoading(true)
    setRosterError(null)
    getClassRoster(id)
      .then((r) => setRoster(r))
      .catch((e: unknown) => {
        setRosterError(dashboardErrorMessage(e, "Couldn't load the class roster. Please try again."))
      })
      .finally(() => setRosterLoading(false))
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
        setClassId(classes[0].id)
        setClassName(classes[0].name)
        loadDashboard(classes[0].id, "this_week")
        loadRoster(classes[0].id)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setClassesError(dashboardErrorMessage(e, "Couldn't load your classes. Please try again."))
      })
      .finally(() => {
        if (!cancelled) setClassesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadDashboard, loadRoster])

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

  if (classesLoading) {
    return <EmptyState title="Loading your class dashboard…" />
  }
  if (classesError) {
    return (
      <div role="alert">
        <Banner tone="danger" icon={<Icon.Alert />}>
          {classesError}
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

  const asOfLabel = dash
    ? `${dash.period.replace("_", " ")} · ${dash.live ? "Live" : "as of"} ${new Date(
        dash.as_of,
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${dash.timezone}`
    : undefined

  return (
    <>
      <PageHeader crumb="My classes" title={dash?.class_name ?? className} sub={asOfLabel} />
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

      {/* Section 1: mood-index figures — its own loading/empty/error, distinct no_data_yet vs
          no_results copy (FR-10-05 Scenarios 1 & 2). */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dashLoading ? (
          <div className="sm:col-span-3">
            <EmptyState title="Loading your dashboard figures…" />
          </div>
        ) : dashError ? (
          <div className="sm:col-span-3" role="alert">
            <Banner tone="danger" icon={<Icon.Alert />}>
              {dashError}
            </Banner>
          </div>
        ) : dash && dash.data_state === "no_data_yet" ? (
          <div className="sm:col-span-3">
            <EmptyState icon={<Icon.Heart />} title="No check-ins yet">
              This class hasn't checked in for this period yet.
            </EmptyState>
          </div>
        ) : dash && dash.data_state === "no_results" ? (
          <div className="sm:col-span-3">
            <EmptyState icon={<Icon.Search />} title="No results for this filter">
              No check-ins match this time range — try a different period to see this class's data.
            </EmptyState>
          </div>
        ) : dash ? (
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
        ) : null}
      </div>

      {/* Section 2: roster table — its own loading/empty/error, independent of the range filter. */}
      <Card>
        <CardHeader
          icon={<Icon.Users />}
          title="Students"
          hint={roster ? `${roster.length} in this class` : undefined}
        />
        <CardBody flush={!rosterLoading && !rosterError && (roster?.length ?? 0) > 0}>
          {rosterLoading ? (
            <EmptyState title="Loading students…" />
          ) : rosterError ? (
            <div role="alert">
              <Banner tone="danger" icon={<Icon.Alert />}>
                {rosterError}
              </Banner>
            </div>
          ) : roster && roster.length === 0 ? (
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
