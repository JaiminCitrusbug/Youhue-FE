import { useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { registerSchool } from "./api"
import { RegisterSchoolScreen, RegistrationPendingScreen } from "./RegisterSchoolScreen"

// FR-02-01 · SC-026 — school self-registration owns its OWN FE route module (the same layout the
// student-signin / admin-signin modules use). It is PRE-LOGIN, so it uses the approved AuthCard
// frame, never `AppShell`/`chrome(...)` (those carry a fixture person and hrefless nav links).
// Mounted by the top-level router at `/register-school/*`.
//
//   /register-school   → SC-026  register your school → the school is created PENDING
//
// A teacher self-registers; the backend creates the school in a **pending** state that is not live
// and cannot run student check-ins until a District/Trust admin approves it (FR-02-02, out of scope
// here). A duplicate school name is refused with a terminal 409 and surfaced as guidance (sign in,
// or ask a colleague to invite you) with a real route to sign-in — there is NO join endpoint to
// build against. A registration is never failed silently.

const REGISTER_PATH = "/register-school"

const NETWORK_ERROR = "Something went wrong. Please try again."

export function SchoolRegisterApp() {
  const [schoolName, setSchoolName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offerSignIn, setOfferSignIn] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [registeredName, setRegisteredName] = useState("")

  async function submit() {
    if (submitting) return // a second submit while one is in flight is a no-op (the button is disabled too)
    setSubmitting(true)
    setError(null)
    setOfferSignIn(false)
    try {
      const outcome = await registerSchool({
        school_name: schoolName.trim(),
        registrant_email: email.trim(),
        password,
      })
      if (outcome.kind === "created") {
        setRegisteredName(schoolName.trim())
        setPendingStatus(outcome.status)
      } else {
        setError(outcome.message)
        // 409 (name taken) — the way forward is signing in, so offer it as a real control.
        setOfferSignIn(outcome.reason === "conflict")
      }
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  const screen = pendingStatus !== null ? (
    <RegistrationPendingScreen schoolName={registeredName} status={pendingStatus} />
  ) : (
    <RegisterSchoolScreen
      schoolName={schoolName}
      email={email}
      password={password}
      onSchoolName={setSchoolName}
      onEmail={setEmail}
      onPassword={setPassword}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      offerSignIn={offerSignIn}
    />
  )

  return (
    <Routes>
      <Route index element={screen} />
      <Route path="*" element={<Navigate to={REGISTER_PATH} replace />} />
    </Routes>
  )
}
