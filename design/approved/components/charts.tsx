/**
 * Charts — MoodDonut (diverging mood mix) and MiniBars (weekly index).
 * Presentational; segment colours come from the shared theme's mood scale.
 */
import { theme } from '../../theme/tailwind.theme'
import type { Mood } from './MoodFace'

const ORDER: Mood[] = ['great', 'good', 'ok', 'worried', 'sad', 'angry']

/** data: counts per mood. centerLabel + centerSub render in the hole. */
export function MoodDonut({ data, centerLabel, centerSub, size = 112 }: {
  data: Record<Mood, number>; centerLabel?: string; centerSub?: string; size?: number
}) {
  const total = ORDER.reduce((s, m) => s + (data[m] || 0), 0) || 1
  let offset = 0
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="block">
      <g transform="rotate(-90 60 60)" fill="none" strokeWidth={15}>
        {ORDER.map((m) => {
          const pct = ((data[m] || 0) / total) * 100
          const seg = <circle key={m} cx={60} cy={60} r={42} pathLength={100} stroke={theme.colors.mood[m]} strokeDasharray={`${pct} 100`} strokeDashoffset={-offset} />
          offset += pct
          return seg
        })}
      </g>
      {centerLabel && <text x={60} y={57} textAnchor="middle" fontSize={18} fontWeight={800} fill={theme.colors.neutral[900]}>{centerLabel}</text>}
      {centerSub && <text x={60} y={72} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={theme.colors.neutral[500]}>{centerSub}</text>}
    </svg>
  )
}

/** Legend row for the donut. */
export function MoodLegend({ data }: { data: Record<Mood, number> }) {
  const label: Record<Mood, string> = { great: 'Great', good: 'Good', ok: 'OK', worried: 'Worried', sad: 'Sad', angry: 'Angry' }
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[10.5px]">
      {ORDER.map((m) => (
        <div key={m} className="flex items-center gap-1.5 text-neutral-700">
          <span className="h-[9px] w-[9px] rounded-sm" style={{ background: theme.colors.mood[m] }} />
          {label[m]}<b className="ml-auto font-bold">{data[m] ?? 0}</b>
        </div>
      ))}
    </div>
  )
}

/** Simple ink column chart. bars: [{ label, value 0..1, muted? }]. */
export function MiniBars({ bars, height = 120 }: { bars: { label: string; value: number; muted?: boolean }[]; height?: number }) {
  return (
    <div className="flex items-end gap-2.5 px-0.5" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div className={`w-full max-w-[26px] rounded-t-md ${b.muted ? 'bg-ink-100' : 'bg-ink'}`} style={{ height: `${Math.round(b.value * 100)}%` }} />
          <small className="text-[11px] font-medium text-neutral-500">{b.label}</small>
        </div>
      ))}
    </div>
  )
}
