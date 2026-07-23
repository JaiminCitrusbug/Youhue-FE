/**
 * SC-024 — Post-check-in activity · 2-minute reset  ·  FR-05-01  ·  US-05-01
 * Presentational only. A guided calming reset — OPTIONAL and non-blocking; engagement is recorded.
 */
import { PhoneFrame, Icon } from '../components'

const PlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 4l14 8-14 8z" /></svg>
)

export interface PostCheckInActivityProps {
  studentName?: string
  onStart?: () => void
  onSkip?: () => void
}

export function PostCheckInActivity({ studentName = 'Aisha', onStart, onSkip }: PostCheckInActivityProps) {
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
    <PhoneFrame tabs={tabs}>
      <div className="flex items-center gap-3 pb-0.5 pt-1.5">
        <span className="w-[38px] shrink-0" aria-hidden />
        <div className="flex-1 text-center text-[12px] font-semibold text-neutral-500">You checked in ✓<b className="block text-[14px] font-bold text-neutral-900">Nice one, {studentName}</b></div>
        <span className="w-[38px] shrink-0" aria-hidden />
      </div>

      <div className="mt-3 rounded-2xl border border-neutral-200 bg-surface p-4 text-center">
        <div className="text-[12px] font-bold uppercase tracking-wide text-coral-700">A 2-minute reset</div>

        <div className="relative mx-auto my-4 grid h-[200px] w-[200px] place-items-center">
          <span className="absolute h-[200px] w-[200px] rounded-full border-2 border-coral-100" />
          <span className="absolute h-[150px] w-[150px] rounded-full border-2 border-coral-100" />
          <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-coral text-[15px] font-extrabold leading-tight text-white shadow-pop">Breathe<br />in…</div>
        </div>

        <div className="mt-1 flex justify-center gap-1.5">
          <span className="h-[7px] w-5 rounded bg-coral" />
          <span className="h-[7px] w-[7px] rounded-full bg-coral-100" />
          <span className="h-[7px] w-[7px] rounded-full bg-coral-100" />
          <span className="h-[7px] w-[7px] rounded-full bg-coral-100" />
        </div>

        <p className="mt-3.5 text-[13.5px] text-neutral-500">Follow the circle — in for 4, out for 4. A calm minute before class.</p>
      </div>

      <span className="mx-auto mt-3.5 flex w-fit items-center gap-1.5 rounded-pill bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
        <Icon.Clock className="h-3.5 w-3.5" />Optional · you can skip
      </span>

      <div className="mt-auto flex flex-col gap-2.5 pt-3">
        <button onClick={onStart} className="flex items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600">
          <PlayIcon className="h-[18px] w-[18px]" />Start the reset
        </button>
        <button onClick={onSkip} className="flex items-center justify-center gap-2 py-2 text-[13.5px] font-semibold text-coral-600">
          Skip for now <Icon.ChevronRight className="h-[16px] w-[16px]" />
        </button>
      </div>
    </PhoneFrame>
  )
}
