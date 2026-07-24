/**
 * SC-076 — Trials / extension (FR-19-02 · US-19-02 · gate G-14). REUSES the approved design
 * screen: this composition follows `design/approved/screens/TrialManagement.tsx` in structure,
 * copy and classes, built from the vendored approved primitives. The delta is: loading the real
 * school + trial state on mount, wiring the extension button to the real PATCH, and the real
 * disabled/error states — including the 409 "already used" the approved Banner describes in copy
 * but the preview cannot enforce.
 *
 * Divergence — LOGGED: no `<AppShell {...chrome('admin', 'Trials')}>` wrapper (same reasoning as
 * SchoolAccounts.tsx (a) — this route renders inside the app's own routed shell).
 */
import { useCallback, useEffect, useState } from "react"

import { useParams } from "react-router-dom"

import { Banner, Button, Card, CardBody, CardHeader, EmptyState, Icon, KV, PageHeader } from "@design/components"

import { adminSchoolErrorMessage, extendTrial, getSchool, type SchoolDetail } from "./api"

// Approved raw value, copied VERBATIM (do-not-restyle). Tailwind has no 640px step.
// Source: design/approved/screens/TrialManagement.tsx:11
const CONTENT_COL_CLS = "max-w-[640px]" // token-ok: approved value (do-not-restyle)

function trialEndsLabel(school: SchoolDetail): string {
  if (!school.trial_end_at) return "No active trial"
  const ms = new Date(school.trial_end_at).getTime() - Date.now()
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  if (days < 0) return "Trial ended"
  if (days === 0) return "Ends today"
  return `in ${days} day${days === 1 ? "" : "s"}`
}

export function SchoolTrial() {
  const { schoolId } = useParams<{ schoolId: string }>()
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

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

  async function grantExtension() {
    if (!schoolId) return
    setBusy(true)
    setActionError(null)
    try {
      const res = await extendTrial(schoolId)
      setSchool(res.school)
      setConfirmed(true)
    } catch (e) {
      setActionError(adminSchoolErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const alreadyUsed = (school?.trial_extension_count ?? 0) >= 1

  return (
    <>
      <PageHeader crumb="Premium trial management" title="Trials / extension" sub={school?.name} />

      <div className={CONTENT_COL_CLS}>
        <Card>
          <CardHeader icon={<Icon.Clock />} title={school ? `${school.name} — trial` : "Trial"} />
          <CardBody>
            {loading ? (
              <EmptyState title="Loading trial details…" />
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
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <KV label="Trial ends">{trialEndsLabel(school)}</KV>
                  <KV label="Extensions used">{`${school.trial_extension_count} / 1`}</KV>
                </div>
                <div className="mb-3.5">
                  <Button
                    type="button"
                    variant="ink"
                    icon={<Icon.Check />}
                    onClick={grantExtension}
                    disabled={busy || alreadyUsed}
                  >
                    {busy ? "Granting…" : alreadyUsed ? "Extension already used" : "Grant 14-day extension"}
                  </Button>
                </div>

                {actionError ? (
                  <div role="alert">
                    <Banner tone="danger" icon={<Icon.Alert />}>
                      {actionError}
                    </Banner>
                  </div>
                ) : null}

                {confirmed ? (
                  <div role="status">
                    <Banner tone="info" icon={<Icon.Check />}>
                      Extended — this school's trial now ends {trialEndsLabel(school)}.
                    </Banner>
                  </div>
                ) : null}

                <Banner tone="warn" icon={<Icon.Alert />}>
                  Only one extension per school — a second attempt is refused.
                </Banner>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
