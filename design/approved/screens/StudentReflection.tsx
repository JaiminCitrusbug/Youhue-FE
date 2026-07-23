/**
 * SC-023 (step 2) — Reflection · "say why"  ·  FR-04-02  ·  US-04-01
 * Presentational only. A SEPARATE page after the mood pick (SC-023 step 1).
 * The "say why" step is school-configured optional or required; this is the OPTIONAL default state.
 */
import { PhoneFrame, MoodFace, Textarea, Icon } from '../components'

const BackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
const InfoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx={12} cy={12} r={9} /><path d="M12 11v5M12 8h.01" />
  </svg>
)

export interface StudentReflectionProps {
  chosenMood?: 'great' | 'good' | 'ok' | 'worried' | 'sad' | 'angry'
  chosenLabel?: string
  onBack?: () => void
  onSkip?: () => void
  onDone?: () => void
}

export function StudentReflection({ chosenMood = 'good', chosenLabel = 'Good', onBack, onSkip, onDone }: StudentReflectionProps) {
  const tabs = (
    <>
      <a className="flex flex-1 flex-col items-center gap-0.5 text-[10.5px] font-semibold text-neutral-400"><Icon.Grid className="h-5 w-5" />Home</a>
      <a className="-mt-4 flex flex-1 flex-col items-center gap-0.5 text-[10.5px] font-semibold text-coral">
        <span className="grid h-[44px] w-[44px] place-items-center rounded-full border-4 border-white bg-coral text-white shadow-pop"><Icon.Heart className="h-5 w-5" /></span>
        Check-in
      </a>
      <a className="flex flex-1 flex-col items-center gap-0.5 text-[10.5px] font-semibold text-neutral-400"><Icon.Clock className="h-5 w-5" />History</a>
    </>
  )

  return (
    <div className="flex flex-col items-center">
      <PhoneFrame tabs={tabs}>
        <div className="flex items-center gap-2.5 pb-0.5 pt-1.5">
          <button onClick={onBack} className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600">
            <BackIcon className="h-[18px] w-[18px]" />
          </button>
          <div className="flex-1 text-center text-[12px] font-semibold text-neutral-500">Step 2 of 2<b className="block text-[14px] font-bold text-neutral-900">Almost done</b></div>
          <span className="w-[38px] shrink-0" aria-hidden />
        </div>

        <div className="mb-0.5 mt-3.5 flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-surface px-3 py-2.5 text-[13px] font-medium text-neutral-600">
          <MoodFace mood={chosenMood} size={30} className="shrink-0" />
          You&apos;re feeling <b className="font-bold text-neutral-900">{chosenLabel}</b>
        </div>

        <h2 className="mb-2 mt-3.5 text-[26px] font-black leading-[1.1] tracking-tighter">Want to say <span className="text-coral">why?</span></h2>

        <div className="mb-3 flex items-center gap-2 rounded-[10px] bg-coral-50 px-3 py-2.5 text-[12px] text-neutral-600">
          <InfoIcon className="h-[15px] w-[15px] shrink-0 text-coral" />
          <span>School setting: <b className="font-bold text-coral-600">Optional</b> — you can skip this.</span>
        </div>

        <Textarea placeholder="Type a little if you want to…" />

        <div className="mt-auto flex gap-2.5 pt-3">
          <button onClick={onSkip} className="rounded-[14px] border border-neutral-300 bg-surface px-5 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-50">Skip</button>
          <button onClick={onDone} className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600">
            Done <Icon.ArrowRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </PhoneFrame>

      <p className="mx-auto mt-2.5 max-w-[300px] text-center text-[11px] leading-relaxed text-neutral-500">
        If the school makes reflection <b className="font-semibold text-neutral-700">required</b>, the chip reads &ldquo;Required&rdquo;, <b className="font-semibold text-neutral-700">Skip</b> is removed, and submitting empty shows &ldquo;Please add a short reflection.&rdquo;
      </p>
    </div>
  )
}
