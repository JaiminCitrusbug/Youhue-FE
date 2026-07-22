import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"

import { Icon } from "./icons"

// Admin-console pre-login frame — the shipped equivalent of the design's AuthCard/AuthField/Divider
// (Youhue-DESIGN frames.tsx + forms.tsx), reproduced on the shared theme / 4px scale so the
// token-drift gate stays 0 (no raw px/hex). Presentational only.

/** Centered pre-login card with the Student Wellbeing brand lockup (internal-admin surface). */
export function AdminAuthCard({
  title,
  sub,
  footer,
  children,
}: {
  title: string
  sub?: string
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-8 font-sans text-neutral-900">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-surface p-7 shadow-pop">
        <div className="flex justify-center pb-1.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-ink">
              <Icon.Heart className="h-4 w-4 text-coral" />
            </span>
            <span className="text-sm font-extrabold tracking-tight">Student Wellbeing</span>
          </div>
        </div>
        <h3 className="mt-1.5 text-center text-xl font-extrabold tracking-tighter">{title}</h3>
        {sub ? (
          <p className="mb-5 mt-1.5 text-center text-sm text-neutral-500">{sub}</p>
        ) : (
          <div className="h-3.5" />
        )}
        {children}
        {footer ? (
          <div className="mt-4 text-center text-xs text-neutral-500 [&_a]:font-semibold [&_a]:text-coral-text">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Labelled form row. */
export function AdminField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="mb-3.5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  )
}

/** Text input bound to the shared theme (matches the design Input). */
export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-coral focus:shadow-focus focus:outline-none"
      {...props}
    />
  )
}

/** Labelled hairline divider (e.g. "then"). */
export function Divider({ children = "or" }: { children?: ReactNode }) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs font-semibold text-neutral-400 before:h-px before:flex-1 before:bg-neutral-200 after:h-px after:flex-1 after:bg-neutral-200">
      {children}
    </div>
  )
}

/** Full-width ink action button (matches the design Button variant="ink"). */
export function InkButton({
  children,
  icon,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-600 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4"
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
