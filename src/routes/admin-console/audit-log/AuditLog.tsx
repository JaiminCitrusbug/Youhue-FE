/**
 * SC-080 — Audit-log viewer (FR-20-05 · US-19-03). REUSES `design/approved/screens/AuditLog.tsx`
 * in structure, copy and classes: the PageHeader, the info Banner ("View only — cannot be edited
 * or deleted"), and the Card + Table (When/Actor/Action, newest first) — all composed from
 * `@design/components`. The delta is real GET-backed data, filter wiring, pagination, loading/
 * empty/error states, and a real Export download (no dead controls).
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('admin', ...)}>` wrapper — same reasoning already logged on every
 *      other admin-console screen in this folder (the app's own routed shell wraps `/app/*`).
 *  (b) The approved header's single "All actors" Select is DROPPED and replaced with real filter
 *      Inputs (action / actor id / school id / from-date) wired to the BE's actual filter
 *      contract (`GET /admin/audit-log?actor_id=&action=&school_id=&date_from=`) — same precedent
 *      SchoolAccounts.tsx set for its own dead tier Select: a fixed one-option dropdown with no
 *      backing enumeration would be a dead control, not a working filter (no "list distinct
 *      actors" endpoint exists to populate it).
 *  (c) Pagination controls (Previous/Next + "showing N of TOTAL") are ADDED below the table — the
 *      approved screen's static 2-row fixture never needed them, but the real endpoint paginates
 *      (`page`/`page_size`/`total`) and the ticket's own DoD is "filter + table + Export" over a
 *      potentially large, real table.
 *  (d) No "Reason" column — the underlying `audit_logs` table carries no reason text (FR-19-02's
 *      `support_access` deliberately never persists it — see the BE gate doc's reconciliation
 *      note), matching the approved screen's own table, which likewise has only When/Actor/
 *      Action, no Reason column.
 */
import { useCallback, useEffect, useState } from "react"

import { Banner, Button, Card, CardBody, CardHeader, EmptyState, Icon, Input, PageHeader, Table } from "@design/components"

import {
  adminAuditLogErrorMessage, exportAuditLog, listAuditLog,
  type AuditLogEntry, type AuditLogFilter,
} from "./api"

const PAGE_SIZE = 20

// Approved raw value, copied VERBATIM (do-not-restyle). Tailwind has no 130px/150px step.
// Source: design/approved/screens/AuditLog.tsx:15 (the header filter control's width)
const FILTER_FIELD_CLS = "w-[130px]" // token-ok: approved value (do-not-restyle)
const DATE_FIELD_CLS = "w-[150px]" // token-ok: approved value (do-not-restyle)
// Approved raw value, copied VERBATIM (do-not-restyle) — the same table-cell text scale the
// approved screen uses for its When/Actor/Action cells (design/approved/screens/AuditLog.tsx:31-33),
// already established platform-wide (e.g. SeedActivities.tsx CELL_TITLE/CELL_TEXT).
const CELL_TITLE_CLS = "text-[12.5px] font-semibold" // token-ok: approved value (do-not-restyle)
const CELL_TEXT_CLS = "text-[12.5px]" // token-ok: approved value (do-not-restyle)

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actorId, setActorId] = useState("")
  const [action, setAction] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const baseFilter = useCallback(
    (): AuditLogFilter => ({ actorId, action, schoolId, dateFrom }),
    [actorId, action, schoolId, dateFrom],
  )

  const load = useCallback(
    (p: number) => {
      setLoading(true)
      setError(null)
      listAuditLog({ ...baseFilter(), page: p, pageSize: PAGE_SIZE })
        .then((res) => {
          setEntries(res.entries)
          setTotal(res.total)
          setPage(res.page)
          setLoading(false)
        })
        .catch((e: unknown) => {
          setError(adminAuditLogErrorMessage(e))
          setLoading(false)
        })
    },
    [baseFilter],
  )

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit filter submit, not on every keystroke
  }, [])

  function submitFilter(e: React.FormEvent) {
    e.preventDefault()
    load(1)
  }

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      const blob = await exportAuditLog(baseFilter())
      downloadBlob(blob, "audit-log.csv")
    } catch (e) {
      setExportError(adminAuditLogErrorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  const hasMore = page * PAGE_SIZE < total

  function body() {
    if (loading) return <EmptyState title="Loading audit log…" />
    if (error) return <EmptyState icon={<Icon.Alert />} title="Audit log could not be loaded">{error}</EmptyState>
    if (entries.length === 0) {
      return (
        <EmptyState icon={<Icon.Report />} title="No entries match your filter">
          Try different filter values, or clear them to see every entry.
        </EmptyState>
      )
    }
    return (
      <Table
        head={["When", "Actor", "Action"]}
        rows={entries.map((e: AuditLogEntry) => [
          <span className={CELL_TITLE_CLS}>{formatWhen(e.at)}</span>,
          <span className={CELL_TEXT_CLS}>{e.actor_id}</span>,
          <span className={CELL_TEXT_CLS}>{e.action}</span>,
        ])}
      />
    )
  }

  return (
    <>
      <PageHeader
        crumb="Append-only · tamper-evident"
        title="Audit-log viewer"
        sub="Platform-wide"
        right={
          <form onSubmit={submitFilter} className="flex flex-wrap items-center gap-2">
            <div className={FILTER_FIELD_CLS}>
              <Input aria-label="Filter by action" placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} />
            </div>
            <div className={FILTER_FIELD_CLS}>
              <Input aria-label="Filter by actor id" placeholder="Actor ID" value={actorId} onChange={(e) => setActorId(e.target.value)} />
            </div>
            <div className={FILTER_FIELD_CLS}>
              <Input aria-label="Filter by school id" placeholder="School ID" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
            </div>
            <div className={DATE_FIELD_CLS}>
              <Input aria-label="Filter from date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <Button type="submit" variant="ghost" icon={<Icon.Search />}>
              Filter
            </Button>
            <Button type="button" variant="ghost" icon={<Icon.Download />} onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </form>
        }
      />

      <Banner tone="info" icon={<Icon.Lock />}>
        View only — the audit log cannot be edited or deleted.
      </Banner>

      {exportError ? (
        <div role="alert" className="mb-4">
          <Banner tone="danger" icon={<Icon.Alert />}>{exportError}</Banner>
        </div>
      ) : null}

      <Card>
        <CardHeader
          icon={<Icon.Report />}
          title="Entries"
          hint={loading ? undefined : `showing ${entries.length} of ${total} · newest first`}
        />
        <CardBody flush>{body()}</CardBody>
        {!loading && !error && entries.length > 0 ? (
          <CardBody>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => load(page - 1)}>
                Previous
              </Button>
              <Button type="button" variant="ghost" disabled={!hasMore} onClick={() => load(page + 1)}>
                Next
              </Button>
            </div>
          </CardBody>
        ) : null}
      </Card>
    </>
  )
}
