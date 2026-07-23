import { Link, useNavigate } from "react-router-dom"

import { AuthCard, AuthField, Banner, Button, Icon, Input } from "@design/components"

/**
 * SC-026 — Register your school (FR-02-01 · US-02-01).
 *
 * COMPOSED from the approved primitives (`@design/components`) on the structure, copy and classes of
 * `design/approved/screens/RegisterSchool.tsx`. That approved file is a static PREVIEW — it is NOT
 * imported: it ships `href="#"` dead links and `defaultValue` fixtures, neither of which may reach
 * production. Presentational only; the container (./index) owns state, the API call and routing.
 *
 * DELTAS vs the approved screen (raised, never silently reconciled — see the report/gate doc):
 *   1. A "Password" field is ADDED. The built backend contract requires `password` (8..256) to
 *      create the registrant's staff account; the approved static mock has no such field, and the
 *      registration cannot succeed without it.
 *   2. The approved "District / trust" <Select> is OMITTED. The built contract has no district
 *      field, so the value could not be sent — rendering it would be a dead control carrying a
 *      hardcoded fixture option ("Northwood Learning Trust"), which is exactly what must not ship.
 *   3. The footer "Back to sign in" is a real routed <Link>, not the preview's `href="#"`.
 */

export interface RegisterSchoolFormProps {
  schoolName: string
  email: string
  password: string
  onSchoolName: (v: string) => void
  onEmail: (v: string) => void
  onPassword: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
  /** 403/409 — the school (or the account) already exists, so offer the real way forward. */
  offerSignIn: boolean
}

const SIGN_IN_PATH = "/sign-in"

function BackToSignIn() {
  return <Link to={SIGN_IN_PATH}>Back to sign in</Link>
}

export function RegisterSchoolScreen({
  schoolName,
  email,
  password,
  onSchoolName,
  onEmail,
  onPassword,
  onSubmit,
  submitting,
  error,
  offerSignIn,
}: RegisterSchoolFormProps) {
  const navigate = useNavigate()

  // Convenience only — the server is the authoritative validator (empty name, RFC-5322 email and
  // the 8-character minimum are all re-checked there and surfaced from the 422).
  const complete =
    schoolName.trim().length > 0 && email.trim().length > 0 && password.length > 0

  return (
    <AuthCard
      title="Register your school"
      sub="A trust admin approves it before you go live"
      footer={<BackToSignIn />}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        {error ? (
          <div role="alert">
            <Banner tone="danger" icon={<Icon.Alert />}>
              {error}
            </Banner>
          </div>
        ) : null}
        {submitting ? (
          <div role="status">
            <Banner tone="info" icon={<Icon.Clock />}>
              Submitting your school for approval…
            </Banner>
          </div>
        ) : null}

        <AuthField label="School name">
          <Input
            aria-label="School name"
            autoComplete="organization"
            placeholder="Maple Primary School"
            value={schoolName}
            onChange={(e) => onSchoolName(e.target.value)}
          />
        </AuthField>
        <AuthField label="Your work email">
          <Input
            type="email"
            aria-label="Your work email"
            autoComplete="email"
            placeholder="head@maple-primary.sch.uk"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </AuthField>
        {/* Delta 1 — required by the built contract; the approved mock omits it. */}
        <AuthField label="Password">
          <Input
            type="password"
            aria-label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
          />
        </AuthField>

        <Button variant="ink" block className="mt-1" type="submit" disabled={submitting || !complete}>
          {submitting ? "Submitting…" : "Submit for approval"}
        </Button>
      </form>

      {offerSignIn ? (
        <div className="mt-2.5">
          <Button variant="ghost" block type="button" onClick={() => navigate(SIGN_IN_PATH)}>
            Go to sign in
          </Button>
        </div>
      ) : null}
    </AuthCard>
  )
}

/**
 * The pending confirmation — the state the approved (presentational) screen exposes no slot for.
 * Rendered entirely with approved primitives, so no new styling is authored. The lifecycle word is
 * the one the SERVER returned (201 `status`), never a client-side assumption.
 */
export function RegistrationPendingScreen({
  schoolName,
  status,
}: {
  schoolName: string
  status: string
}) {
  return (
    <AuthCard
      title="Registration submitted"
      sub="A trust admin approves it before you go live"
      footer={<BackToSignIn />}
    >
      <div role="status">
        <Banner tone="info" icon={<Icon.Shield />}>
          {schoolName} is registered and its status is {status}.
        </Banner>
      </div>
      <p className="text-xs leading-relaxed text-neutral-500">
        A District or Trust admin needs to approve it before it goes live. Until then the school is
        not live, so student check-ins are not yet available.
      </p>
    </AuthCard>
  )
}
