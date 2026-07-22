/**
 * AuthCard / AuthField / Divider — the centred pre-login card frame.
 * Reused verbatim from the approved Youhue-DESIGN library (components/frames.tsx, forms.tsx).
 * The fixed hi-fi sizing values (px) live on `token-ok`-marked lines: approved design values
 * imported verbatim (do-not-restyle — the visual gate is the authority).
 */
import * as React from "react"

import { Logo } from "./Logo"

const CARD_WRAP = "flex min-h-[560px] items-center justify-center bg-canvas p-8" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_BODY = "w-[400px] max-w-full rounded-2xl border border-neutral-200 bg-surface p-7 shadow-pop" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_TITLE = "mt-1.5 text-center text-[21px] font-extrabold tracking-tighter" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CARD_SUB = "mb-5 mt-1.5 text-center text-[13px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)

/** Centred pre-login card. */
export function AuthCard({
  title,
  sub,
  children,
  footer,
}: {
  title: string
  sub?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className={CARD_WRAP}>
      <div className={CARD_BODY}>
        <div className="flex justify-center pb-1.5">
          <Logo wordmark="Student Wellbeing" />
        </div>
        <h3 className={CARD_TITLE}>{title}</h3>
        {sub && <p className={CARD_SUB}>{sub}</p>}
        {!sub && <div className="h-3.5" />}
        {children}
        {footer && (
          <div className="mt-4.5 text-center text-xs text-neutral-500 [&_a]:font-semibold [&_a]:text-coral-text">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function AuthField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
    </div>
  )
}

const DIVIDER_CLS =
  "my-4 flex items-center gap-3 text-[11px] font-semibold text-neutral-400 before:h-px before:flex-1 before:bg-neutral-200 after:h-px after:flex-1 after:bg-neutral-200" // token-ok: approved Design-final-v3 value (do-not-restyle)

export function Divider({ children = "or" }: { children?: React.ReactNode }) {
  return <div className={DIVIDER_CLS}>{children}</div>
}
