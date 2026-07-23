/**
 * SC-020 — Student sign-in · class code  ·  FR-01-02  ·  US-01-02
 * Presentational only. Passwordless entry: type the class code the teacher shows.
 * A wrong code shows "That code didn't work — ask your teacher." (state built separately).
 */
import { PhoneFrame, Icon } from '../components'

const KeyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x={3} y={6} width={18} height={12} rx={2} /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
  </svg>
)
const QrIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3M20 14v6M14 20h3" />
  </svg>
)

interface CodeBox { ch: string; on?: boolean; empty?: boolean }

export interface StudentSignInCodeProps {
  school?: string
  boxes?: CodeBox[]
  onContinue?: () => void
  onScanQR?: () => void
}

const DEFAULT_BOXES: CodeBox[] = [
  { ch: 'M' }, { ch: 'A' }, { ch: 'P', on: true },
  { ch: '·', empty: true }, { ch: '·', empty: true }, { ch: '·', empty: true },
]

export function StudentSignInCode({ school = 'Oakfield Primary', boxes = DEFAULT_BOXES, onContinue, onScanQR }: StudentSignInCodeProps) {
  return (
    <PhoneFrame>
      <div className="flex items-center gap-2.5 pb-0.5 pt-1.5">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-coral">
          <Icon.Heart className="h-[17px] w-[17px] text-white" />
        </span>
        <span className="text-[13.5px] font-extrabold text-neutral-900">Student check-in<span className="block text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">{school}</span></span>
      </div>

      <h2 className="mb-1.5 mt-[18px] text-[29px] font-black leading-[1.1] tracking-tightest">Enter your <span className="text-coral">class code</span></h2>
      <p className="mb-4 text-[13.5px] text-neutral-500">Your teacher will show it on the board. No password needed.</p>

      <div className="my-2 flex justify-center gap-2.5">
        {boxes.map((b, i) => (
          <div key={i}
            className={`grid h-[54px] w-[42px] place-items-center rounded-xl border-[1.5px] bg-surface text-2xl font-extrabold ${b.on ? 'border-coral text-neutral-900 shadow-focus' : b.empty ? 'border-neutral-200 text-neutral-300' : 'border-neutral-200 text-neutral-900'}`}>
            {b.ch}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-pill border border-neutral-200 bg-surface px-3.5 py-1.5 text-[12px] font-medium text-neutral-500">
        <KeyIcon className="h-3.5 w-3.5 text-coral" />Tap to type your code
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        <button onClick={onContinue} className="flex items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600">
          Continue <Icon.ArrowRight className="h-[18px] w-[18px]" />
        </button>
        <button onClick={onScanQR} className="flex items-center justify-center gap-2 py-2 text-[13.5px] font-semibold text-coral-600">
          <QrIcon className="h-[18px] w-[18px]" />Scan a QR code instead
        </button>
      </div>

      <div className="flex justify-center gap-3.5 pt-2 text-[11px] font-medium text-neutral-400">
        <a href="#" className="text-neutral-400">Privacy</a>
        <a href="#" className="text-neutral-400">Help</a>
      </div>
    </PhoneFrame>
  )
}
