/**
 * SC-014 — Staff sign-in (FR-01-03 · US-01-03). Reproduces the approved StaffSignIn design screen
 * on the shared primitives, wired to the staff-auth API. Two credential methods: email/password
 * and Google/Microsoft SSO. Errors are GENERIC (no account-existence disclosure). If the BE reports
 * `mfa_required`, an in-card verification step follows before the session is issued.
 */
import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthCard, AuthField, Button, Divider, Input } from "../../components/ui"
import { staffMfaVerify, staffSignIn } from "./api"
import { resolveSchoolCode, useSignInComplete } from "./session"
import { startSso, type SsoProvider } from "./sso"
import { GoogleLogo, MicrosoftLogo } from "./VendorLogos"

// Generic messages only — a failed sign-in must not reveal whether the email is registered.
const GENERIC_ERROR = "That email or password is not correct."
const LOCKED_ERROR = "This account is temporarily locked after repeated attempts. Try again later."
const RATE_ERROR = "Too many attempts. Please wait a moment and try again."
const NETWORK_ERROR = "Something went wrong. Please try again."

function messageForStatus(status: number): string {
  if (status === 423) return LOCKED_ERROR
  if (status === 429) return RATE_ERROR
  return GENERIC_ERROR // 401 and any other non-2xx collapse to the same generic text
}

const LEGAL_LINKS_CLS = "mt-3 flex justify-center gap-3 text-[11px] text-neutral-400" // token-ok: approved Design-final-v3 value (do-not-restyle)

export function StaffSignInScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const complete = useSignInComplete()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  // MFA sub-state: the sign-in token doubles as the session_token for the verify step.
  const [mfaSession, setMfaSession] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { status, data } = await staffSignIn(email, password)
      if (status === 200 && data) {
        if (data.mfa_required) setMfaSession(data.access_token)
        else await complete(data.access_token)
      } else {
        setError(messageForStatus(status))
      }
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!mfaSession) return
    setError(null)
    setBusy(true)
    try {
      const { status, data } = await staffMfaVerify(mfaSession, code)
      if (status === 200 && data) await complete(data.access_token)
      else setError("That code is not correct or has expired.")
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  async function onSso(provider: SsoProvider) {
    setError(null)
    try {
      const outcome = await startSso(provider, resolveSchoolCode(email, location.search))
      if (outcome.kind === "ok") {
        await complete(outcome.accessToken)
      } else {
        // First-time SSO matching an existing email account -> confirm the link (Scenario 3).
        navigate("/sign-in/link", { state: outcome })
      }
    } catch {
      // Popup blocked / closed / provider error — all collapse to a generic message (no disclosure).
      setError("We couldn't complete single sign-on. Please try again.")
    }
  }

  if (mfaSession) {
    return (
      <AuthCard
        title="Enter your verification code"
        sub="We sent a one-time code to your email"
        footer={
          <button type="button" onClick={() => setMfaSession(null)}>
            Back to sign in
          </button>
        }
      >
        <form onSubmit={onVerify}>
          {error && (
            <p role="alert" className="mb-3 text-center text-xs font-semibold text-status-danger">
              {error}
            </p>
          )}
          <AuthField label="Verification code">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </AuthField>
          <Button variant="ink" block className="mt-1" type="submit" disabled={busy}>
            {busy ? "Verifying…" : "Verify & sign in"}
          </Button>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Sign in to Student Wellbeing"
      sub="Staff accounts — students use the student app"
      footer={
        <>
          <div>
            <Link to="/sign-in/forgot">Forgot password?</Link> &nbsp;·&nbsp;{" "}
            <a href="#">Register a new school</a>
          </div>
          <div className={LEGAL_LINKS_CLS}>
            <Link to="/terms">Terms</Link>
            <Link to="/terms">Privacy</Link>
            <Link to="/terms">COPPA/FERPA</Link>
          </div>
        </>
      }
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
        <AuthField label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>
        <Button variant="ink" block className="mt-1" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Divider>or</Divider>

      <div className="flex flex-col gap-2.5">
        <Button variant="ghost" block icon={<GoogleLogo />} onClick={() => onSso("google")}>
          Continue with Google
        </Button>
        <Button variant="ghost" block icon={<MicrosoftLogo />} onClick={() => onSso("microsoft")}>
          Continue with Microsoft
        </Button>
      </div>
    </AuthCard>
  )
}
