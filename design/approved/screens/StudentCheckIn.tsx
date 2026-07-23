/**
 * SC-023 — Daily check-in (mood select)  ·  FR-04-01  ·  US-04-01
 * Presentational only. The mood choice dominates; "say why" is a SEPARATE next page
 * (school-configured optional/required) — not on this screen.
 * Age-banded: 5–7 / 8–11 see a simpler set + read-aloud; 12–18 see richer wording.
 */
import { PhoneFrame, MoodFace, Mood, Button, Icon } from '../components'

const MOODS: { mood: Mood; label: string }[] = [
  { mood: 'great', label: 'Great' },
  { mood: 'good', label: 'Good' },
  { mood: 'ok', label: 'OK' },
  { mood: 'worried', label: 'Worried' },
  { mood: 'sad', label: 'Sad' },
  { mood: 'angry', label: 'Angry' },
]

export interface StudentCheckInProps {
  studentName?: string
  selected?: Mood
  onSelect?: (m: Mood) => void
  onContinue?: () => void
  onBack?: () => void
}

export function StudentCheckIn({ studentName = 'Aisha', selected = 'good', onSelect, onContinue, onBack }: StudentCheckInProps) {
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
      <div className="flex items-center gap-2.5 pb-0.5 pt-2">
        <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-coral-100 text-sm font-bold text-coral-700">{studentName.slice(0, 2).toUpperCase()}</span>
        <div className="text-[13px] font-medium text-neutral-500">Good morning<b className="block text-[15px] font-bold text-neutral-900">Hi, {studentName} 👋</b></div>
      </div>

      <h2 className="mb-1 mt-4 text-[30px] font-black leading-[1.1] tracking-tighter">How are you <span className="text-coral">feeling</span> today?</h2>
      <p className="mb-4 text-[13.5px] text-neutral-500">Tap the face that fits. There&apos;s no wrong answer.</p>

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        {MOODS.map(({ mood, label }) => {
          const on = selected === mood
          return (
            <button key={mood} onClick={() => onSelect?.(mood)}
              className={`rounded-lg border-[1.5px] px-1.5 pb-2.5 pt-3 text-center transition ${on ? 'border-coral bg-coral-50 shadow-focus' : 'border-neutral-200 hover:border-coral-100'}`}>
              <MoodFace mood={mood} size={46} className="mx-auto block" />
              <div className={`mt-1.5 text-[12.5px] font-semibold ${on ? 'text-coral-700' : 'text-neutral-700'}`}>{label}</div>
            </button>
          )
        })}
      </div>

      <div className="mb-3 flex items-center gap-2 text-[11.5px] text-neutral-500">
        <Icon.Heart className="h-3.5 w-3.5 shrink-0 text-coral" />
        Younger pupils see fewer faces and hear each one read aloud.
      </div>

      <div className="mt-auto flex gap-2.5 pt-1.5">
        <button onClick={onBack} className="grid h-[52px] w-[52px] place-items-center rounded-[14px] border border-neutral-200 bg-surface text-neutral-500">
          <Icon.ChevronRight className="h-[18px] w-[18px] rotate-180" />
        </button>
        <button onClick={onContinue} className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-coral py-3.5 text-[15px] font-bold text-white hover:bg-coral-600">
          Continue <Icon.ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    </PhoneFrame>
  )
}
