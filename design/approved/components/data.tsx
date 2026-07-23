/**
 * Data-display — Card, CardHeader, StatTile, KV, Table.
 * Presentational only. Composes into every staff screen.
 */
import * as React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-lg border border-neutral-200 bg-surface shadow-card ${className}`}>{children}</div>
}

export function CardHeader({ icon, title, hint, action }: { icon?: React.ReactNode; title: string; hint?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3 [&>svg]:h-[15px] [&>svg]:w-[15px] [&>svg]:text-neutral-500">
      {icon}
      <h4 className="text-[13.5px] font-bold text-neutral-900">{title}</h4>
      {hint && <span className="ml-auto text-[11px] text-neutral-500">{hint}</span>}
      {action && <span className="ml-auto">{action}</span>}
    </div>
  )
}

export function CardBody({ children, flush = false }: { children: React.ReactNode; flush?: boolean }) {
  return <div className={flush ? 'py-1' : 'p-4'}>{children}</div>
}

/** Stat tile. `delta` is a REAL change (e.g. "+0.4 vs last week"); use `deltaTone` 'up' for a genuine positive, 'neutral' when the sub is not a change. */
export function StatTile({ label, icon, value, unit, delta, deltaTone = 'neutral', deltaIcon }: {
  label: string; icon?: React.ReactNode; value: React.ReactNode; unit?: string
  delta?: React.ReactNode; deltaTone?: 'up' | 'neutral'; deltaIcon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-surface p-3.5 shadow-card">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 [&_svg]:h-[13px] [&_svg]:w-[13px] [&_svg]:text-neutral-400">
        {icon}{label}
      </div>
      <div className="mt-1.5 text-2xl font-extrabold leading-none tracking-tighter">
        {value}{unit && <small className="text-[13px] font-semibold text-neutral-400"> {unit}</small>}
      </div>
      {delta && (
        <div className={`mt-1.5 inline-flex items-center gap-1 text-[11px] ${deltaTone === 'up' ? 'font-semibold text-status-ok' : 'font-medium text-neutral-500'} [&_svg]:h-3 [&_svg]:w-3`}>
          {deltaIcon}{delta}
        </div>
      )}
    </div>
  )
}

export function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-surface p-3 shadow-card">
      <span className="mb-1.5 block text-[11px] font-medium text-neutral-500">{label}</span>
      <b className="text-sm font-semibold leading-snug">{children}</b>
    </div>
  )
}

/** Minimal presentational table. Pass column headers and an array of cell-arrays. */
export function Table({ head, rows }: { head: React.ReactNode[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>{head.map((h, i) => (
          <th key={i} className="border-b border-neutral-200 px-4 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="[&:last-child>td]:border-0">
            {r.map((c, j) => <td key={j} className="border-b border-neutral-100 px-4 py-2.5 align-middle">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Person cell for tables (avatar + name + sub). */
export function PersonCell({ initials, name, sub }: { initials: string; name: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-600">{initials}</span>
      <span><b className="text-[12.5px] font-semibold">{name}</b>{sub && <small className="block text-[11px] text-neutral-500">{sub}</small>}</span>
    </div>
  )
}
