import { useState } from "react"
import { Route, Routes, useNavigate } from "react-router-dom"

import { useAuth } from "../../app/AuthContext"
import { adminSignIn } from "./api"
import { AdminCredentials, AdminMfaChallenge } from "./screens"

// FR-19-01 · Decision #4 — the admin console sign-in owns its OWN FE route module, isolable from
// the staff/student surfaces (it imports neither). It exposes only the internal-admin sign-in flow
// and NOTHING else. Mounted by the top-level router at `/admin/sign-in/*`.
//
//   /admin/sign-in         → SC-073   email + password  (phase 1 → BE emails an OTP)
//   /admin/sign-in/verify  → SC-073   AdminMfaChallenge (phase 2 → mints the admin session)
//
// TWO-PHASE MFA on a single endpoint: the container holds email+password and RESUBMITS them
// together with the emailed code (there is no pending-session token). On success the response's
// `admin_session` bearer is stored in memory (api.ts), `/me` is refreshed, and the flow routes to
// the admin console (the role-guarded `/app/admin` landing — the real console is FR-19-02/04/05/07).

const SIGN_IN_PATH = "/admin/sign-in"
const VERIFY_PATH = "/admin/sign-in/verify"

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
