/**
 * SC-017 — Set a new password (FR-01-06). Step 3 of 3. Consumes the single-use, expiring token
 * from the emailed reset link (`/sign-in/reset?token=…`) and sets a new password (BE -> 204), then
 * returns to sign-in. An invalid/expired/used token surfaces a generic error (never silently dropped).
 */
import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { AuthCard, AuthField, Button, Input } from "../../components/ui"
import { staffResetPassword } from "./api"

export function SetNewPasswordScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get("token") ?? ""

  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError("This reset link is invalid or has expired. Request a new one.")
      return
    }
    if (password.length < 8) {
      setError("Choose a password of at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }
    setBusy(true)
    try {
      const { status } = await staffResetPassword(token, password)
      if (status === 204) setDone(true)
      else setError("This reset link is invalid or has expired. Request a new one.")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        sub="You can now sign in with your new password"
        footer={<Link to="/sign-in">Back to sign in</Link>}
      >
        <Button variant="ink" block onClick={() => navigate("/sign-in")}>
          Go to sign in
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Set a new password" sub="Step 3 of 3">
      <form onSubmit={onSubmit}>
        {error && (
          <p role="alert" className="mb-3 text-center text-xs font-semibold text-status-danger">
            {error}
          </p>
        )}
        <AuthField label="New password">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>
        <AuthField label="Confirm password">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </AuthField>
        <Button variant="ink" block className="mt-1" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save & sign in"}
        </Button>
      </form>
    </AuthCard>
  )
}
