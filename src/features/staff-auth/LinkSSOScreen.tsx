/**
 * SC-018 — Link SSO to an existing account (FR-01-04 · Scenario 3). Reached when a first-time SSO
 * sign-in matches an existing email account and the BE asks the user to confirm the link. On confirm,
 * both methods afterwards resolve to ONE single staff identity. Direct navigation (no pending link)
 * bounces back to sign-in. Cancelling returns to sign-in without linking.
 */
import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { AuthCard, Banner, Button, Icon } from "../../components/ui"
import { staffSsoLink } from "./api"
import { useSignInComplete } from "./session"
import type { SsoLinkRequired } from "./sso"

export function LinkSSOScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const complete = useSignInComplete()
  const pending = location.state as SsoLinkRequired | null
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (!pending || pending.kind !== "link_required") {
    return (
      <AuthCard title="Nothing to link" sub="Start again from sign in">
        <Button variant="ghost" block onClick={() => navigate("/sign-in")}>
          Back to sign in
        </Button>
      </AuthCard>
    )
  }

  async function onConfirm() {
    if (!pending) return
    setError(null)
    setBusy(true)
    try {
      const { status, data } = await staffSsoLink(pending.linkToken)
      if (status === 200 && data) await complete(data.access_token)
      else setError("We couldn't link your accounts. Please try again.")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Confirm account link">
      {error && (
        <p role="alert" className="mb-3 text-center text-xs font-semibold text-status-danger">
          {error}
        </p>
      )}
      <Banner tone="info" icon={<Icon.Link />}>
        A {pending.provider === "microsoft" ? "Microsoft" : "Google"} identity matches an existing
        email account{pending.email ? ` (${pending.email})` : ""}.
      </Banner>
      <Button variant="ink" block onClick={onConfirm} disabled={busy}>
        {busy ? "Linking…" : "Link accounts & continue"}
      </Button>
      <Button variant="ghost" block className="mt-2.5" onClick={() => navigate("/sign-in")}>
        Cancel
      </Button>
    </AuthCard>
  )
}
