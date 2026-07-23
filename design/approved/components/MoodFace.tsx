/**
 * MoodFace — flat-vector SVG mood face, built in code (themeable, offline-safe).
 * Presentational only. Fills come from the shared theme's diverging mood scale (single source).
 * Every face shares identical eyes/proportions so the set reads as one size family.
 */
import * as React from 'react'
import { theme } from '../../theme/tailwind.theme'

export type Mood = 'great' | 'good' | 'ok' | 'worried' | 'sad' | 'angry'

const FILL = theme.colors.mood // { great, good, ok, worried, sad, angry }

export interface MoodFaceProps {
  mood: Mood
  size?: number
  className?: string
}

export function MoodFace({ mood, size = 44, className }: MoodFaceProps) {
  const feat = mood === 'ok' ? '#525C6B' : '#FFFFFF' // dark features on the light grey pivot only
  const stroke = { fill: 'none', stroke: feat, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const brow = { fill: 'none', stroke: feat, strokeWidth: 2.5, strokeLinecap: 'round' as const }

  let mouth: React.ReactNode
  let brows: React.ReactNode = null
  switch (mood) {
    case 'great': mouth = <path d="M15.5 27.5 Q24 38 32.5 27.5 Z" fill={feat} />; break
    case 'good': mouth = <path d="M16.5 28.5 Q24 34.5 31.5 28.5" {...stroke} />; break
    case 'ok': mouth = <path d="M17.5 30.5 L30.5 30.5" {...stroke} />; break
    case 'worried':
      mouth = <path d="M17.5 31.5 Q24 28 30.5 31.5" {...stroke} />
      brows = (<><path d="M14.5 16.5 L20 15" {...brow} /><path d="M33.5 16.5 L28 15" {...brow} /></>)
      break
    case 'sad': mouth = <path d="M16.5 32.5 Q24 27 31.5 32.5" {...stroke} />; break
    case 'angry':
      mouth = <path d="M16.5 32 Q24 27.5 31.5 32" {...stroke} />
      brows = (<><path d="M14 15 L20 17.5" {...brow} /><path d="M34 15 L28 17.5" {...brow} /></>)
      break
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={mood} className={className}>
      <circle cx={24} cy={24} r={22} fill={FILL[mood]} />
      {brows}
      <circle cx={17.5} cy={20.5} r={2.6} fill={feat} />
      <circle cx={30.5} cy={20.5} r={2.6} fill={feat} />
      {mouth}
    </svg>
  )
}

/** Small labelled mood dot for tables/lists. */
export function MoodDot({ mood, label }: { mood: Mood; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
      <span className="inline-block h-[18px] w-[18px] rounded-full" style={{ background: FILL[mood] }} />
      {label ?? mood}
    </span>
  )
}
