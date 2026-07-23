/**
 * SC-025 — Student · My history  ·  FR-08-01  ·  US-08-01
 * Presentational only. The student's own check-in history: streak, this-week calendar, recent list.
 * Every figure is illustrative real content rendered from props — never recomputed here.
 */
import { PhoneFrame, MoodFace, Mood, Icon, theme } from '../components'

const FireIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={theme.colors.mood.sad} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3c1 3-1 4-2 6a4 4 0 108 0c0-1-.5-2-1-3 2 1 4 3.5 4 7a7 7 0 11-14 0c0-4 3-5 5-7z" />
  </svg>
)
const SmileIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={theme.colors.mood.good} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx={12} cy={12} r={9} /><path d="M8 14a4 4 0 008 0M9 9h.01M15 9h.01" />
  </svg>
)
const BellIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)

interface CalDay { day: string; mood?: Mood }
interface HistRow { date: string; note: string; mood: Mood; label: string }

export interface MyHistoryProps {
  studentName?: string
  streakDays?: number
  weekMood?: string
  week?: CalDay[]
  recent?: HistRow[]
}

const DEFAULT_WEEK: CalDay[] = [
  { day: 'Mon', mood: 'good' }, { day: 'Tue', mood: 'ok' }, { day: 'Wed', mood: 'sad' },
  { day: 'Thu', mood: 'good' }, { day: 'Fri', mood: 'great' }, { day: 'Sat' }, { day: 'Sun' },
]
const DEFAULT_RECENT: HistRow[] = [
  { date: 'Friday', note: 'Won our football match!', mood: 'great', label: 'Great' },
  { date: 'Thursday', note: 'Good day', mood: 'good', label: 'Good' },
  { date: 'Wednesday', note: 'Argument at lunch', mood: 'sad', label: 'Sad' },
  { date: 'Tuesday', note: 'Tired after football', mood: 'ok', label: 'OK' },
]

export function MyHistory({ studentName = 'Aisha', streakDays = 7, weekMood = 'Good', week = DEFAULT_WEEK, recent = DEFAULT_RECENT }: MyHistoryProps) {
  const tabs = (
    <>
      <a className="flex flex-1 flex-col items-center gap-0.5 text-[10.5px] font-semibold text-neutral-400"><Icon.Grid className="h-5 w-5" />Home</a>
      <a className="-mt-4 flex flex-1 flex-col items-center gap-0.5 text-[10.5px] font-semibold text-neutral-400">
        <span className="grid h-[44px] w-[44px] place-items-center rounded-full border-4 border-white bg-coral text-white shadow-pop"><Icon.Heart className="h-5 w-5" /></span>
        Check-in
      </a>
      <a className="flex flex-1 flex-col items-center gap-0.5 text-[10.5px] font-semibold text-coral"><Icon.Clock className="h-5 w-5" />History</a>
    </>
  )

  return (
    <PhoneFrame tabs={tabs}>
      <div className="flex items-center gap-2.5 pb-0.5 pt-1.5">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-coral-100 text-sm font-bold text-coral-700">{studentName.slice(0, 2).toUpperCase()}</span>
        <div className="text-[13px] font-medium text-neutral-500">My check-ins<b className="block text-[15px] font-bold text-neutral-900">Nice work, {studentName}</b></div>
        <span className="ml-auto grid h-[38px] w-[38px] place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-500"><BellIcon className="h-[18px] w-[18px]" /></span>
      </div>

      <div className="my-3.5 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-neutral-200 bg-surface px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500"><FireIcon className="h-3.5 w-3.5" />Day streak</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight">{streakDays}<small className="text-[13px] font-semibold text-neutral-400"> days</small></div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-surface px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500"><SmileIcon className="h-3.5 w-3.5" />This week</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight">{weekMood}<small className="text-[13px] font-semibold text-neutral-400"> mostly</small></div>
        </div>
      </div>

      <div className="mx-0.5 mb-2.5 flex items-center text-[13px] font-bold">This week<a href="#" className="ml-auto text-[12px] font-semibold text-coral">Month ›</a></div>
      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {week.map((d) => (
          <div key={d.day} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-neutral-400">{d.day}</span>
            {d.mood
              ? <MoodFace mood={d.mood} size={34} />
              : <span className="h-[34px] w-[34px] rounded-full border-[1.5px] border-dashed border-neutral-300" />}
          </div>
        ))}
      </div>

      <div className="mx-0.5 mb-2.5 text-[13px] font-bold">Recent</div>
      <div className="flex flex-col gap-2.5">
        {recent.map((r) => (
          <div key={r.date} className="flex items-center gap-3 rounded-[10px] border border-neutral-200 bg-surface px-3.5 py-2.5">
            <MoodFace mood={r.mood} size={34} className="shrink-0" />
            <div>
              <div className="text-[12.5px] font-bold">{r.date}</div>
              <div className="text-[12px] font-medium text-neutral-500">{r.note}</div>
            </div>
            <span className="ml-auto text-[12px] font-semibold text-neutral-600">{r.label}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}
