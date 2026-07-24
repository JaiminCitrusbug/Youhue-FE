import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { Banner, Button, Card, CardHeader, CardBody, Icon, KV, PageHeader } from "@design/components"

import { decideSchool, getSchoolDetail, type Decision, type SchoolDetail } from "./api"
import { relativeDay } from "./format"

// SC-070 · FR-02-02 — review + decide a single pending school.
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `@design/screens/ApprovalDecision` is
// a STATIC PREVIEW (hardcoded "St. Aidan's" fixture, dead Approve/Reject buttons, no wiring), so it
// is READ as the reference and NEVER imported. This screen composes from the SAME approved
// primitives that preview composes itself from — PageHeader / Card / CardHeader / CardBody / KV /
// Banner / Button / Icon — in the same order, with the same copy and the same classes. The delta
// wired on top is: loading / load-failure / not-pending / success / error states, the GET on mount,
// and the POST decision each button now actually performs.
//
// District-gated by the enclosing route (RequireRole allow={ROLE_ROUTES.district}); the BE
// re-checks the district role + the school's pending status server-side (403 / 409 surfaced, never
// silent — see ./api.ts). SHELL — same logged deviation as SchoolApprovalsList.tsx: this mounts
// under the real `/app` shell, not the approved `AppShell{...chrome('district')}` fixture chrome.
//
// CONTENT DELTA (logged, not silently reconciled): the approved fixture's sub-line reads "Requested
// today · Primary school" — "Primary school" has no backing field (no school-type/phase concept in
// the model), so it is dropped rather than invented; "Requested {when}" is computed from the real
// `created_at`. The "Students (roster)" KV is a genuine `student_count` query against the existing
// Student table (never a fabricated number) — expected 0 for a pending school, since no roster can
// exist before approval (FR-03-01 roster import is a later ticket, not built here).

const CONTENT_COL_CLS = "max-w-[640px]" // token-ok: approved value (do-not-restyle, screens/ApprovalDecision.tsx:15)

interface DecisionOutcome {
  decision: Decision
  status: "active" | "rejected"
}

export function ApprovalDecisionScreen() {
  const { schoolId } = useParams<{ schoolId: string }>()
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [deciding, setDeciding] = useState<Decision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [decided, setDecided] = useState<DecisionOutcome | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoadFailed(false)
    setSchool(null)
    setError(null)
    setDecided(null)
    getSchoolDetail(schoolId)
      .then(setSchool)
      .catch(() => setLoadFailed(true))
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  async function decide(decision: Decision) {
    if (!schoolId) return
    setDeciding(decision)
    setError(null)
    try {
      const result = await decideSchool(schoolId, decision)
      setDecided({ decision, status: result.status })
      setSchool((prev) => (prev ? { ...prev, status: result.status } : prev))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't record that decision. Please try again.")
    } finally {
      setDeciding(null)
    }
  }

  const loading = school === null && !loadFailed
  // Actionable only while genuinely pending — an already-decided school (this page's own result,
  // or a stale link to one someone else already decided) gets real disabled buttons, not dead ones.
  const canDecide = school?.status === "pending" && !decided

  return (
    <>
      <PageHeader
        crumb="Reviewing a join request"
        title={loading ? "Loading…" : loadFailed ? "School review" : `${school?.name} — review`}
        sub={school ? `Requested ${relativeDay(school.created_at)}` : undefined}
      />

      <div className={CONTENT_COL_CLS}>
        <Card>
          <CardHeader icon={<Icon.School />} title="School details" />
          <CardBody>
            {loading ? (
              <p role="status" className="text-sm text-neutral-500">
                Loading school details…
              </p>
            ) : loadFailed ? (
              <>
                <div role="alert">
                  <Banner tone="danger" icon={<Icon.Alert />}>
                    Couldn't load this school's details. Please try again.
                  </Banner>
                </div>
                <Button type="button" variant="ink" icon={<Icon.Check />} onClick={load}>
                  Retry
                </Button>
              </>
            ) : school ? (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <KV label="Registrant">{school.registrant_email ?? "Unknown"}</KV>
                  <KV label="Students (roster)">{school.student_count}</KV>
                </div>

                {school.status === "pending" && !decided ? (
                  <Banner tone="info" icon={<Icon.Alert />}>
                    Approving arms a whole-school Premium trial from first check-in.
                  </Banner>
                ) : null}

                {decided ? (
                  <div role="status">
                    <Banner
                      tone={decided.decision === "approve" ? "info" : "warn"}
                      icon={decided.decision === "approve" ? <Icon.Check /> : <Icon.X />}
                    >
                      {decided.decision === "approve"
                        ? "Approved — the school is now live and its Premium trial is armed."
                        : "Rejected — the school stays not-live."}
                    </Banner>
                  </div>
                ) : school.status !== "pending" ? (
                  <div role="status">
                    <Banner tone="warn" icon={<Icon.Alert />}>
                      This school was already {school.status === "active" ? "approved" : "rejected"}.
                    </Banner>
                  </div>
                ) : null}

                {error ? (
                  <div role="alert">
                    <Banner tone="danger" icon={<Icon.Alert />}>
                      {error}
                    </Banner>
                  </div>
                ) : null}

                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="ink"
                    icon={<Icon.Check />}
                    onClick={() => decide("approve")}
                    disabled={!canDecide || deciding !== null}
                  >
                    {deciding === "approve" ? "Approving…" : "Approve"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    icon={<Icon.X />}
                    onClick={() => decide("reject")}
                    disabled={!canDecide || deciding !== null}
                  >
                    {deciding === "reject" ? "Rejecting…" : "Reject"}
                  </Button>
                </div>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
