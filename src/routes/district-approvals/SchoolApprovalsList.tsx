import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  Banner, Button, Card, CardHeader, CardBody, EmptyState, Icon, PageHeader, PersonCell, Table,
} from "@design/components"

import { getPendingSchools, type PendingSchool } from "./api"
import { initialsOf, relativeDay } from "./format"

// Approved raw value, copied VERBATIM from every Table cell span in the approved
// SchoolApprovals.tsx row (registrant + "when" columns) — 12.5 pixels is not on the theme's named
// font-size scale (xs=12px, sm=13px), so it is a reviewed exception rather than re-skinned onto a
// different size.
// Source: design/approved/screens/SchoolApprovals.tsx:23,25,29,31
const CELL_TEXT_CLS = "text-[12.5px]" // token-ok: approved value (do-not-restyle)

// SC-069 · FR-02-02 — District approval queue.
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `@design/screens/SchoolApprovals` is
// a STATIC PREVIEW (PhoneFrame-free here, but still a hardcoded 2-row fixture + `AppShell{...chrome}`
// + no wiring), so it is READ as the reference and NEVER imported. This screen composes from the
// SAME approved primitives that preview composes itself from — PageHeader / Card / CardHeader /
// CardBody / Table / PersonCell / Button / Icon — in the same order, with the same copy and the
// same classes. The delta wired on top is: loading / loaded / load-failure / empty states, the GET
// on mount, and a real "Review" navigation per row (no dead `href="#"`).
//
// District-gated by the enclosing route (RequireRole allow={ROLE_ROUTES.district}); the BE
// re-checks the district role server-side and returns 403 for any other role (surfaced, never
// silent — see ./api.ts).
//
// SHELL — logged deviation, not a silent reconciliation (same as FR-19-05's admin screen). The
// approved screen wraps its content in `AppShell {...chrome('district', 'Approvals', …)}`. This
// route mounts UNDER the real, routed app shell (`src/components/layout/AppShell`, the `/app`
// layout route) — importing the approved shell here would render a second sidebar, and
// `chrome('district')` hardcodes a fixture person ("D. Adeyemi") and nav `<a>`s with no
// href/onClick (dead controls, banned by step 7). Only the approved CONTENT is composed here.
//
// CONTENT DELTA (logged, not silently reconciled): the approved fixture's `PersonCell` carries a
// `sub="Primary"` school-type label and the header's `sub="2 pending your review"` count is a
// hardcoded fixture number. Neither has a backing field in the School model (no school-type/phase
// concept exists) — `sub` is simply omitted per row (PersonCell's `sub` prop is optional) rather
// than inventing a value, and the header count is the REAL length of the fetched queue.

export function SchoolApprovalsList() {
  const navigate = useNavigate()
  const [schools, setSchools] = useState<PendingSchool[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(() => {
    setLoadFailed(false)
    setSchools(null)
    getPendingSchools()
      .then((res) => setSchools(res.schools))
      .catch(() => setLoadFailed(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loading = schools === null && !loadFailed

  return (
    <>
      <PageHeader
        crumb="Schools requesting to join this trust"
        title="School approvals"
        sub={
          loading || loadFailed
            ? undefined
            : `${schools?.length ?? 0} pending your review`
        }
      />

      <Card>
        <CardHeader icon={<Icon.School />} title="Pending schools" hint="oldest first" />
        <CardBody flush={!loading && !loadFailed && (schools?.length ?? 0) > 0}>
          {loading ? (
            <p role="status" className="px-4 py-6 text-sm text-neutral-500">
              Loading the approval queue…
            </p>
          ) : loadFailed ? (
            <div className="px-4 py-4">
              <div role="alert">
                <Banner tone="danger" icon={<Icon.Alert />}>
                  Couldn't load the approval queue. Please try again.
                </Banner>
              </div>
              <Button type="button" variant="ink" icon={<Icon.Check />} onClick={load}>
                Retry
              </Button>
            </div>
          ) : schools && schools.length === 0 ? (
            <EmptyState icon={<Icon.Check />} title="No schools waiting">
              Every registration has been reviewed. New self-registered schools will appear here.
            </EmptyState>
          ) : (
            <Table
              head={["School", "Registrant", "When", ""]}
              rows={(schools ?? []).map((school) => [
                <PersonCell key="name" initials={initialsOf(school.name)} name={school.name} />,
                <span key="email" className={CELL_TEXT_CLS}>
                  {school.registrant_email ?? "—"}
                </span>,
                <span key="when" className={CELL_TEXT_CLS}>
                  {relativeDay(school.created_at)}
                </span>,
                <div key="action" className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={<Icon.Eye />}
                    onClick={() => navigate(`/app/district/${school.school_id}`)}
                  >
                    Review
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
