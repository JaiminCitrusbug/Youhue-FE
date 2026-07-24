/**
 * SC-057 — Staff management (FR-16-02 · US-16-02). REUSES the approved design screen
 * (`design/approved/screens/StaffManagement.tsx`) in structure, copy and classes, composed
 * entirely from the vendored approved primitives (`@design/components`). Adds ONLY the delta — a
 * real GET-backed staff list, the Deactivate action wired to a real PATCH, loading/empty/error
 * states, and a real per-row disabled/in-flight state while a request is outstanding (no dead
 * controls).
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('leadership', ...)}>` wrapper — same reasoning FR-19-02/04/05
 *      already logged: this route renders inside the app's own routed shell
 *      (`src/components/layout/AppShell.tsx`); wrapping the approved shell here would nest a
 *      second sidebar, and `chrome('leadership')` hardcodes a fixture person + dead nav `<a>`s.
 *  (b) The header's "Invite colleague" button is NOT reproduced — colleague invitation is
 *      FR-02-04, not built by this ticket; a button with no backing endpoint would be a dead
 *      control.
 *  (c) The "Resend" action shown on `invited` rows in the approved screen is likewise NOT
 *      reproduced for the same reason (FR-02-04). A non-active row shows its status only; no
 *      action column entry for it.
 */
import { useCallback, useEffect, useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, EmptyState, Icon, PageHeader, PersonCell, Table, Tag,
} from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { deactivateStaff, leadershipErrorMessage, listStaff, type StaffRow } from "./api"

function initialsFor(email: string): string {
  const local = email.split("@")[0] ?? email
  const parts = local.split(/[._-]+/).filter(Boolean)
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "?"
}

function statusTag(status: string) {
  if (status === "active") return <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>
  if (status === "deactivated") return <Tag tone="mut" icon={<Icon.Alert />}>Deactivated</Tag>
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <Tag tone="warn" icon={<Icon.Clock />}>{label}</Tag>
}

export function StaffManagement() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    listStaff(schoolId)
      .then((res) => {
        setStaff(res.staff)
        setLoading(false)
      })
      .catch((e: unknown) => {
        setError(leadershipErrorMessage(e))
        setLoading(false)
      })
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  function onDeactivate(staffId: string) {
    if (!schoolId) return
    setPendingId(staffId)
    setActionError(null)
    deactivateStaff(schoolId, staffId)
      .then((res) => {
        setStaff((rows) => rows.map((r) => (r.id === staffId ? res.staff : r)))
        setPendingId(null)
      })
      .catch((e: unknown) => {
        setActionError(leadershipErrorMessage(e))
        setPendingId(null)
      })
  }

  const activeCount = staff.filter((s) => s.status === "active").length
  const invitedCount = staff.filter((s) => s.status === "invited" || s.status === "sent").length

  function body() {
    if (loading) return <EmptyState title="Loading staff…" />
    if (error) {
      return <EmptyState icon={<Icon.Alert />} title="Staff could not be loaded">{error}</EmptyState>
    }
    if (staff.length === 0) {
      return (
        <EmptyState icon={<Icon.Users />} title="No staff yet">
          Colleagues will appear here once they are added to your school.
        </EmptyState>
      )
    }
    return (
      <Table
        head={["Name", "Role", "Status", "Action"]}
        rows={staff.map((s) => [
          <PersonCell key="person" initials={initialsFor(s.email)} name={s.email} />,
          <>{s.role}</>,
          statusTag(s.status),
          s.status === "active" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pendingId === s.id}
              onClick={() => onDeactivate(s.id)}
            >
              {pendingId === s.id ? "Deactivating…" : "Deactivate"}
            </Button>
          ) : (
            <span className="text-[12.5px] text-neutral-400">—</span> // token-ok: text-[12.5px]/text-neutral-400 muted-meta scale already used platform-wide (e.g. district-approvals CELL_TEXT_CLS)
          ),
        ])}
      />
    )
  }

  return (
    <>
      <PageHeader
        crumb="Colleague accounts"
        title="Staff management"
        sub={loading ? undefined : `${staff.length} accounts · ${activeCount} active · ${invitedCount} invited`}
      />
      {actionError && (
        <Banner tone="danger" icon={<Icon.Alert />}>{actionError}</Banner>
      )}
      <Card>
        <CardHeader icon={<Icon.Users />} title="Staff" hint="Active → Invited → Deactivated" />
        <CardBody flush>{body()}</CardBody>
      </Card>
    </>
  )
}
