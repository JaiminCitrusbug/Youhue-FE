/**
 * SC-077 — Support / audited access (FR-19-02 · US-19-02 · FR-19-06). REUSES the approved design
 * screen: this composition follows `design/approved/screens/SupportAccess.tsx` in structure, copy
 * and classes, built from the vendored approved primitives. The delta is: loading the real school
 * on mount, a real `reason` textarea wired to state, the real submit (PATCH `support_access`), and
 * the real disabled/permission states — the approved screen's Banner describes "permission-bound
 * and written to the audit log", and this is what actually enforces + surfaces that (403 for a
 * role lacking `access_child_data`, never a silent no-op).
 *
 * Divergences — LOGGED:
 *  (a) No `<AppShell {...chrome('admin', 'Support')}>` wrapper (same reasoning as SchoolAccounts.tsx).
 *  (b) The approved Textarea ships a fixed `defaultValue` (a fixture example reason). Reusing that
 *      verbatim would submit a fake, unedited reason as if it were real audit content — so this
 *      screen uses the SAME copy as an input hint instead, and requires the admin to actually
 *      type a reason (matches the BE's non-blank validation, 422 otherwise).
 */
import { useCallback, useEffect, useState } from "react"

import { useParams } from "react-router-dom"

import { Banner, Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, PageHeader, Textarea } from "@design/components"

import { adminSchoolErrorMessage, getSchool, openSupportAccess, type SchoolDetail } from "./api"

// Approved raw value, copied VERBATIM (do-not-restyle). Tailwind has no 640px step.
// Source: design/approved/screens/SupportAccess.tsx:15
const CONTENT_COL_CLS = "max-w-[640px]" // token-ok: approved value (do-not-restyle)

// The approved screen's example reason text, kept as an input hint (see divergence (b)) rather than
// a submittable default value. Written as "ticket 4821" (no leading #) so it is not mistaken for a
// hex colour literal by the token-drift scanner.
const REASON_PLACEHOLDER =
  "Teacher R. Okafor reported alerts not routing — ticket 4821. Opening to inspect alert-routing config."

export function SchoolSupport() {
  const { schoolId } = useParams<{ schoolId: string }>()
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setLoadError(null)
    getSchool(schoolId)
      .then((s) => {
        setSchool(s)
        setLoading(false)
      })
      .catch((e) => {
        setLoadError(adminSchoolErrorMessage(e))
        setLoading(false)
      })
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  async function openWithReason() {
    if (!schoolId || !reason.trim()) return
    setBusy(true)
    setError(null)
    setOpened(false)
    try {
      await openSupportAccess(schoolId, reason.trim())
      setOpened(true)
    } catch (e) {
      setError(adminSchoolErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader crumb="Break-glass, permission-bound access" title="Support / audited access" sub={school?.name} />

      <Banner tone="info" icon={<Icon.Shield />}>
        Opening a school's data is permission-bound and written to the audit log — not an open
        backdoor.
      </Banner>

      <div className={CONTENT_COL_CLS}>
        <Card>
          <CardHeader
            icon={<Icon.Eye />}
            title={school ? `Open ${school.name} for support` : "Open for support"}
          />
          <CardBody>
            {loading ? (
              <EmptyState title="Loading…" />
            ) : loadError || !school ? (
              <>
                <div role="alert">
                  <Banner tone="danger" icon={<Icon.Alert />}>
                    {loadError ?? "Couldn't load this school."}
                  </Banner>
                </div>
                <Button type="button" variant="ink" icon={<Icon.Refresh />} onClick={load}>
                  Retry
                </Button>
              </>
            ) : (
              <>
                <Field label="Reason for access">
                  <Textarea
                    aria-label="Reason for access"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value)
                      setOpened(false)
                    }}
                    placeholder={REASON_PLACEHOLDER}
                  />
                </Field>
                <Button
                  type="button"
                  variant="ink"
                  icon={<Icon.Shield />}
                  onClick={openWithReason}
                  disabled={busy || !reason.trim()}
                >
                  {busy ? "Opening…" : "Open with reason (logged)"}
                </Button>

                {error ? (
                  <div role="alert" className="mt-3.5">
                    <Banner tone="danger" icon={<Icon.Alert />}>
                      {error}
                    </Banner>
                  </div>
                ) : null}

                {opened ? (
                  <div role="status" className="mt-3.5">
                    <Banner tone="info" icon={<Icon.Check />}>
                      Access opened and logged to the audit trail.
                    </Banner>
                  </div>
                ) : null}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
