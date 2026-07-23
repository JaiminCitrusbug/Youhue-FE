import { useState } from "react"
import { Route, Routes, useNavigate } from "react-router-dom"

import { AuthCard, AuthField, Banner, Button, Divider, Icon, Input } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { adminSignIn } from "./api"

// FR-19-01 · Decision #4 — the admin console sign-in owns its OWN FE route module, isolable from
// the staff/student surfaces (it imports neither). It exposes only the internal-admin sign-in flow
// and NOTHING else. Mounted by the top-level router at `/admin/sign-in/*`.
//
//   /admin/sign-in         → SC-073   email + password  (phase 1 → BE emails an OTP)
//   /admin/sign-in/verify  → SC-073   MFA challenge     (phase 2 → mints the admin session)
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT. The visual truth is the approved, vendored design
// library at ./design/approved (alias `@design`); `@design/screens/AdminSignIn` is a STATIC preview
// (no props, `defaultValue` fixtures), so it cannot be wired directly. The two screens below are
// therefore composed from the SAME approved primitives that preview composes itself from
// (AuthCard / AuthField / Input / Button / Divider / Banner / Icon), in the same order, with the
// same copy. This file adds NO raw style values — every class comes from `@design`; the only local
// utility is the approved screen's own `mt-1` / `mt-2` theme-scale spacing.
//
// TWO-PHASE MFA on a single endpoint: the container holds email+password and RESUBMITS them
// together with the emailed code (there is no pending-session token). On success the response's
// `admin_session` bearer is stored in memory (api.ts), `/me` is refreshed, and the flow routes to
// the admin console (the role-guarded `/app/admin` landing — the real console is FR-19-02/04/05/07).

const SIGN_IN_PATH = "/admin/sign-in"
const VERIFY_PATH = "/admin/sign-in/verify"

/** Generic, non-enumerating error surface (approved `Banner tone="danger"`). */
function ErrorAlert({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div role="alert">
      <Banner tone="danger" icon={<Icon.Alert />}>
        {error}
      </Banner>
    </div>
  )
}

// ── SC-073 · phase 1 — internal admin (email + password) ──────────────────────
// Mirrors `@design/screens/AdminSignIn` → AdminSignIn(): AuthCard → 2× AuthField/Input →
// ink Button → Divider "then" → info Banner. Delta = controlled values + submit/disabled/error.
function AdminCredentials({
  email,
  password,
  onEmail,
  onPassword,
  onSubmit,
  submitting,
  error,
}: {
  email: string
  password: string
  onEmail: (v: string) => void
  onPassword: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}) {
  return (
    <AuthCard title="Internal admin" sub="MFA required">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <AuthField label="Email">
          <Input
            type="email"
            aria-label="Email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </AuthField>
        <AuthField label="Password">
          <Input
            type="password"
            aria-label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
          />
        </AuthField>

        <ErrorAlert error={error} />

        <Button
          type="submit"
          variant="ink"
          block
          icon={<Icon.Flag />}
          className="mt-1"
          disabled={submitting || !email || !password}
        >
          {submitting ? "Checking…" : "Continue"}
        </Button>
      </form>

      <Divider>then</Divider>

      <Banner tone="info" icon={<Icon.Flag />}>
        You’ll be asked for a 6-digit MFA code.
      </Banner>
    </AuthCard>
  )
}

// ── SC-073 · phase 2 — MFA challenge (enter the emailed 6-digit code) ─────────
// Mirrors `@design/screens/AdminSignIn` → AdminMfaChallenge(): AuthCard (+footer) → code entry →
// ink Button. The preview's 6 code boxes are a file-private helper of the STATIC preview and are
// built on raw `[46px]/[19px]` values, so they are not part of the approved library surface; the
// component API pins pre-login entry to `AuthField` + `Input`, which is what the wrapper reuses.
function AdminMfaChallenge({
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  onSubmit: (code: string) => void
  onBack: () => void
  submitting: boolean
  error: string | null
}) {
  const [code, setCode] = useState("")

  return (
    <AuthCard
      title="MFA challenge"
      sub="Enter the 6-digit code we emailed you"
      footer={
        <>
          Lost access? <a href="/terms">Contact platform security</a>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(code)
        }}
      >
        <AuthField label="6-digit code">
          <Input
            aria-label="6-digit code"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </AuthField>

        <ErrorAlert error={error} />

        <Button type="submit" variant="ink" block icon={<Icon.Check />} disabled={submitting || code.length < 6}>
          {submitting ? "Verifying…" : "Verify"}
        </Button>
        <Button type="button" variant="ghost" block className="mt-2" onClick={onBack}>
          Back to sign-in
        </Button>
      </form>
    </AuthCard>
  )
}

export function AdminSignInApp() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Phase 1: verify email+password → the BE emails an OTP → advance to the MFA challenge.
  async function submitCredentials() {
    setSubmitting(true)
    setError(null)
    try {
      await adminSignIn({ email, password })
      navigate(VERIFY_PATH)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Phase 2: RESUBMIT email+password together with the emailed code → mint the admin session.
  async function submitCode(code: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await adminSignIn({ email, password, mfa_code: code })
      if (!res.admin_session) {
        // Generic — no factor/account disclosure.
        setError("Sign-in failed. Check your details and try again.")
        return
      }
      await refresh() // loads /me for the new admin session so the guarded console can mount
      navigate("/app") // RoleHome routes an admin-kind session to its console landing
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Routes>
      <Route
        index
        element={
          <AdminCredentials
            email={email}
            password={password}
            onEmail={setEmail}
            onPassword={setPassword}
            onSubmit={submitCredentials}
            submitting={submitting}
            error={error}
          />
        }
      />
      <Route
        path="verify"
        element={
          <AdminMfaChallenge
            onSubmit={submitCode}
            onBack={() => {
              setError(null)
              navigate(SIGN_IN_PATH)
            }}
            submitting={submitting}
            error={error}
          />
        }
      />
    </Routes>
  )
}
