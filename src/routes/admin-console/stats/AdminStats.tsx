/**
 * SC-074 — Admin dashboard / platform statistics (FR-19-07 · US-19-07). REUSES
 * `design/approved/screens/AdminDashboard.tsx` in structure, copy and classes for the stat-tile
 * row, composed from `@design/components`.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('admin', ...)}>` wrapper — same reasoning already logged on
 *      SchoolAccounts.tsx/SeedActivities.tsx in this folder (the app's own routed shell wraps
 *      every `/app/*` route).
 *  (b) The approved screen's "Recent activity" table (admin actions feed) is DROPPED — this
 *      ticket's real endpoint (`GET /admin/stats`) returns only the four aggregate counts; no
 *      backing read for a recent-activity feed exists. Fabricating a table over data that isn't
 *      real would be inventing scope FR-19-07 does not carry (the audit log itself is queryable
 *      elsewhere, not exposed as a feed by this ticket).
 *  (c) Each stat tile shows a distinct empty-state caption ("No X yet") when its own count is 0,
 *      per the ticket's own NEG scenario ("a statistic shows an empty state before there is data,
 *      not an error") — the approved screen's static fixture values ("142", "37", ...) never
 *      exercise this state, so the real wiring adds it.
 */
import { useEffect, useState } from "react"

import { Card, CardBody, CardHeader, EmptyState, Icon, StatTile } from "@design/components"

import { adminStatsErrorMessage, getPlatformStats, type PlatformStats } from "./api"

function tileDelta(count: number, activityLabel: string, emptyLabel: string): string {
  return count === 0 ? emptyLabel : activityLabel
}

export function AdminStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .catch((e: unknown) => setError(adminStatsErrorMessage(e)))
  }, [])

  const loading = stats === null && !error

  return (
    <>
      {loading && (
        <Card>
          <CardBody>
            <EmptyState title="Loading platform statistics…" />
          </CardBody>
        </Card>
      )}

      {error && (
        <Card>
          <CardBody>
            <EmptyState icon={<Icon.Alert />} title="Statistics could not be loaded">{error}</EmptyState>
          </CardBody>
        </Card>
      )}

      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            label="Schools"
            icon={<Icon.School />}
            value={stats.schools}
            delta={tileDelta(stats.schools, "connected", "No schools yet")}
          />
          <StatTile
            label="Active trials"
            icon={<Icon.Clock />}
            value={stats.active_trials}
            delta={tileDelta(stats.active_trials, "Premium trials running", "No active trials yet")}
          />
          <StatTile
            label="Check-ins"
            icon={<Icon.Check />}
            value={stats.checkin_volume}
            delta={tileDelta(stats.checkin_volume, "across all schools", "No check-ins yet")}
          />
          <StatTile
            label="Alerts"
            icon={<Icon.Alert />}
            value={stats.alert_volume}
            delta={tileDelta(stats.alert_volume, "raised platform-wide", "No alerts yet")}
          />
        </div>
      )}

      {stats && (
        <Card>
          <CardHeader icon={<Icon.Report />} title="Platform statistics" hint="live · all schools" />
          <CardBody>
            <p className="text-[13px] text-neutral-500"> {/* token-ok: text-[13px]/text-neutral-500 muted-meta scale already used platform-wide (e.g. district-approvals CELL_TEXT_CLS) */}
              Read-only aggregates over the platform's own data — rendered, not recomputed.
            </p>
          </CardBody>
        </Card>
      )}
    </>
  )
}
