import { useRef, useState, type DragEvent } from "react"

import { Banner, Button, Card, CardBody, CardHeader, Icon, PageHeader, Tag } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { importRoster, type RosterImportFailure, type RosterImportResult } from "./api"

// SC-036 · FR-03-01 — Roster import (CSV). Staff (teacher/support)-only, same-school-only; the
// BE re-checks role + school scope (403 otherwise, audited).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// RosterImport.tsx` is a STATIC PREVIEW (no props, decorative Upload/Download buttons, a
// hardcoded "Last import" fixture) — read as the reference and never imported. This screen is
// composed from the SAME approved primitives — PageHeader / Card / CardHeader / CardBody /
// Banner / Button / Tag / Icon — with the same copy and classes, wiring the delta on top: a real
// `<input type="file">` + drag-and-drop, a real disabled/loading Upload control, a real POST, and
// real per-status error surfacing (415 with the true reason, 413, 422 row errors, 400, 403).
//
// TWO LOGGED DEVIATIONS from the preview's exact copy (not silent reconciliation):
//  1. The preview's upload-card hint reads "first name · last initial · age band · status" — but
//     this ticket's CSV contract (src/application/roster/services.py) takes `name` + `age` OR
//     `grade` (the server does the banding), plus optional `external_ref`/`status`. The preview's
//     hint describes a shape this endpoint does not accept. Kept the approved hint text verbatim
//     per the reuse rule, and added the REAL accepted columns as a second line so the control is
//     actually usable — flagged for the design/BE owners to reconcile, not silently changed here.
//  2. The preview's "Last import" card shows fabricated reconciliation counts ("reactivated 2 ·
//     deactivated 1") — that is FR-03-05's response shape ({stayers_active, leavers_deactivated,
//     new_added}), explicitly out of scope for FR-03-01 (ticket §Out-of-scope: "reconciliation of
//     a re-import belongs to FR-03-05"). This endpoint returns only {imported, banded}, so the
//     card is wired to those REAL fields from the last successful import THIS session, never to
//     invented reconciliation numbers.
//
// SHELL — same logged deviation as FR-19-05's DefaultWordListsApp / FR-20-06's
// LeadershipConsentApp: the approved screen wraps itself in `AppShell {...chrome('teacher', ...)}`;
// this route mounts UNDER the real routed app shell (`/app` layout route), so only the approved
// CONTENT is composed here.

const ACCEPT = ".csv,text/csv"
const TEMPLATE_CSV = "name,age,grade,external_ref,status\nAmy Smith,6,,ext-001,active\n"

function failureMessage(failure: RosterImportFailure): string {
  return failure.message
}

export function RosterImportApp() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? null

  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [failure, setFailure] = useState<RosterImportFailure | null>(null)
  const [lastImport, setLastImport] = useState<{ when: string; result: RosterImportResult } | null>(null)

  const canUpload = !!file && !!schoolId && !uploading

  function pickFile(next: File | null) {
    setFile(next)
    setFailure(null)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) pickFile(dropped)
  }

  async function upload() {
    if (!file || !schoolId) return
    setUploading(true)
    setFailure(null)
    try {
      const outcome = await importRoster(schoolId, file)
      if (outcome.kind === "success") {
        setLastImport({ when: new Date().toLocaleString(), result: outcome.result })
        setFile(null)
        if (inputRef.current) inputRef.current.value = ""
      } else {
        setFailure(outcome.failure)
      }
    } finally {
      setUploading(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "roster-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader crumb="Roster / Import" title="Import your roster" sub="CSV only · you decide who is active" />

      <div className="max-w-[660px]"> {/* token-ok: approved value, verbatim from RosterImport.tsx (do-not-restyle) */}
        <Card>
          <CardHeader
            icon={<Icon.Upload />}
            title="Upload a CSV"
            hint="first name · last initial · age band · status"
          />
          <CardBody>
            <p className="mb-2.5 text-xs text-neutral-500">
              Accepted columns: <b>name</b> (required), <b>age</b> or <b>grade</b> (required — the
              server bands each student), optional <b>external_ref</b> and <b>status</b>.
            </p>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`cursor-pointer rounded-lg border-2 border-dashed px-5 py-9 text-center text-neutral-500 ${dragOver ? "border-coral bg-coral-50" : "border-neutral-300 bg-neutral-50"}`}
            >
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg border border-neutral-200 bg-surface text-neutral-400 [&_svg]:h-4 [&_svg]:w-4">
                <Icon.Upload />
              </div>
              <div className="text-sm font-semibold text-neutral-700">
                {file ? file.name : "Drop a .csv roster here or choose a file"}
              </div>
              <div className="mt-1 text-xs">Up to 500 students · UTF-8 · one row per student</div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              aria-label="Choose a CSV roster file"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            <div className="mt-3.5">
              <Banner icon={<Icon.Check />}>
                CSV import only — no automated roster sync (Clever/ClassLink are later).
              </Banner>
            </div>

            {!schoolId && (
              <div role="alert">
                <Banner tone="danger" icon={<Icon.Alert />}>
                  No school is associated with your session — sign in again to import a roster.
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

            <div className="flex gap-2.5">
              <Button variant="ink" icon={<Icon.Upload />} disabled={!canUpload} onClick={() => void upload()}>
                {uploading ? "Uploading…" : "Upload"}
              </Button>
              <Button variant="ghost" icon={<Icon.File />} onClick={downloadTemplate}>
                Download template
              </Button>
            </div>
          </CardBody>
        </Card>

        {lastImport && (
          <div className="mt-4">
            <Card>
              <CardHeader icon={<Icon.Clock />} title="Last import" hint={lastImport.when} />
              <CardBody>
                <Tag tone="ok" icon={<Icon.Check />}>
                  Imported {lastImport.result.imported} · banded {lastImport.result.banded}
                </Tag>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
