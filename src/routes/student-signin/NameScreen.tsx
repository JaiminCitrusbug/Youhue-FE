import { useState } from "react"

import { Icon } from "@design/components"

/**
 * SC-021 — Student sign-in · pick your name (FR-01-02 · US-01-02).
 *
 * COMPOSED from the approved primitives (`@design/components`), mirroring the structure, copy and
 * classes of `design/approved/screens/StudentSignInName.tsx` EXACTLY — minus the preview-only
 * `PhoneFrame` bezel (the surface is full-bleed, owned by ./index). Every px/size is the approved
 * design's own value, copied verbatim (do-not-restyle); the deltas are behavioural only: the
 * `student_id` each name carries, the selection, read-aloud and a real `disabled` while signing in.
 */

const HEAD_ROW = "flex items-center gap-2.5 pb-0.5 pt-1.5"
const BACK_BTN = "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600" // token-ok: approved Design-final-v3 value (do-not-restyle)
const BACK_ICON = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_KICKER = "text-[12px] font-semibold text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_TITLE = "block text-[14px] font-bold text-neutral-900" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CLASS_CHIP = "mb-3.5 mt-3 flex w-fit items-center gap-1.5 rounded-pill bg-coral-50 px-3 py-1.5 text-[12px] font-bold text-coral-700" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CLASS_CHIP_ICON = "h-3.5 w-3.5"
const GRID = "grid grid-cols-2 gap-2.5"
const CARD = "rounded-2xl border-[1.5px] px-2.5 py-3.5 text-center transition" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_ON = "border-coral bg-coral-50"
const CARD_OFF = "border-neutral-200 bg-surface hover:border-coral-100"
const AVATAR = "mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-full text-[18px] font-extrabold" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_NAME = "text-[13.5px] font-bold" // token-ok: approved Design-final-v3 value (do-not-restyle)
const ACTIONS = "mt-auto flex flex-col gap-2.5 pt-3"
const PRIMARY = "flex items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600 disabled:opacity-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const PRIMARY_ICON = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SECONDARY = "flex items-center justify-center gap-2 py-2 text-[13.5px] font-semibold text-coral-600" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SECONDARY_ICON = "h-[16px] w-[16px]" // token-ok: approved Design-final-v3 value (do-not-restyle)

export interface RosterEntry {
  id: string
  name: string
  initials: string
  tone: string
}

export interface NameScreenProps {
  onConfirm: (studentId: string) => void
  onBack: () => void
  roster?: RosterEntry[]
  classLabel?: string
  submitting?: boolean
}

// A class-roster fetch endpoint is NOT in this ticket's BE contract (only the sign-in POST). Until
// a roster source exists (later ticket), the APPROVED roster stands in — names and avatar tones
// verbatim from the approved screen (theme-bound utility pairs, no raw hex); each entry only gains
// the id that is sent as `student_id`.
const DEFAULT_ROSTER: RosterEntry[] = [
  { id: "s-aisha", name: "Aisha K.", initials: "AK", tone: "bg-coral-50 text-coral-700" },
  { id: "s-liam", name: "Liam O.", initials: "LO", tone: "bg-status-okBg text-status-ok" },
  { id: "s-noah", name: "Noah P.", initials: "NP", tone: "bg-status-warnBg text-status-warn" },
  { id: "s-zara", name: "Zara M.", initials: "ZM", tone: "bg-ink-50 text-ink-700" },
  { id: "s-ethan", name: "Ethan R.", initials: "ER", tone: "bg-neutral-100 text-neutral-600" },
  { id: "s-priya", name: "Priya S.", initials: "PS", tone: "bg-coral-100 text-coral-600" },
]

export function NameScreen({
  onConfirm,
  onBack,
  roster = DEFAULT_ROSTER,
  classLabel = "Year 5 — Maple",
  submitting = false,
}: NameScreenProps) {
  const [selected, setSelected] = useState(0)

  function readAloud() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      roster.forEach((s) => window.speechSynthesis.speak(new SpeechSynthesisUtterance(s.name)))
    }
  }

  return (
    <>
      <div className={HEAD_ROW}>
        <button type="button" onClick={onBack} aria-label="Back" className={BACK_BTN}>
          <Icon.ArrowLeft className={BACK_ICON} />
        </button>
        <div className={HEAD_KICKER}>
          Tap your name
          <b className={HEAD_TITLE}>Who are you?</b>
        </div>
      </div>

      <div className={CLASS_CHIP}>
        <Icon.Users className={CLASS_CHIP_ICON} />
        {classLabel}
      </div>

      <div className={GRID}>
        {roster.map((s, i) => {
          const on = selected === i
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={on}
              className={`${CARD} ${on ? CARD_ON : CARD_OFF}`}
            >
              <span className={`${AVATAR} ${s.tone}`}>{s.initials}</span>
              <b className={CARD_NAME}>{s.name}</b>
            </button>
          )
        })}
      </div>

      <div className={ACTIONS}>
        <button
          type="button"
          onClick={() => onConfirm(roster[selected].id)}
          disabled={submitting}
          className={PRIMARY}
        >
          That&apos;s me <Icon.ArrowRight className={PRIMARY_ICON} />
        </button>
        <button type="button" onClick={readAloud} className={SECONDARY}>
          <Icon.Sound className={SECONDARY_ICON} />
          Read names aloud
        </button>
      </div>
    </>
  )
}
