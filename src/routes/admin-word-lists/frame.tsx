import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"

// SC-079 presentational frame — the shipped equivalent of the approved design primitives used by
// DefaultWordLists.tsx (PageHeader / Card / CardHeader / CardBody / Chip / Field / Input / Button,
// Youhue-DESIGN data.tsx + forms.tsx + feedback.tsx + AppShell.tsx), reproduced on the shared
// theme / 4px scale so the token-drift gate stays 0 (no raw px/hex arbitrary values).
// Presentational only.

/** Content-area page header (crumb + title + sub). */
export function PageHeader({
  crumb,
  title,
  sub,
}: {
  crumb?: string
  title: ReactNode
  sub?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2.5">
      <div>
        {crumb ? <div className="mb-0.5 text-xs text-neutral-500">{crumb}</div> : null}
        <h3 className="flex items-center gap-3 text-lg font-extrabold tracking-tighter">{title}</h3>
        {sub ? <div className="mt-0.5 text-xs text-neutral-500">{sub}</div> : null}
      </div>
    </div>
  )
}

/** Bordered surface card. */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-surface shadow-card">
      {children}
    </div>
  )
}

/** Card header row with an optional leading icon. */
export function CardHeader({ icon, title }: { icon?: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-neutral-500">
      {icon}
      <h4 className="text-sm font-bold text-neutral-900">{title}</h4>
    </div>
  )
}

/** Card body (padded content region). */
export function CardBody({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>
}

/** Removable word chip. `onRemove` renders the × affordance (approved design). */
export function Chip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-neutral-400 hover:text-status-danger"
          aria-label={`Remove ${typeof children === "string" ? children : "word"}`}
        >
          ×
        </button>
      ) : null}
    </span>
  )
}

/** Labelled form row. */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="mb-3">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  )
}

/** Text input bound to the shared theme (matches the design Input). */
export function WordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-coral focus:shadow-focus focus:outline-none"
      {...props}
    />
  )
}

/** Ink action button (matches the design Button variant="ink"). */
export function InkButton({
  children,
  icon,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-600 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
