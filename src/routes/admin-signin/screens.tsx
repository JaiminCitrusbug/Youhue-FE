import { useState } from "react"

import { AdminAuthCard, AdminField, AdminInput, Divider, InkButton } from "./frame"
import { Icon } from "./icons"

// SC-073 — Admin console sign-in (email + password) and its AdminMfaChallenge step, componentized
// from the approved design (Youhue-DESIGN/approved/screens/AdminSignIn.tsx) on the shared theme
// ("Ink & Coral", src/styles/tailwind.theme.ts). Presentational + light local state; all wiring
// (the two-phase sign-in POST + navigation) lives in the container (./index). Design classes are
// reproduced on the shared 4px / theme token scale so token-drift stays 0 (no raw px/hex).

// ── SC-073 · Internal admin (email + password) ────────────────────────────────
export interface AdminCredentialsProps {
  email: string
  password: string
  onEmail: (v: string) => void
  onPassword: (v: string) => void
  onSubmit: () => void
  submitting?: boolean
  error?: string | null
}

export function AdminCredentials({
  email,
  password,
  onEmail,
  onPassword,
  onSubmit,
  submitting = false,
  error = null,
}: AdminCredentialsProps) {
  return (
    <AdminAuthCard title="Internal admin" sub="MFA required">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <AdminField label="Email" htmlFor="admin-email">
          <AdminInput
            id="admin-email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </AdminField>
        <AdminField label="Password" htmlFor="admin-password">
          <AdminInput
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
          />
        </AdminField>

        {error ? (
          <p role="alert" className="mb-3 text-sm font-semibold text-status-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-1">
          <InkButton type="submit" disabled={submitting || !email || !password} icon={<Icon.Flag />}>
            {submitting ? "Checking…" : "Continue"}
          </InkButton>
        </div>
      </form>

      <Divider>then</Divider>

      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-neutral-200 bg-ink-50 px-3 py-2.5 text-xs text-neutral-700 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-ink">
        <Icon.Flag />
        <span>We&apos;ll email you a 6-digit code to finish signing in.</span>
      </div>
    </AdminAuthCard>
  )
}

// ── SC-073 · MFA challenge (enter the emailed 6-digit code) ────────────────────
export interface AdminMfaChallengeProps {
  onSubmit: (code: string) => void
  onBack: () => void
  submitting?: boolean
  error?: string | null
}

export function AdminMfaChallenge({ onSubmit, onBack, submitting = false, error = null }: AdminMfaChallengeProps) {
  const [code, setCode] = useState("")
  const boxes = Array.from({ length: 6 }, (_, i) => ({
    ch: code[i] ?? "",
    filled: i < code.length,
    active: i === code.length && code.length < 6,
  }))

  return (
    <AdminAuthCard
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
        <label className="block">
          <span className="sr-only">6-digit code</span>
          <input
            value={code}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="6-digit code"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="sr-only"
          />
          <div className="my-1 mb-4 flex cursor-text justify-center gap-2.5">
            {boxes.map((b, i) => (
              <div
                key={i}
                className={`grid h-12 w-12 place-items-center rounded-md border bg-neutral-50 text-lg font-extrabold ${
                  b.active
                    ? "border-coral text-neutral-900 shadow-focus"
                    : b.filled
                      ? "border-neutral-200 text-neutral-900"
                      : "border-neutral-200 text-neutral-300"
                }`}
              >
                {b.ch || "·"}
              </div>
            ))}
          </div>
        </label>

        {error ? (
          <p role="alert" className="mb-3 text-center text-sm font-semibold text-status-danger">
            {error}
          </p>
        ) : null}

        <InkButton type="submit" disabled={submitting || code.length < 6} icon={<Icon.Check />}>
          {submitting ? "Verifying…" : "Verify"}
        </InkButton>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 w-full py-2 text-xs font-semibold text-neutral-500"
        >
          Back to sign-in
        </button>
      </form>
    </AdminAuthCard>
  )
}
