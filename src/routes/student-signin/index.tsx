import { useEffect, useState, type ReactNode } from "react"
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom"

import { Banner, Icon } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { studentSignIn } from "./api"
import { CodeScreen } from "./CodeScreen"
import { NameScreen } from "./NameScreen"
import { QRScreen } from "./QRScreen"

// FR-01-02 · Decision #4 — the student sign-in owns its OWN FE route module, isolable from the
// staff/admin routes. It exposes ONLY the three passwordless sign-in methods (SC-020 code,
// SC-022 QR, SC-021 name/avatar) and NOTHING staff (no dashboard/alerts) — Gherkin Scenario 3.
// Mounted by the top-level router at `/student/sign-in/*`.
//
//   /student/sign-in        → SC-020  enter class/school code
//   /student/sign-in/scan   → SC-022  scan a class QR
//   /student/sign-in/who    → SC-021  pick name/avatar → sign in
//
// LOOK SOURCE: the screens are COMPOSED from the approved primitives (`@design/components`) on the
// approved screens' own structure/copy/classes. The approved `screens/*` files are static PREVIEWS
// (device-bezel `PhoneFrame`, `href="#"` links, fixture values, no states) and are NOT rendered:
// the student app is a mobile PWA, so this surface is FULL-BLEED — no bezel — exactly as before.
//
// The two entry credentials are mutually exclusive: a QR arrives as a deep-link `?qr=<token>`
// (the teacher's QR encodes it; the device camera app opens the link), otherwise the student
// types a code. On success the student lands on their daily check-in (FR-04-01, placeholder here).

const CODE_PATH = "/student/sign-in"
const SCAN_PATH = "/student/sign-in/scan"
const WHO_PATH = "/student/sign-in/who"

// Full-bleed student surface: the warm coral canvas the approved design puts INSIDE the preview's
// device frame, filling the viewport instead. Stock layout utilities + theme colours only.
const SURFACE = "flex min-h-screen justify-center bg-coral-canvas font-sans text-neutral-900"
const COLUMN = "flex min-h-screen w-full max-w-sm flex-col px-6 pb-6 pt-5"

/**
 * The surface + the two states the approved (presentational) screens expose no slot for. Both are
 * rendered with the approved `Banner` primitive, so no new styling is authored. Screens render as
 * fragments, so their own children are the flex children of COLUMN and `mt-auto` still pins the
 * action block to the bottom of the viewport.
 */
function StudentSurface({ error, busy, children }: { error: string | null; busy: boolean; children: ReactNode }) {
  return (
    <div className={SURFACE}>
      <div className={COLUMN}>
        {error ? (
          <div role="alert">
            <Banner tone="danger" icon={<Icon.Alert />}>
              {error}
            </Banner>
          </div>
        ) : null}
        {busy ? (
          <div role="status">
            <Banner tone="info" icon={<Icon.Clock />}>
              Signing you in…
            </Banner>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function StudentSignInApp() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [params] = useSearchParams()

  const [code, setCode] = useState("")
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A scanned class QR opens the app deep-linked with ?qr=<token>: adopt it (clearing any typed
  // code, so the two stay mutually exclusive) and go straight to name selection.
  useEffect(() => {
    const qr = params.get("qr")
    if (qr) {
      setQrToken(qr)
      setCode("")
      navigate(WHO_PATH, { replace: true })
    }
  }, [params, navigate])

  async function submit(studentId: string) {
    setSubmitting(true)
    setError(null)
    try {
      const body = qrToken
        ? { qr_token: qrToken, student_id: studentId }
        : { school_or_class_code: code, student_id: studentId }
      await studentSignIn(body)
      await refresh() // loads /me for the new student session so the guarded surface can mount
      navigate("/student")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StudentSurface error={error} busy={submitting}>
      <Routes>
        <Route
          index
          element={
            <CodeScreen
              code={code}
              onChange={(c) => {
                setCode(c)
                setQrToken(null)
                setError(null)
              }}
              onContinue={() => navigate(WHO_PATH)}
              onScanQR={() => navigate(SCAN_PATH)}
            />
          }
        />
        <Route path="scan" element={<QRScreen onBack={() => navigate(CODE_PATH)} onTypeCode={() => navigate(CODE_PATH)} />} />
        <Route
          path="who"
          element={<NameScreen onConfirm={submit} onBack={() => navigate(CODE_PATH)} submitting={submitting} />}
        />
      </Routes>
    </StudentSurface>
  )
}
