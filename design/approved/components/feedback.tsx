/**
 * Feedback / structure — Timeline, EmptyState, Chip, SegmentedControl, SectionLabel.
 * Presentational.
 */
import * as React from 'react'

/* ---------- Timeline (append-only / immutable) ---------- */
export interface TimelineEntry {
  time: string
  who: string
  event: React.ReactNode
  tone?: 'system' | 'gap' | 'acted'
}
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const nd = (t?: string) =>
    t === 'gap' ? 'border-status-danger' : t === 'acted' ? 'border-status-ok bg-status-ok' : t === 'system' ? 'border-ink' : 'border-neutral-300'
  return (
    <div className="px-4 pb-3 pt-1">
      {entries.map((e, i) => (
        <div key={i} className="grid grid-cols-[74px_18px_1fr] gap-2.5 py-2.5">
          <div className="pt-0.5 text-right text-[11.5px] font-semibold text-neutral-500">{e.time}</div>
          <div className="flex flex-col items-center self-stretch">
            <span className={`mt-0.5 h-[11px] w-[11px] shrink-0 rounded-full border-[2.5px] bg-white ${nd(e.tone)}`} />
            {i < entries.length - 1 && <span className="my-0.5 w-0.5 flex-1 bg-neutral-200" />}
          </div>
          <div>
            {e.who && <b className="text-[12.5px] font-semibold">{e.who}</b>}
            <div className={`text-[12.5px] ${e.tone === 'gap' ? 'font-semibold text-status-danger' : 'text-neutral-700'}`}>{e.event}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      {icon && <div className="mx-auto mb-3.5 grid h-[52px] w-[52px] place-items-center rounded-xl bg-neutral-100 text-neutral-400 [&_svg]:h-6 [&_svg]:w-6">{icon}</div>}
      <h4 className="mb-1.5 text-[15px] font-bold text-neutral-700">{title}</h4>
      {children && <p className="mx-auto mb-3.5 max-w-[300px] text-[13px] text-neutral-500">{children}</p>}
      {action}
    </div>
  )
}

/* ---------- Chip (e.g. concern words; removable) ---------- */
export function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-neutral-100 px-2.5 py-1 text-[11.5px] font-semibold text-neutral-600">
      {children}
      {onRemove && <button onClick={onRemove} className="text-neutral-400 hover:text-status-danger" aria-label="remove">×</button>}
    </span>
  )
}

/* ---------- SegmentedControl ---------- */
export function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange?: (v: string) => void }) {
  return (
    <div className="flex rounded-md border border-neutral-200 bg-neutral-100 p-0.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange?.(o)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold ${o === value ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-neutral-500'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ---------- Section label (grid group heading inside a content area) ---------- */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{children}</div>
}
