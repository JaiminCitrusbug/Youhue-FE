/**
 * SC-065 — School data deletion (FR-20-02 · US-20-02 · GATE-12-shape). REUSES
 * `design/approved/screens/DataDeletion.tsx` in structure, copy and classes, composed from
 * `@design/components`.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('leadership', ...)}>` wrapper — same reasoning already logged on
 *      every other screen in this folder: the app's own routed shell wraps every `/app/*` route.
 *  (b) The approved screen shows ONE static state with BOTH "Export first" and "Delete
 *      permanently" always visible/enabled together, as if the two actions were interchangeable.
 *      The real flow is a STRICT, SERVER-ENFORCED two-step order (offer -> export becomes ready
 *      -> only then may delete run), so this composition threads through the real states instead:
 *      idle (offer only) -> preparing (check status, reusing FR-20-01's poll) -> ready (a genuine
 *      download link, reused unmodified from `./export-api`, PLUS the now-enabled delete action)
 *      -> deleted (terminal — the school, and the actor's OWN account, no longer exist).
 *  (c) A native `window.confirm()` gate in front of "Delete permanently" — not a new UI
 *      component/markup, just a browser-native safety check before firing an irreversible,
 *      unconfirmable action; the approved screen's click target and copy are otherwise unchanged.
 *  (d) The approved screen's "Export first" button carries no description of what happens next;
 *      the real button starts the SAME endpoint this whole screen is built around
 *      (`POST .../export-and-delete`) — one action, reused across both steps of the ordered exit.
 */
import { useState } from "react"

import { Banner, Button, Card, CardBody, CardHeader, Icon, PageHeader, Tag } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { exportErrorMessage, getExportStatus, type ExportStatusOut } from "./export-api"
import { exportAndDeleteErrorMessage, requestExportAndDelete, type ExportAndDeleteOut } from "./deletion-api"

export function DataDeletionScreen() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [exit, setExit] = useState<ExportAndDeleteOut | null>(null)
  const [poll, setPoll] = useState<ExportStatusOut | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = poll?.status === "ready"

  function startExit() {
    if (!schoolId) return
    setBusy(true)
    setError(null)
    requestExportAndDelete(schoolId)
      .then((out) => {
        setExit(out)
        setBusy(false)
      })
      .catch((e: unknown) => {
        setError(exportAndDeleteErrorMessage(e))
        setBusy(false)
      })
  }

  function checkStatus() {
    if (!schoolId || !exit) return
    setBusy(true)
    setError(null)
    getExportStatus(schoolId, exit.export_id)
      .then((res) => {
        setPoll(res)
        setBusy(false)
      })
      .catch((e: unknown) => {
        setError(exportErrorMessage(e))
        setBusy(false)
      })
  }

  function confirmDelete() {
    if (!schoolId || !exit) return
    // Irreversible hard delete — one last, deliberate native confirmation before firing it.
    if (!window.confirm(
      "This permanently deletes this school's students, staff and check-in data. "
      + "This cannot be undone. Continue?",
    )) return
    setBusy(true)
    setError(null)
    requestExportAndDelete(schoolId)
      .then((out) => {
        setExit(out)
        setBusy(false)
      })
      .catch((e: unknown) => {
        setError(exportAndDeleteErrorMessage(e))
        setBusy(false)
      })
  }

  return (
    <>
      <PageHeader
        crumb="Right to erasure · irreversible"
        title="School data deletion"
        sub="We offer an export before anything is removed"
      />

      <div className="max-w-[640px]"> {/* token-ok: approved value (do-not-restyle, same as SchoolSupport/SchoolTrial's CONTENT_COL_CLS) */}
        <Card>
          <CardHeader
            icon={<Icon.Trash />}
            title="Delete school data"
            action={
              exit?.deleted ? (
                <Tag tone="danger" icon={<Icon.Check />}>Deleted</Tag>
              ) : ready ? (
                <Tag tone="ok" icon={<Icon.Check />}>Export ready</Tag>
              ) : exit ? (
                <Tag tone="warn" icon={<Icon.Clock />}>Preparing export</Tag>
              ) : undefined
            }
          />
          <CardBody>
            {exit?.deleted ? (
              <Banner tone="danger" icon={<Icon.Trash />}>
                This school's data has been permanently deleted. This cannot be undone.
              </Banner>
            ) : (
              <Banner tone="danger" icon={<Icon.Alert />}>
                This permanently deletes all school data. We export first.
              </Banner>
            )}

            {!exit?.deleted && (
              <div className="flex justify-end gap-2.5">
                {!exit && (
                  <Button
                    type="button" variant="ghost" icon={<Icon.Download />}
                    disabled={busy} onClick={startExit}
                  >
                    {busy ? "Starting…" : "Export first"}
                  </Button>
                )}
                {exit && !ready && (
                  <Button
                    type="button" variant="ghost" disabled={busy} onClick={checkStatus}
                  >
                    {busy ? "Checking…" : "Check status"}
                  </Button>
                )}
                {exit && ready && poll?.download_url && (
                  <a href={poll.download_url} target="_blank" rel="noreferrer">
                    <Button type="button" variant="ghost" icon={<Icon.Download />}>
                      Download export
                    </Button>
                  </a>
                )}
                <Button
                  type="button" variant="danger" icon={<Icon.Trash />}
                  disabled={busy || !ready} onClick={confirmDelete}
                >
                  {busy ? "Deleting…" : "Delete permanently"}
                </Button>
              </div>
            )}

            {error && <p className="mt-2 text-[12px] text-status-danger">{error}</p>} {/* token-ok: text-[12px] muted-meta scale already used platform-wide, status-danger already used elsewhere for error copy */}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
