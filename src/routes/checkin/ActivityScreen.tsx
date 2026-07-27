/**
 * SC-024 — post-check-in activity ("a 2-minute reset"). COMPOSED from the approved
 * `PostCheckInActivity.tsx`'s structure, copy and classes (the "2-minute reset" card, breathing
 * visual, progress dots, "Optional · you can skip" chip, Start/Skip buttons) — the `PhoneFrame`
 * device-bezel chrome and the decorative bottom tab bar are DROPPED, not reused, same reason as
 * `MoodScreen.tsx`/`ReflectionScreen.tsx`: this mounts inside the real check-in flow's own
 * confirmation step, not a standalone device preview. The approved screen's inline custom
 * `PlayIcon` SVG is replaced with the barrel's own `Icon.Play` (an identical single-path glyph) —
 * no need to hand-roll one when the shared icon set already has it.
 *
 * Scope note (ticket "make no product decision" — the approved screen defines Start/Skip only, no
 * separate "mark complete" affordance): tapping "Start the reset" records `status: started`
 * (Scenario 3 — "start OR complete... is recorded") and hands off to the check-in's own closure
 * screen; it does not fabricate a `completed` call the design gives no interaction to reach.
 * Skipping is the absence of a call, not a verb this screen sends (Scenario 2).
 *
 * The seed `Activity` model (`src/domain/checkin/models.py`) carries only `title`/`type`/`age_band`
 * — no per-type instructional copy exists anywhere (design or data). The approved screen's
 * breathing-specific visual + instructional body text ("Follow the circle — in for 4, out for
 * 4...") is real approved content, kept VERBATIM rather than fabricated per-type variants for
 * grounding/stretch/brain_break; the real offered activity's `title` replaces the static "A
 * 2-minute reset" eyebrow label instead, so the student sees which actual activity was offered
 * without inventing copy the design/data don't provide.
 */
import { Icon } from "@design/components"

const CARD_CLS = "mt-3 rounded-2xl border border-neutral-200 bg-surface p-4 text-center" // token-ok: approved Design-final-v3 value (do-not-restyle)
const EYEBROW_CLS = "text-[12px] font-bold uppercase tracking-wide text-coral-700" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CIRCLE_OUTER_CLS = "relative mx-auto my-4 grid h-[200px] w-[200px] place-items-center" // token-ok: approved Design-final-v3 value (do-not-restyle)
const RING_OUTER_CLS = "absolute h-[200px] w-[200px] rounded-full border-2 border-coral-100" // token-ok: approved Design-final-v3 value (do-not-restyle)
const RING_INNER_CLS = "absolute h-[150px] w-[150px] rounded-full border-2 border-coral-100" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CIRCLE_CLS = "grid h-[104px] w-[104px] place-items-center rounded-full bg-coral text-[15px] font-extrabold leading-tight text-white shadow-pop" // token-ok: approved Design-final-v3 value (do-not-restyle)
const DOT_ACTIVE_CLS = "h-[7px] w-5 rounded bg-coral" // token-ok: approved Design-final-v3 value (do-not-restyle)
const DOT_CLS = "h-[7px] w-[7px] rounded-full bg-coral-100" // token-ok: approved Design-final-v3 value (do-not-restyle)
const BODY_CLS = "mt-3.5 text-[13.5px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CHIP_CLS = "mx-auto mt-3.5 flex w-fit items-center gap-1.5 rounded-pill bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const START_BTN_CLS = "flex items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SKIP_BTN_CLS = "flex items-center justify-center gap-2 py-2 text-[13.5px] font-semibold text-coral-600 disabled:cursor-not-allowed disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const PLAY_ICON_CLS = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CHEVRON_ICON_CLS = "h-[16px] w-[16px]" // token-ok: approved Design-final-v3 value (do-not-restyle)

export interface ActivityScreenProps {
  activityTitle: string
  starting: boolean
  onStart: () => void
  onSkip: () => void
}

export function ActivityScreen({ activityTitle, starting, onStart, onSkip }: ActivityScreenProps) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className={CARD_CLS}>
        <div className={EYEBROW_CLS}>{activityTitle}</div>

        <div className={CIRCLE_OUTER_CLS}>
          <span className={RING_OUTER_CLS} />
          <span className={RING_INNER_CLS} />
          <div className={CIRCLE_CLS}>
            Breathe
            <br />
            in…
          </div>
        </div>

        <div className="mt-1 flex justify-center gap-1.5">
          <span className={DOT_ACTIVE_CLS} />
          <span className={DOT_CLS} />
          <span className={DOT_CLS} />
          <span className={DOT_CLS} />
        </div>

        <p className={BODY_CLS}>Follow the circle — in for 4, out for 4. A calm minute before class.</p>
      </div>

      <span className={CHIP_CLS}>
        <Icon.Clock className="h-3.5 w-3.5" />
        Optional · you can skip
      </span>

      <div className="mt-auto flex flex-col gap-2.5 pt-3">
        <button type="button" onClick={onStart} disabled={starting} className={START_BTN_CLS}>
          <Icon.Play className={PLAY_ICON_CLS} />
          Start the reset
        </button>
        <button type="button" onClick={onSkip} disabled={starting} className={SKIP_BTN_CLS}>
          Skip for now <Icon.ChevronRight className={CHEVRON_ICON_CLS} />
        </button>
      </div>
    </div>
  )
}
