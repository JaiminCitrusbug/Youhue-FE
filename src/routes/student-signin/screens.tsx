import { useState } from "react"

import { StudentScreen } from "./frame"
import { Icon } from "./icons"

// SC-020 / SC-021 / SC-022 — the three approved student sign-in screens, componentized on the
// shared theme (Design-final-v3 "Ink & Coral"). Presentational + light local state; all wiring
// (sign-in POST, navigation) lives in the container (./index). Design classes are reproduced on
// the shared 4px spacing / theme token scale so the token-drift gate stays at 0 (no raw px/hex).

// ── SC-020 · Enter your class code ────────────────────────────────────────────
export interface SignInCodeProps {
  code: string
  onChange: (code: string) => void
  onContinue: () => void
  onScanQR: () => void
  school?: string
}

export function SignInCode({ code, onChange, onContinue, onScanQR, school = "Oakfield Primary" }: SignInCodeProps) {
  const boxes = Array.from({ length: 6 }, (_, i) => ({
    ch: code[i] ?? "·",
    filled: i < code.length,
    active: i === code.length && code.length < 6,
  }))

  return (
    <StudentScreen>
      <div className="flex items-center gap-2 pb-1 pt-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-coral">
          <Icon.Heart className="h-4 w-4 text-surface" />
        </span>
        <span className="text-sm font-extrabold text-neutral-900">
          Student check-in
          <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">{school}</span>
        </span>
      </div>

      <h2 className="mb-2 mt-4 text-3xl font-black leading-tight tracking-tightest">
        Enter your <span className="text-coral">class code</span>
      </h2>
      <p className="mb-4 text-sm text-neutral-500">Your teacher will show it on the board. No password needed.</p>

      <label className="block">
        <span className="sr-only">Class or school code</span>
        <input
          value={code}
          autoFocus
          inputMode="text"
          autoComplete="one-time-code"
          aria-label="Class or school code"
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 6))}
          className="peer sr-only"
        />
        <div className="my-2 flex cursor-text justify-center gap-2">
          {boxes.map((b, i) => (
            <div
              key={i}
              className={`grid h-14 w-10 place-items-center rounded-lg border bg-surface text-2xl font-extrabold ${
                b.active
                  ? "border-coral text-neutral-900 shadow-focus"
                  : b.filled
                    ? "border-neutral-200 text-neutral-900"
                    : "border-neutral-200 text-neutral-300"
              }`}
            >
              {b.ch}
            </div>
          ))}
        </div>
      </label>

      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-pill border border-neutral-200 bg-surface px-4 py-1.5 text-xs font-medium text-neutral-500">
        <Icon.Key className="h-4 w-4 text-coral" />
        Tap to type your code
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={code.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-coral py-3 text-md font-bold text-surface hover:bg-coral-600 disabled:opacity-50"
        >
          Continue <Icon.ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onScanQR}
          className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-coral-text"
        >
          <Icon.Qr className="h-4 w-4" />
          Scan a QR code instead
        </button>
      </div>

      <div className="flex justify-center gap-4 pt-2 text-xs font-medium text-neutral-400">
        <a href="/terms" className="text-neutral-400">Privacy</a>
        <a href="/terms" className="text-neutral-400">Help</a>
      </div>
    </StudentScreen>
  )
}

// ── SC-022 · Scan your class QR ───────────────────────────────────────────────
export interface SignInQRProps {
  onBack: () => void
  onTypeCode: () => void
}

export function SignInQR({ onBack, onTypeCode }: SignInQRProps) {
  return (
    <StudentScreen>
      <div className="flex items-center gap-2.5 pb-1 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600"
        >
          <Icon.ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-xs font-semibold text-neutral-500">
          Scan to sign in
          <b className="block text-base font-bold text-neutral-900">Scan your class QR</b>
        </div>
      </div>

      <div className="relative mx-auto my-4 grid h-56 w-56 place-items-center overflow-hidden rounded-2xl bg-neutral-900">
        <span className="absolute left-4 top-4 h-8 w-8 rounded-md border-4 border-b-0 border-r-0 border-surface" />
        <span className="absolute right-4 top-4 h-8 w-8 rounded-md border-4 border-b-0 border-l-0 border-surface" />
        <span className="absolute bottom-4 left-4 h-8 w-8 rounded-md border-4 border-r-0 border-t-0 border-surface" />
        <span className="absolute bottom-4 right-4 h-8 w-8 rounded-md border-4 border-l-0 border-t-0 border-surface" />
        <Icon.Qr className="h-28 w-28 text-surface opacity-90" />
        <span className="absolute left-5 right-5 top-1/2 h-0.5 bg-coral shadow-pop" />
      </div>

      <p className="mt-4 text-center text-sm text-neutral-500">
        Point at the QR code your teacher shows.
        <br />
        You can use this camera or your device&apos;s camera app.
      </p>

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        <button
          type="button"
          onClick={onTypeCode}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-surface py-3 text-base font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <Icon.Key className="h-4 w-4" />
          Type a code instead
        </button>
      </div>

      <div className="flex justify-center gap-4 pt-2 text-xs font-medium text-neutral-400">
        <a href="/terms" className="text-neutral-400">Privacy</a>
        <a href="/terms" className="text-neutral-400">Help</a>
      </div>
    </StudentScreen>
  )
}

// ── SC-021 · Who are you? (pick name/avatar) ──────────────────────────────────
export interface StudentEntry {
  id: string
  name: string
  initials: string
  tone: string
}

export interface SignInNameProps {
  onConfirm: (studentId: string) => void
  onBack: () => void
  roster?: StudentEntry[]
  className?: string
  submitting?: boolean
  error?: string | null
}

// A class-roster fetch endpoint is NOT in this ticket's BE contract (only the sign-in POST). Until
// a roster source exists (later ticket), the approved presentational roster stands in; each entry
// carries the id that is sent as `student_id`. Avatar tones are theme-bound utility pairs.
const DEFAULT_ROSTER: StudentEntry[] = [
  { id: "s-aisha", name: "Aisha K.", initials: "AK", tone: "bg-coral-50 text-coral-700" },
  { id: "s-liam", name: "Liam O.", initials: "LO", tone: "bg-status-okBg text-status-ok" },
  { id: "s-noah", name: "Noah P.", initials: "NP", tone: "bg-status-warnBg text-status-warn" },
  { id: "s-zara", name: "Zara M.", initials: "ZM", tone: "bg-ink-50 text-ink-700" },
  { id: "s-ethan", name: "Ethan R.", initials: "ER", tone: "bg-neutral-100 text-neutral-600" },
  { id: "s-priya", name: "Priya S.", initials: "PS", tone: "bg-coral-100 text-coral-600" },
]

export function SignInName({
  onConfirm,
  onBack,
  roster = DEFAULT_ROSTER,
  className = "Year 5 — Maple",
  submitting = false,
  error = null,
}: SignInNameProps) {
  const [selected, setSelected] = useState(0)

  function readAloud() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      roster.forEach((s) => window.speechSynthesis.speak(new SpeechSynthesisUtterance(s.name)))
    }
  }

  return (
    <StudentScreen>
      <div className="flex items-center gap-2.5 pb-1 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600"
        >
          <Icon.ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-xs font-semibold text-neutral-500">
          Tap your name
          <b className="block text-base font-bold text-neutral-900">Who are you?</b>
        </div>
      </div>

      <div className="mb-4 mt-3 flex w-fit items-center gap-2 rounded-pill bg-coral-50 px-3 py-1.5 text-xs font-bold text-coral-700">
        <Icon.Users className="h-4 w-4" />
        {className}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {roster.map((s, i) => {
          const on = selected === i
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={on}
              className={`rounded-2xl border px-2 py-3 text-center ${
                on ? "border-coral bg-coral-50" : "border-neutral-200 bg-surface hover:border-coral-100"
              }`}
            >
              <span className={`mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full text-lg font-extrabold ${s.tone}`}>
                {s.initials}
              </span>
              <b className="text-sm font-bold">{s.name}</b>
            </button>
          )
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-center text-sm font-semibold text-status-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2.5 pt-3">
        <button
          type="button"
          onClick={() => onConfirm(roster[selected].id)}
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-xl bg-coral py-3 text-md font-bold text-surface hover:bg-coral-600 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "That's me"} <Icon.ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={readAloud}
          className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-coral-text"
        >
          <Icon.Sound className="h-4 w-4" />
          Read names aloud
        </button>
      </div>
    </StudentScreen>
  )
}
