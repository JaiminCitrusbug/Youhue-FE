import { Link } from "react-router-dom"

import { Icon } from "@design/components"

/**
 * SC-020 — Student sign-in · class code (FR-01-02 · US-01-02).
 *
 * COMPOSED from the approved primitives (`@design/components`), mirroring the structure, copy and
 * classes of `design/approved/screens/StudentSignInCode.tsx` EXACTLY. The approved screen is a
 * static PREVIEW: its `PhoneFrame` device bezel is preview-board chrome, its footer links are
 * `href="#"` dead controls and its boxes are fixtures — none of that ships. The student app is a
 * mobile PWA, so the surface is FULL-BLEED (owned by ./index) and every control is real.
 *
 * Every px/size below is the approved design's OWN value, copied verbatim (do-not-restyle) — the
 * `token-ok` marks say so; nothing here is re-skinned onto different values and nothing is invented.
 */

const HEAD_ROW = "flex items-center gap-2.5 pb-0.5 pt-1.5"
const HEAD_MARK = "grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-coral" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_MARK_ICON = "h-[17px] w-[17px] text-white" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_TITLE = "text-[13.5px] font-extrabold text-neutral-900" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_SCHOOL = "block text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HERO = "mb-1.5 mt-[18px] text-[29px] font-black leading-[1.1] tracking-tightest" // token-ok: approved Design-final-v3 value (do-not-restyle)
const LEAD = "mb-4 text-[13.5px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const BOX_ROW = "my-2 flex cursor-text justify-center gap-2.5"
const BOX = "grid h-[54px] w-[42px] place-items-center rounded-xl border-[1.5px] bg-surface text-2xl font-extrabold" // token-ok: approved Design-final-v3 value (do-not-restyle)
const BOX_ON = "border-coral text-neutral-900 shadow-focus"
const BOX_EMPTY = "border-neutral-200 text-neutral-300"
const BOX_FILLED = "border-neutral-200 text-neutral-900"
const HINT =
  "mx-auto mt-3 flex w-fit cursor-text items-center gap-1.5 rounded-pill border border-neutral-200 bg-surface px-3.5 py-1.5 text-[12px] font-medium text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HINT_ICON = "h-3.5 w-3.5 text-coral"
const ACTIONS = "mt-auto flex flex-col gap-2.5 pt-2"
const PRIMARY =
  "flex items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600 disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const ACTION_ICON = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SECONDARY = "flex items-center justify-center gap-2 py-2 text-[13.5px] font-semibold text-coral-600" // token-ok: approved Design-final-v3 value (do-not-restyle)
const FOOT = "flex justify-center gap-3.5 pt-2 text-[11px] font-medium text-neutral-400" // token-ok: approved Design-final-v3 value (do-not-restyle)

/**
 * Keyboard glyph — copied verbatim from the approved screen (the shared `Icon` set has no keyboard;
 * the approved screens declare this one locally). Geometry + `currentColor` only, no style values.
 */
export function KeyboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x={3} y={6} width={18} height={12} rx={2} />
      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </svg>
  )
}

export interface CodeScreenProps {
  code: string
  onChange: (code: string) => void
  onContinue: () => void
  onScanQR: () => void
  school?: string
}

const CODE_LENGTH = 6

export function CodeScreen({ code, onChange, onContinue, onScanQR, school = "Oakfield Primary" }: CodeScreenProps) {
  const boxes = Array.from({ length: CODE_LENGTH }, (_, i) => ({
    ch: code[i] ?? "·",
    on: i === code.length && code.length < CODE_LENGTH,
    filled: i < code.length,
  }))

  return (
    <>
      <div className={HEAD_ROW}>
        <span className={HEAD_MARK}>
          <Icon.Heart className={HEAD_MARK_ICON} />
        </span>
        <span className={HEAD_TITLE}>
          Student check-in
          <span className={HEAD_SCHOOL}>{school}</span>
        </span>
      </div>

      <h2 className={HERO}>
        Enter your <span className="text-coral">class code</span>
      </h2>
      <p className={LEAD}>Your teacher will show it on the board. No password needed.</p>

      {/* The approved screen shows the boxes + a "Tap to type your code" affordance but has no
          field. The label wraps both so tapping either natively focuses the visually hidden input. */}
      <label className="block">
        <input
          value={code}
          autoFocus
          inputMode="text"
          autoComplete="one-time-code"
          aria-label="Class or school code"
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, CODE_LENGTH))}
          className="sr-only"
        />
        <div className={BOX_ROW}>
          {boxes.map((b, i) => (
            <div key={i} className={`${BOX} ${b.on ? BOX_ON : b.filled ? BOX_FILLED : BOX_EMPTY}`}>
              {b.ch}
            </div>
          ))}
        </div>
        <div className={HINT}>
          <KeyboardIcon className={HINT_ICON} />
          Tap to type your code
        </div>
      </label>

      <div className={ACTIONS}>
        <button type="button" onClick={onContinue} disabled={code.length === 0} className={PRIMARY}>
          Continue <Icon.ArrowRight className={ACTION_ICON} />
        </button>
        <button type="button" onClick={onScanQR} className={SECONDARY}>
          <Icon.Qr className={ACTION_ICON} />
          Scan a QR code instead
        </button>
      </div>

      {/* Real routed links — the approved preview's `href="#"` placeholders never ship. */}
      <div className={FOOT}>
        <Link to="/terms" className="text-neutral-400">
          Privacy
        </Link>
        <Link to="/terms" className="text-neutral-400">
          Help
        </Link>
      </div>
    </>
  )
}
