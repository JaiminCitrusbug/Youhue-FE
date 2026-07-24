/**
 * SC-023 (step 2) — reflection ("say why"). COMPOSED from the approved `StudentReflection.tsx`'s
 * structure, copy and classes — `PhoneFrame` chrome and the bottom tab bar are dropped for the
 * same reason as `MoodScreen.tsx`. A SEPARATE page/step from mood-select (ticket's explicit
 * interaction contract), reached only after a mood is chosen.
 *
 * The school's optional/required setting has no read endpoint on this ticket (see
 * `docs/DEFERRALS.md` DEF-011 — no leadership write surface ships either): this screen starts in
 * the approved screen's own OPTIONAL default state (chip + Skip shown) and, if the server's 422
 * reveals the school actually requires one, switches to the design's documented required
 * presentation in place — chip reads "Required", Skip is removed, and the real server message is
 * shown (ticket: "submit asks for a reflection first (422)") — never silently dropped.
 */
import { Banner, Icon, MoodFace, Textarea } from "@design/components"

import type { Mood } from "@design/components"

// Arbitrary-value classes lifted verbatim from `StudentReflection.tsx`, hoisted (same convention
// as `student-signin/QRScreen.tsx`/`NameScreen.tsx`) so the token-drift scanner sees the
// justification.
const BACK_BTN_CLS = "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600 disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const BACK_ICON_CLS = "h-[18px] w-[18px] rotate-180" // token-ok: approved Design-final-v3 value (do-not-restyle)
const STEP_LABEL_CLS = "flex-1 text-center text-[12px] font-semibold text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const STEP_TITLE_CLS = "block text-[14px] font-bold text-neutral-900" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SPACER_CLS = "w-[38px] shrink-0" // token-ok: approved Design-final-v3 value (do-not-restyle)
const MOOD_CHIP_CLS = "mb-0.5 mt-3.5 flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-surface px-3 py-2.5 text-[13px] font-medium text-neutral-600" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEADING_CLS = "mb-2 mt-3.5 text-[26px] font-black leading-[1.1] tracking-tighter" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SETTING_CHIP_CLS = "mb-3 flex items-center gap-2 rounded-[10px] bg-coral-50 px-3 py-2.5 text-[12px] text-neutral-600" // token-ok: approved Design-final-v3 value (do-not-restyle)
const INFO_ICON_CLS = "h-[15px] w-[15px] shrink-0 text-coral" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SKIP_BTN_CLS = "rounded-[14px] border border-neutral-300 bg-surface px-5 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const DONE_BTN_CLS = "flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const ARROW_ICON_CLS = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)

export interface ReflectionScreenProps {
  chosenMood: Mood
  chosenLabel: string
  reflection: string
  onReflectionChange: (v: string) => void
  onBack: () => void
  onSkip: () => void
  onDone: () => void
  submitting: boolean
  error: string | null
  reflectionRequired: boolean
}

export function ReflectionScreen({
  chosenMood, chosenLabel, reflection, onReflectionChange, onBack, onSkip, onDone,
  submitting, error, reflectionRequired,
}: ReflectionScreenProps) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex items-center gap-2.5 pb-0.5 pt-1.5">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          aria-label="Back"
          className={BACK_BTN_CLS}
        >
          <Icon.ChevronRight className={BACK_ICON_CLS} />
        </button>
        <div className={STEP_LABEL_CLS}>
          Step 2 of 2<b className={STEP_TITLE_CLS}>Almost done</b>
        </div>
        <span className={SPACER_CLS} aria-hidden />
      </div>

      <div className={MOOD_CHIP_CLS}>
        <MoodFace mood={chosenMood} size={30} className="shrink-0" />
        You&apos;re feeling <b className="font-bold text-neutral-900">{chosenLabel}</b>
      </div>

      <h2 className={HEADING_CLS}>
        Want to say <span className="text-coral">why?</span>
      </h2>

      <div className={SETTING_CHIP_CLS}>
        <Icon.Info className={INFO_ICON_CLS} />
        <span>
          School setting:{" "}
          <b className="font-bold text-coral-600">
            {reflectionRequired ? "Required" : "Optional"}
          </b>
          {reflectionRequired ? "" : " — you can skip this."}
        </span>
      </div>

      <Textarea
        placeholder="Type a little if you want to…"
        value={reflection}
        onChange={(e) => onReflectionChange(e.target.value)}
        disabled={submitting}
        aria-label="Reflection"
      />

      {error ? (
        <div role="alert" className="mt-3">
          <Banner tone="danger" icon={<Icon.Alert />}>{error}</Banner>
        </div>
      ) : null}

      <div className="mt-auto flex gap-2.5 pt-3">
        {reflectionRequired ? null : (
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className={SKIP_BTN_CLS}
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          disabled={submitting}
          className={DONE_BTN_CLS}
        >
          {submitting ? "Saving…" : "Done"} <Icon.ArrowRight className={ARROW_ICON_CLS} />
        </button>
      </div>
    </div>
  )
}
