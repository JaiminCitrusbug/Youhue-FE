import { useCallback, useEffect, useRef, useState } from "react"

import {
  Banner, Button, Card, CardBody, EmptyState, Icon, PageHeader, PersonCell, Table, Tag,
} from "@design/components"

import { useAuth } from "../../app/AuthContext"
import {
  getRoster,
  reconcileRoster,
  rosterListErrorMessage,
  type RosterReconcileFailure,
  type RosterStudent,
} from "./api"

// SC-037 · FR-03-05 — Roster list + re-import reconciliation. Staff (teacher/support)-only,
// same-school-only; the BE re-checks role + school scope (403 otherwise) on both the GET list and
// the reconcile POST.
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// RosterList.tsx` is a STATIC PREVIEW (no props, 3 hardcoded rows) — read as the reference and
// never imported. This screen is composed from the SAME approved primitives — PageHeader / Card /
// CardBody / Table / PersonCell / Tag / Button / Icon — with the same copy and classes, wiring the
// delta on top: a real GET-backed roster table, a real file-picker behind the "Re-import" control
// that POSTs to the FR-03-05 reconcile endpoint, real loading/empty/error states, and a real
// disabled/in-flight state on the control while a request is outstanding (no dead controls).
//
// SCREEN-SHAPE DECISION (logged, per ticket's explicit ask to use judgment here):
// FR-03-01 already owns `/app/roster/import` — a raw upload FORM (SC-036) with no roster view.
// This ticket's design reference is a DIFFERENT screen, RosterList.tsx (SC-037): a management VIEW
// (a table of every current student + status) with a "Re-import" action in its header, not another
// upload form. Reading the approved screen's actual content (a `Table` of students, not a dropzone)
// settles the ambiguity toward "a genuinely different roster-list/management screen that ALSO
// offers re-import" rather than "FR-03-01's existing screen calling a different endpoint" — so this
// route is NEW (`/app/roster`), sits alongside (not instead of) `/app/roster/import`, and is backed
// by a real `GET /schools/{id}/roster` list endpoint. That endpoint is NOT in the ticket's literal
// "What to build" (which names only the reconcile POST) — it is added here, minimally, because
// rendering RosterList.tsx's Table honestly (real API calls, no fixture rows) requires a real list
// to read, and the reconcile response is COUNTS ONLY (`{stayers_active, leavers_deactivated,
// new_added}`, per DoD — never per-student rows) so it cannot itself populate the table. Flagged
// for the BE/design owners to ratify, not silently decided: `GET /schools/{id}/roster` mirrors the
// already-established `GET /schools/{id}/staff` (FR-16-02) read pattern exactly (staff-only,
// same-school, thin list), so the shape of the addition is a precedented one, not an invented one.
//
// The "Re-import" control triggers a hidden native file input (same reasoning as
// `roster-import/index.tsx`'s dropzone: the approved screen shows one ghost button, so the delta
// wiring stays a single control, not a second upload UI bolted on) — picking a `.csv` immediately
// POSTs it to the reconcile endpoint; the real `{stayers_active, leavers_deactivated, new_added}`
// counts are surfaced in a banner, and the table is reloaded from the SAME GET endpoint so the
// screen reflects the true post-reconciliation DB state, never a locally-guessed one.
//
// SHELL — same logged deviation as `roster-import/index.tsx` / FR-19-05's DefaultWordListsApp: the
// approved screen wraps itself in `AppShell {...chrome('teacher', ...)}`; this route mounts UNDER
// the real routed app shell (`/app` layout route), so only the approved CONTENT is composed here.

const ACCEPT = ".csv,text/csv"

const AGE_BAND_LABEL: Record<RosterStudent["age_band"], string> = {
  b5_7: "5–7",
  b8_11: "8–11",
  b12_18: "12–18",
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

function statusTag(status: RosterStudent["status"]) {
  if (status === "active") return <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>
  return <Tag tone="mut" icon={<Icon.Minus />}>Inactive — left</Tag>
}

function failureMessage(failure: RosterReconcileFailure): string {
  return failure.message
}

export function RosterListApp() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? null

  const inputRef = useRef<HTMLInputElement>(null)
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [failure, setFailure] = useState<RosterReconcileFailure | null>(null)
  const [lastResult, setLastResult] = useState<{
    stayers_active: number
    leavers_deactivated: number
    new_added: number
  } | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setLoadError(null)
    getRoster(schoolId)
      .then((rows) => {
        setStudents(rows)
        setLoading(false)
      })
      .catch((e: unknown) => {
        setLoadError(rosterListErrorMessage(e))
        setLoading(false)
      })
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  async function onFilePicked(file: File | null) {
    if (!file || !schoolId) return
    setUploading(true)
    setFailure(null)
    try {
      const outcome = await reconcileRoster(schoolId, file)
      if (outcome.kind === "success") {
        setLastResult(outcome.result)
        load() // reflect the true post-reconciliation DB state, never a locally-guessed one
      } else {
        setFailure(outcome.failure)
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const activeCount = students.filter((s) => s.status === "active").length

  function body() {
    if (loading) return <EmptyState title="Loading roster…" />
    if (loadError) {
      return (
        <EmptyState icon={<Icon.Alert />} title="Roster could not be loaded">{loadError}</EmptyState>
      )
    }
    if (students.length === 0) {
      return (
        <EmptyState icon={<Icon.Users />} title="No students yet">
          Import a CSV roster to add your first students.
        </EmptyState>
      )
    }
    return (
      <Table
        head={["Name", "Age band", "Status"]}
        rows={students.map((s) => [
          <PersonCell key="person" initials={initialsFor(s.display_name)} name={s.display_name} />,
          <>{AGE_BAND_LABEL[s.age_band]}</>,
          statusTag(s.status),
        ])}
      />
    )
  }

  return (
    <>
      <PageHeader
        crumb="Roster"
        title="Students"
        sub={loading ? undefined : `${students.length} students · ${activeCount} active`}
        right={
          <Button
            type="button"
            variant="ghost"
            icon={<Icon.Upload />}
            disabled={!schoolId || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Reconciling…" : "Re-import"}
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Choose a CSV roster file to re-import"
        onChange={(e) => void onFilePicked(e.target.files?.[0] ?? null)}
      />

      {!schoolId && (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>
            No school is associated with your session — sign in again to manage the roster.
          </Banner>
        </div>
      )}

      {lastResult && !failure && (
        <div role="status">
          <Banner icon={<Icon.Check />}>
            Reconciled — stayed active {lastResult.stayers_active} · deactivated{" "}
            {lastResult.leavers_deactivated} · added {lastResult.new_added}
          </Banner>
        </div>
      )}

      {failure && (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>
            {failureMessage(failure)}
          </Banner>
          {failure.kind === "malformed_rows" && failure.errors.length > 0 && (
            <ul className="mb-4 -mt-2 list-inside list-disc text-xs text-neutral-600">
              {failure.errors.map((row) => (
                <li key={row.row}>
                  Row {row.row}: {row.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Card>
        <CardBody flush>{body()}</CardBody>
      </Card>
    </>
  )
}
