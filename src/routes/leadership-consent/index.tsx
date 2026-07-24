import { useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, Icon, Input, PageHeader, PersonCell, Table, Tag,
} from "@design/components"

import { recordConsent } from "./api"

// SC-088 · FR-20-06 — Parental-consent attestation: the school confirms verifiable parental
// consent has been obtained (COPPA), on the parent's behalf — there is no parent-facing screen
// (FERPA school-official exception). Leadership-only; the BE re-checks the role and school scope
// and returns 403 for anyone else (audited, never silent).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// ConsentAttestation.tsx` is a STATIC PREVIEW (no props, a hardcoded 3-row student fixture, no
// wiring), read as the reference and never imported. This screen is composed from the SAME
// approved primitives it composes itself from — PageHeader / Banner / Card / CardHeader / CardBody
// / Table / PersonCell / Tag / Icon — with the same copy and classes. The delta wired on top is:
// a real student-ID input (the roster/list-students endpoint the preview's fixture implies does
// not exist yet in this codebase — no lane has built one — so there is nothing to select FROM;
// leadership enters the ID of the student they are mediating consent for), the Confirm control,
// and the POST. The table below therefore shows THIS SESSION's capture history, not a fetched
// roster — logged deviation, not a silent reconciliation.
//
// SHELL — same logged deviation as FR-19-05's DefaultWordListsApp: the approved screen wraps
// itself in `AppShell {...chrome('leadership', ...)}`; this route mounts UNDER the real routed
// app shell (`/app` layout route), so only the approved CONTENT is composed here.

export function LeadershipConsentApp() {
  const [studentId, setStudentId] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recorded, setRecorded] = useState<{ studentId: string; status: string }[]>([])

  const canSubmit = studentId.trim().length > 0 && confirmed && !recording

  async function submit() {
    const id = studentId.trim()
    if (!id || !confirmed) return
    setRecording(true)
    setError(null)
    try {
      const res = await recordConsent(id)
      setRecorded((prev) => [{ studentId: id, status: res.status }, ...prev.filter((r) => r.studentId !== id)])
      setStudentId("")
      setConfirmed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't record consent. Please try again.")
    } finally {
      setRecording(false)
    }
  }

  return (
    <>
      <PageHeader
        crumb="COPPA · school-mediated · there is no parent-facing screen"
        title="Parental-consent attestation"
        sub="The school confirms consent on the parent’s behalf"
      />

      <Banner tone="info" icon={<Icon.Shield />}>
        Confirm verifiable parental consent has been obtained (COPPA) — school-mediated; no
        parent-facing screen.
      </Banner>

      <Card>
        <CardHeader
          icon={<Icon.Users />}
          title="Students"
          hint="enter a student ID, tick to attest, then Record consent"
        />
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700" htmlFor="consent-student-id">
                  Student ID
                </label>
                <Input
                  id="consent-student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Paste the student's ID"
                  autoComplete="off"
                />
              </div>

              {/* The approved Chip is a decorative, non-interactive checkbox glyph in the static
                  preview; a real attestation needs a real control, so this is a genuine checkbox
                  wearing the SAME Chip classes rather than the non-interactive Chip primitive. */}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-neutral-100 px-2.5 py-1 text-[11.5px] font-semibold text-neutral-600"> {/* token-ok: copied verbatim from Chip (feedback.tsx) */}
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[1.6px] border-neutral-400" // token-ok: copied verbatim from the approved ConsentAttestation.tsx ConfirmChip glyph
                />
                Confirm
              </label>

              <Button type="submit" variant="ink" icon={<Icon.Check />} disabled={!canSubmit}>
                {recording ? "Recording…" : "Record consent"}
              </Button>
            </div>
          </form>

          {error ? (
            <div role="alert">
              <Banner tone="danger" icon={<Icon.Alert />}>
                {error}
              </Banner>
            </div>
          ) : null}

          {recorded.length > 0 && (
            <Table
              head={["Student", "Consent"]}
              rows={recorded.map((r) => [
                <PersonCell key="p" initials="—" name={r.studentId} sub="this session" />,
                <Tag key="t" tone="ok" icon={<Icon.Check />}>
                  Recorded
                </Tag>,
              ])}
            />
          )}
        </CardBody>
      </Card>
    </>
  )
}
