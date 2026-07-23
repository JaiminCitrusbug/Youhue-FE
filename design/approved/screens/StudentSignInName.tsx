/**
 * SC-021 — Student sign-in · pick your name  ·  FR-01-02  ·  US-01-02
 * Presentational only. Big tap targets + read-aloud for non-readers; scoped to the class.
 */
import { PhoneFrame, Icon } from '../components'

const BackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
const SoundIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 5L6 9H3v6h3l5 4zM16 9a3 3 0 0 1 0 6M19 6a7 7 0 0 1 0 12" />
  </svg>
)

export interface StudentName { name: string; initials: string; tone: string }

export interface StudentSignInNameProps {
  className?: string
  names?: StudentName[]
  selected?: number
  onSelect?: (i: number) => void
  onConfirm?: () => void
  onReadAloud?: () => void
  onBack?: () => void
}

// avatar tones are theme-bound utility pairs (no raw hex) for friendly per-child colour
const DEFAULT_NAMES: StudentName[] = [
  { name: 'Aisha K.', initials: 'AK', tone: 'bg-coral-50 text-coral-700' },
  { name: 'Liam O.', initials: 'LO', tone: 'bg-status-okBg text-status-ok' },
  { name: 'Noah P.', initials: 'NP', tone: 'bg-status-warnBg text-status-warn' },
  { name: 'Zara M.', initials: 'ZM', tone: 'bg-ink-50 text-ink-700' },
  { name: 'Ethan R.', initials: 'ER', tone: 'bg-neutral-100 text-neutral-600' },
  { name: 'Priya S.', initials: 'PS', tone: 'bg-coral-100 text-coral-600' },
]

export function StudentSignInName({ className = 'Year 5 — Maple', names = DEFAULT_NAMES, selected = 0, onSelect, onConfirm, onReadAloud, onBack }: StudentSignInNameProps) {
  return (
    <PhoneFrame>
      <div className="flex items-center gap-2.5 pb-0.5 pt-1.5">
        <button onClick={onBack} className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600">
          <BackIcon className="h-[18px] w-[18px]" />
        </button>
        <div className="text-[12px] font-semibold text-neutral-500">Tap your name<b className="block text-[14px] font-bold text-neutral-900">Who are you?</b></div>
      </div>

      <div className="mb-3.5 mt-3 flex w-fit items-center gap-1.5 rounded-pill bg-coral-50 px-3 py-1.5 text-[12px] font-bold text-coral-700">
        <Icon.Users className="h-3.5 w-3.5" />{className}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {names.map((s, i) => {
          const on = selected === i
          return (
            <button key={s.name} onClick={() => onSelect?.(i)}
              className={`rounded-2xl border-[1.5px] px-2.5 py-3.5 text-center transition ${on ? 'border-coral bg-coral-50' : 'border-neutral-200 bg-surface hover:border-coral-100'}`}>
              <span className={`mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-full text-[18px] font-extrabold ${s.tone}`}>{s.initials}</span>
              <b className="text-[13.5px] font-bold">{s.name}</b>
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-3">
        <button onClick={onConfirm} className="flex items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600">
          That&apos;s me <Icon.ArrowRight className="h-[18px] w-[18px]" />
        </button>
        <button onClick={onReadAloud} className="flex items-center justify-center gap-2 py-2 text-[13.5px] font-semibold text-coral-600">
          <SoundIcon className="h-[16px] w-[16px]" />Read names aloud
        </button>
      </div>
    </PhoneFrame>
  )
}
