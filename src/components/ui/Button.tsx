/**
 * Button — reused verbatim from the approved Youhue-DESIGN library (components/primitives.tsx).
 * Every colour comes from a Tailwind utility bound to the shared theme — no hardcoded hex.
 * The fixed hi-fi sizing values (px) live on `token-ok`-marked lines: they are the approved
 * design's own values, imported verbatim (do-not-restyle — the visual gate is the authority).
 */
import * as React from "react"

type ButtonVariant = "ink" | "coral" | "ghost" | "danger"

const BTN: Record<ButtonVariant, string> = {
  ink: "bg-ink text-white hover:bg-ink-600",
  coral: "bg-coral text-white hover:bg-coral-600",
  ghost: "bg-surface text-neutral-700 border border-neutral-300 hover:bg-neutral-50",
  danger: "bg-status-danger text-white",
}

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold [&_svg]:h-[15px] [&_svg]:w-[15px]" // token-ok: approved Design-final-v3 values (do-not-restyle)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  block?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = "ink",
  block,
  icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${BTN_BASE} ${BTN[variant]} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
