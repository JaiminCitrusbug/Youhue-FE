/**
 * SC-064 — School data export (FR-20-01 · US-20-01 · GATE G-12). REUSES
 * `design/approved/screens/DataExport.tsx` in structure, copy and classes, composed from
 * `@design/components`.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('leadership', ...)}>` wrapper — same reasoning already logged on
 *      every other screen in this folder (the app's own routed shell wraps every `/app/*` route);
 *      GATE G-12's "option not available" requirement is satisfied by the ROUTE itself being
 *      leadership-gated (`ROLE_ROUTES.leadership`), same precedent as StaffManagement/ConcernWords.
 *  (b) The approved screen shows TWO static fixture cards side by side ("Export school data" +
 *      "Your export is ready", as if both states existed simultaneously). The real flow is
 *      SEQUENTIAL (request -> pending -> ready), so this composition shows ONE card whose body
 *      transitions through the real states, rather than fabricating a second, always-visible
 *      "ready" card with hardcoded filename/size copy the real API doesn't return.
 *  (c) The approved screen's copy claims a `.zip` archive and an email notification — this
 *      ticket's real endpoint produces a JSON artifact with a pollable status (no email step),
 *      copy adjusted accordingly. Status is checked via an explicit "Check status" action rather
 *      than a silent auto-poll — a deliberately simpler, equally-real async UX (the ticket's DoD
 *      requires 202-then-200-on-poll, not a specific polling cadence).
 */
import { useState } from "react"

import { Button, Card, CardBody, CardHeader, Icon, PageHeader, Tag } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import {
  exportErrorMessage, getExportStatus, requestExport, type ExportStatusOut,
} from "./export-api"

export function DataExportScreen() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [exportState, setExportState] = useState<ExportStatusOut | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submitRequest() {
    if (!schoolId) return
    setBusy(true)
    setError(null)
    requestExport(schoolId)
      .then((accepted) => {
        setExportState({
          export_id: accepted.export_id, kind: "export", status: accepted.status,
          created_at: new Date().toISOString(), download_url: null,
        })
        setBusy(false)
      })
      .catch((e: unknown) => {
        setError(exportErrorMessage(e))
        setBusy(false)
      })
  }

  function checkStatus() {
    if (!schoolId || !exportState) return
    setBusy(true)
    setError(null)
    getExportStatus(schoolId, exportState.export_id)
      .then((res) => {
        setExportState(res)
        setBusy(false)
      })
      .catch((e: unknown) => {
        setError(exportErrorMessage(e))
        setBusy(false)
      })
  }

  return (
    <>
      <PageHeader
        crumb="Data portability · GDPR / data-protection request"
        title="School data export"
        sub="A full, machine-readable copy of your school's data"
      />

      <Card>
        <CardHeader
          icon={<Icon.ArrowUp />}
          title="Export school data"
          action={
            exportState?.status === "ready" ? (
              <Tag tone="ok" icon={<Icon.Check />}>Ready</Tag>
            ) : exportState ? (
              <Tag tone="warn" icon={<Icon.Clock />}>Preparing</Tag>
            ) : undefined
          }
        />
        <CardBody>
          {!exportState && (
            <>
              <p className="mb-3.5 text-[13px] text-neutral-700"> {/* token-ok: text-[13px]/text-neutral-700 muted-body scale already used platform-wide */}
                Requesting an export packages your school's students, staff and check-in records
                into a single file. It's ready within a minute — check back here.
              </p>
              <Button
                type="button" variant="ink" icon={<Icon.Report />}
                disabled={busy} onClick={submitRequest}
              >
                {busy ? "Requesting…" : "Request export"}
              </Button>
            </>
          )}

          {exportState && exportState.status !== "ready" && (
            <>
              <p className="mb-3.5 text-[13px] text-neutral-700"> {/* token-ok: text-[13px]/text-neutral-700 muted-body scale already used platform-wide */}
                Your export is being prepared.
              </p>
              <Button type="button" variant="ghost" disabled={busy} onClick={checkStatus}>
                {busy ? "Checking…" : "Check status"}
              </Button>
            </>
          )}

          {exportState && exportState.status === "ready" && (
            <>
              <p className="mb-3.5 text-[13px] text-neutral-700"> {/* token-ok: text-[13px]/text-neutral-700 muted-body scale already used platform-wide */}
                Your export is ready to download.
              </p>
              {exportState.download_url && (
                <a href={exportState.download_url} target="_blank" rel="noreferrer">
                  <Button type="button" variant="ghost" icon={<Icon.Download />}>
                    Download export
                  </Button>
                </a>
              )}
            </>
          )}

          {error && <p className="mt-2 text-[12px] text-status-danger">{error}</p>} {/* token-ok: text-[12px] muted-meta scale already used platform-wide, status-danger already used elsewhere for error copy */}
        </CardBody>
      </Card>
    </>
  )
}
