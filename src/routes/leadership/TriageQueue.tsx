/**
 * SC-038 — Alerts / triage queue (FR-12-06 · US-12-06 · GATE G-9).
 * REUSES `design/approved/screens/AlertsTriageQueue.tsx` in structure, copy and classes, composed
 * from `@design/components`. The approved screen is a presentational mock with hardcoded fixtures
 * and no data fetching; this file wires it to the real, render-only `GET /risk/triage` read.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome(...)}>` wrapper — same reasoning already logged on
 *      `StaffManagement.tsx`/`AlertRouting.tsx` in this folder (the app shell already wraps every
 *      `/app/*` route; a second nested shell would double-render nav/header).
 *  (b) The approved screen's stat tiles (immediate/triage/acknowledged/median-ack-time) and the
 *      "Escalated" status/segmented filter are illustrative preview chrome — the real endpoint
 *      this ticket built (`GET /risk/triage`) is deliberately a MINIMAL, render-only list of open
 *      triage-band flags (band decision + hand-off is this ticket's DoD; acknowledge/escalate/close
 *      status transitions and per-class scoping are a review-triggered future ticket's surface, not
 *      invented here). Only the fields the real API returns are rendered: student, signal (flag
 *      type), risk score, raised time. The stat tiles show a single real count (this list's length)
 *      rather than four illustrative ones.
 *  (c) GATE G-9: this screen is READ-ONLY — no action buttons that would let a human trigger
 *      anything on the STUDENT from here (a human acting on the underlying concern happens through
 *      existing, separate channels — messaging the family, an in-person check — not a button this
 *      screen would offer, since none exists in the real API this ticket built).
 *  (d) Nav-wiring fix (2026-07-31): the approved screen's "open flag" drill-in is now real — FR-12-09
 *      built the flag-record screen this row-click reaches (`/app/triage/:flagId`), so the row is
 *      no longer a dead end. Uses the same `View` row-action pattern as `dashboard/index.tsx`.
 */
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button, Card, CardBody, CardHeader, EmptyState, Icon, PersonCell, StatTile, Table, Tag, theme } from "@design/components"

import { getTriageQueue, type TriageFlag } from "./risk-api"

function signalLabel(f: TriageFlag): string {
  const kind = f.type === "concern_word" ? "Concern-word" : "Slow-burn"
  return `${kind} · risk ${f.risk_score.toFixed(2)}`
}

function raisedLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export function TriageQueue() {
  const navigate = useNavigate()
  const [flags, setFlags] = useState<TriageFlag[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTriageQueue()
      .then((res) => setFlags(res.flags))
      .catch(() => setError("Could not load the triage queue. Please try again."))
  }, [])

  const loading = flags === null && !error

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile
          label="Triage queue"
          icon={<Icon.Clock />}
          value={<span style={{ color: theme.colors.status.warn }}>{flags?.length ?? 0}</span>}
          delta="awaiting human review"
        />
      </div>

      <Card>
        <CardHeader icon={<Icon.Flag />} title="Open flags" hint="oldest first · biased toward triage over silence" />
        <CardBody flush>
          {loading && <EmptyState title="Loading the triage queue…" />}
          {error && <EmptyState icon={<Icon.Alert />} title="Triage queue could not be loaded">{error}</EmptyState>}
          {flags && flags.length === 0 && (
            <EmptyState icon={<Icon.CheckCircle />} title="Nothing needs review right now">
              No open triage-band flags for your school.
            </EmptyState>
          )}
          {flags && flags.length > 0 && (
            <Table
              head={["Priority", "Student", "Signal", "Raised", ""]}
              rows={flags.map((f) => [
                <Tag key="tag" tone="warn" icon={<Icon.Clock />}>Triage</Tag>,
                <PersonCell key="person" initials={f.student_name.slice(0, 2).toUpperCase()} name={f.student_name} />,
                <span key="signal" className="text-neutral-700">{signalLabel(f)}</span>,
                <span key="raised" className="text-neutral-500">{raisedLabel(f.created_at)}</span>,
                <div key="action" className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={<Icon.Eye />}
                    onClick={() => navigate(`/app/triage/${f.flag_id}`)}
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
