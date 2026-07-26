import { useEffect, useState } from "react"

import { Banner, EmptyState, Icon, PageHeader, StatTile, Trend } from "@design/components"

import { getClassDashboard, getMyClasses, DashboardApiError, type ClassDashboard } from "./api"

// FR-10-01 · SC-027 — the class dashboard: a teacher's weighted mood index + trend for their
// class, and a header stating whose data, which period/timezone, and live-or-as-of (ticket
// §Must-nots — this is header content, not optional).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// ClassDashboard.tsx` is a STATIC PREVIEW with device chrome and THREE stat tiles (mood index,
// participation, open flags) plus a per-student "needing a look" table with mood trend/flag/
// drill-in per row. This ticket's own DoD is narrower: `GET /classes/{id}/dashboard` returns ONLY
// `{ mood_index, trend, as_of, period, timezone }` — no participation count, no flag count, no
// per-student rows (those need FR-10-02's drill-in endpoint, FR-12-*'s flag data, and FR-10-03's
// range filter, none of which exist yet). Composing the participation/flags tiles or the student
// table here would either recompute a figure client-side (forbidden — SRS §13.5) or fabricate
// data with no backing endpoint (forbidden — same class of call FR-08-01 made dropping MyHistory's
// streak/week-summary/dead-link). This screen therefore reuses ONLY the approved primitives its
// ONE real section needs: `PageHeader` (whose/period/tz/live) + one `StatTile` (mood index) with a
// `Trend` chip for the direction. FR-10-02/03/05 (drill-in, range filter, empty/loading/error
// polish) extend this screen later, per the ticket's own "Enables" line.
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

export function ClassDashboardApp() {
  const [dash, setDash] = useState<ClassDashboard | null>(null)
  const [noClasses, setNoClasses] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getMyClasses()
      .then((classes) => {
        if (cancelled) return
        if (classes.length === 0) {
          setNoClasses(true)
          return
        }
        return getClassDashboard(classes[0].id).then((d) => {
          if (!cancelled) setDash(d)
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
    </>
  )
}
