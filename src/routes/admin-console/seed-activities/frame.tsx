import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react"

// FR-19-04 · Presentational primitives for the seed-activities admin screen, componentized from the
// approved design (Youhue-DESIGN/approved/screens/SeedActivities.tsx + components/AppShell.tsx:
// PageHeader/Card/Table). Reproduced on the shared theme ("Ink & Coral", src/styles/tailwind.theme.ts)
// and the 4px scale — no raw px/hex — so token-drift stays 0. Presentational only; wiring lives in
// the container (./SeedActivities).

/** Page header used at the top of a console content area (approved PageHeader). */
export function PageHeader({
  crumb,
  title,
  sub,
  right,
}: {
  crumb?: string
  title: ReactNode
  sub?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div>
        {crumb ? <div className="mb-0.5 text-xs text-neutral-500">{crumb}</div> : null}
        <h1 className="flex items-center gap-3 text-xl font-extrabold tracking-tighter text-neutral-900">
          {title}
        </h1>
        {sub ? <div className="mt-0.5 text-sm text-neutral-500">{sub}</div> : null}
      </div>
      {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
    </div>
  )
}

/** Bordered card container (approved Card). */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-surface shadow-card">
      {children}
    </div>
  )
}

export function CardHeader({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-neutral-400">
      {icon}
      <span className="text-sm font-bold tracking-tight text-neutral-900">{title}</span>
      {hint ? <span className="ml-auto text-xs text-neutral-400">{hint}</span> : null}
    </div>
  )
}

export function CardBody({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return <div className={flush ? "" : "p-4"}>{children}</div>
}

/** Full-width ink action button (approved Button variant="ink"). */
export function InkButton({
  children,
  icon,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-600 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

/** Quiet secondary button (approved Button variant="ghost"). */
export function GhostButton({
  children,
  icon,
  tone = "neutral",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode; tone?: "neutral" | "danger" }) {
  const toneCls =
    tone === "danger"
      ? "border-neutral-200 bg-surface text-status-danger hover:bg-status-dangerBg"
      : "border-neutral-200 bg-surface text-neutral-700 hover:bg-neutral-50"
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5 ${toneCls}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

/** Labelled form field wrapper. */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
      {children}
    </label>
  )
}

/** Text input bound to the shared theme (matches the approved Input). */
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-coral focus:shadow-focus focus:outline-none"
      {...props}
    />
  )
}

/** Select bound to the shared theme. */
export function Select({ children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-coral focus:shadow-focus focus:outline-none"
      {...rest}
    >
      {children}
    </select>
  )
}

/** Small status pill for the retired state. */
export function RetiredBadge() {
  return (
    <span className="inline-flex items-center rounded-pill bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
      Retired
    </span>
  )
}
