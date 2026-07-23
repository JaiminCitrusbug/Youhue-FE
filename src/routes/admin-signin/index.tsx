import { useRef, useState, type KeyboardEvent } from "react"
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
// same copy. Every class comes from `@design`; the only local utilities are the approved screen's
// own `mt-1` / `mt-2` theme-scale spacing and the MFA code-box classes, which are reproduced from
// the approved screen VERBATIM under `token-ok` consts (see `CODE_BOX_CLS` below) because the
// preview's `CodeBoxes` helper is file-private and therefore cannot be imported.
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

      {/*
        COPY RULE (one rule, both phases): copy matches PRODUCT TRUTH — the BE emails the OTP
        (`api.ts:5-6`), so every line says *where* the code arrives. The approved preview's copy
        ("You’ll be asked for a 6-digit MFA code." here, "…from your authenticator" / "Lost your
        device?" on phase 2) describes an authenticator-app flow that the implemented email-OTP
        flow contradicts, so it is NOT copied verbatim; it is logged as a design-copy fix against
        `design/approved/screens/AdminSignIn.tsx:16,43,44` (review FR-19-01 Minor 1).
      */}
      <Banner tone="info" icon={<Icon.Flag />}>
        We’ll email you a 6-digit code to finish signing in.
      </Banner>
    </AuthCard>
  )
}

// ── SC-073 · the approved 6-box MFA code entry ────────────────────────────────
// The approved screen presents the code as SIX single-digit boxes
// (`design/approved/screens/AdminSignIn.tsx` → file-private `CodeBoxes`, :23-37, used at :46).
// That helper is not exported from the design library (absent from `components/index.ts` and from
// `_COMPONENT_API.md`'s surface), so it cannot be imported — and `@design/screens/*` is a static
// preview that must never be imported. Per `CLAUDE.md` step 7 the approved raw values are therefore
// reproduced here VERBATIM under `token-ok` consts. They are NOT re-skinned onto the theme scale:
// `main`'s deleted `screens.tsx` did that and silently drifted 46px → 48px and 19px → 18px.
const CODE_ROW_CLS = "my-1 mb-4 flex justify-center gap-2.5"
const CODE_BOX_CLS = "h-[46px] w-[46px] rounded-md border border-neutral-200 bg-neutral-50 text-center text-[19px] font-extrabold focus:border-coral focus:shadow-focus focus:outline-none" // token-ok: approved value (do-not-restyle)
const CODE_BOX_FILLED_CLS = "text-neutral-900"
const CODE_BOX_EMPTY_CLS = "text-neutral-300"

const CODE_LENGTH = 6
const CODE_INDEXES = [0, 1, 2, 3, 4, 5]

/**
 * The approved box row, wired for real use — six REAL `<input>`s over ONE underlying 6-digit value.
 *
 * Why six real inputs (and not `main`'s deleted `sr-only` input behind six non-focusable `<div>`s):
 * the approved class string ends in `focus:border-coral focus:shadow-focus focus:outline-none`, so
 * the focus indication only exists if the box itself is the focused element. Real inputs also keep
 * the row keyboard-operable (auto-advance, backspace-to-previous, arrow keys) and let the OS drop a
 * `one-time-code` autofill straight into it. There is still exactly ONE value: `code` in the parent.
 * Every path in (keystroke, paste, autofill) funnels through `write()` and the digits-only sanitiser.
 */
function CodeBoxes({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const boxes = useRef<Array<HTMLInputElement | null>>([])
  const focusBox = (i: number) => boxes.current[Math.max(0, Math.min(i, CODE_LENGTH - 1))]?.focus()

  /**
   * Write `raw` into the single value at box `i`. One path for a keystroke, a paste and an OS
   * autofill. `at` clamps to the end of what has been entered, so the value can never grow a gap
   * (clicking box 5 of an empty row and typing writes digit 1, then advances to box 2).
   */
  function write(i: number, raw: string) {
    const at = Math.min(i, value.length)
    const digits = raw.replace(/\D/g, "")
    if (!digits) {
      // the box was cleared (or a non-digit was rejected) — drop that digit, keep the rest
      onChange(value.slice(0, at) + value.slice(at + 1))
      return
    }
    onChange(value.slice(0, at) + digits + value.slice(at + digits.length))
    focusBox(at + digits.length)
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    const at = Math.min(i, value.length)
    if (e.key === "Backspace" && !e.currentTarget.value && at > 0) {
      e.preventDefault()
      onChange(value.slice(0, at - 1) + value.slice(at))
      focusBox(at - 1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusBox(i - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusBox(i + 1)
    }
  }

  return (
    <div role="group" aria-label="6-digit code" className={CODE_ROW_CLS}>
      {CODE_INDEXES.map((i) => {
        const v = value[i] ?? ""
        return (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el
            }}
            type="text"
            maxLength={1}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={i === 0}
            aria-label={`Digit ${i + 1}`}
            value={v}
            onChange={(e) => write(i, e.target.value)}
            onPaste={(e) => {
              // paste anywhere in the row fills forward: "481 902" → 481902
              e.preventDefault()
              write(i, e.clipboardData.getData("text"))
            }}
            onKeyDown={(e) => onKeyDown(i, e)}
            className={`${CODE_BOX_CLS} ${v ? CODE_BOX_FILLED_CLS : CODE_BOX_EMPTY_CLS}`}
          />
        )
      })}
    </div>
  )
}

// ── SC-073 · phase 2 — MFA challenge (enter the emailed 6-digit code) ─────────
// Mirrors `@design/screens/AdminSignIn` → AdminMfaChallenge(): AuthCard (+footer) → the approved
// 6-box code row → ink Button.
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
        {/* ONE value, one sanitiser — digits only, capped at 6 — however the digits arrive. */}
        <CodeBoxes
          value={code}
          onChange={(next) => setCode(next.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        />

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
