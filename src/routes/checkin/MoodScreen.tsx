/**
 * SC-023 (step 1) — mood select. COMPOSED from the approved `StudentCheckIn.tsx`'s structure,
 * copy and classes (heading, subtext, the 3-col face grid, the footnote, the Continue button) —
 * the `PhoneFrame` device-bezel chrome and the decorative bottom tab bar (`href="#"` dead links,
 * not wired to anything real) are DROPPED, not reused: this mounts inside the real `StudentShell`
 * app frame (its own working header + sign-out), and the CLAUDE.md caution against shipping
 * bezel/dead-link chrome into production applies here exactly as it did for student sign-in.
 *
 * Divergence from the approved screen (LOGGED, not silently reconciled): the greeting block
 * ("Hi, {studentName}") is DROPPED — no student display name is available anywhere on the FE
 * today (`/me` returns `subject_id/kind/school_id/role` only; the sign-in response carries only
 * `student_id`/`age_band`). Inventing a name would violate "use real content, never fabricate";
 * a future ticket that exposes a display name to the student session could restore it.
 * The `onBack` chevron is also dropped: this is the student's landing page, there is no natural
 * back target, and a wired-nowhere button would be a dead control.
 */
import type { Mood } from "@design/components"
import { Banner, Icon, MoodFace } from "@design/components"

import { MOOD_ORDER } from "./moods"

// Arbitrary-value classes lifted verbatim from `StudentCheckIn.tsx`, hoisted (same convention as
// `student-signin/QRScreen.tsx`/`NameScreen.tsx`) so the token-drift scanner sees the justification.
const HEADING_CLS = "mb-1 mt-2 text-[30px] font-black leading-[1.1] tracking-tighter" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SUBTEXT_CLS = "mb-4 text-[13.5px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const LOADING_CLS = "text-[13px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_ON_CLS = "rounded-lg border-[1.5px] px-1.5 pb-2.5 pt-3 text-center transition border-coral bg-coral-50 shadow-focus" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_OFF_CLS = "rounded-lg border-[1.5px] px-1.5 pb-2.5 pt-3 text-center transition border-neutral-200 hover:border-coral-100" // token-ok: approved Design-final-v3 value (do-not-restyle)
const LABEL_ON_CLS = "mt-1.5 text-[12.5px] font-semibold text-coral-700" // token-ok: approved Design-final-v3 value (do-not-restyle)
const LABEL_OFF_CLS = "mt-1.5 text-[12.5px] font-semibold text-neutral-700" // token-ok: approved Design-final-v3 value (do-not-restyle)
const FOOTNOTE_CLS = "mb-3 flex items-center gap-2 text-[11.5px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CONTINUE_BTN_CLS = "flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const ARROW_ICON_CLS = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)

export interface MoodScreenProps {
  loading: boolean
  error: string | null
  allowedValues: number[]
  selected: number | null
  onSelect: (value: number) => void
  onContinue: () => void
}

export function MoodScreen({
  loading, error, allowedValues, selected, onSelect, onContinue,
}: MoodScreenProps) {
  const options = MOOD_ORDER.filter((m) => allowedValues.includes(m.value))

  return (
    <div className="flex min-h-[70vh] flex-col">
      <h2 className={HEADING_CLS}>
        How are you <span className="text-coral">feeling</span> today?
      </h2>
      <p className={SUBTEXT_CLS}>
        Tap the face that fits. There&apos;s no wrong answer.
      </p>

      {error ? (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>{error}</Banner>
        </div>
      ) : null}

      {loading ? (
        <p className={LOADING_CLS}>Loading…</p>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2.5">
          {options.map(({ mood, label, value }) => {
            const on = selected === value
            return (
              <button
                key={mood}
                type="button"
                onClick={() => onSelect(value)}
                aria-pressed={on}
                className={on ? CARD_ON_CLS : CARD_OFF_CLS}
              >
                <MoodFace mood={mood as Mood} size={46} className="mx-auto block" />
                <div className={on ? LABEL_ON_CLS : LABEL_OFF_CLS}>
                  {label}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className={FOOTNOTE_CLS}>
        <Icon.Heart className="h-3.5 w-3.5 shrink-0 text-coral" />
        Younger pupils see fewer faces and hear each one read aloud.
      </div>

      <div className="mt-auto flex gap-2.5 pt-1.5">
        <button
          type="button"
          onClick={onContinue}
          disabled={selected === null}
          className={CONTINUE_BTN_CLS}
        >
          Continue <Icon.ArrowRight className={ARROW_ICON_CLS} />
        </button>
      </div>
    </div>
  )
}
