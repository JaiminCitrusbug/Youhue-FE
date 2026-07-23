/**
 * SC-015 — Forgot password · request (FR-01-06). Step 1 of 3. Always routes to the same generic
 * "check your email" result — the response never discloses whether the account exists, and an
 * SSO-only account simply receives no email (the BE issues no reset token). Scenario 5 is honoured
 * by never presenting an SSO-specific reset path here.
 */
import * as React from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthCard, AuthField, Button, Input } from "@design/components"
import { staffForgotPassword } from "./api"

export function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await staffForgotPassword(email)
      // Same result for every address (registered, SSO-only, or unknown) — no disclosure.
      navigate("/sign-in/check-email")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      sub="Step 1 of 3"
      footer={<Link to="/sign-in">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit}>
        {error && (
          <p role="alert" className="mb-3 text-center text-xs font-semibold text-status-danger">
            {error}
          </p>
        )}
        <AuthField label="School email">
          <Input
            type="email"
            autoComplete="username"
            placeholder="r.okafor@maple-primary.sch.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>
        <Button variant="ink" block className="mt-1" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  )
}
