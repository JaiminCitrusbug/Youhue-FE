/**
 * Primitives — Button, Tag (status), Trend, Avatar, Banner, Toggle, Badge.
 * Presentational only (props in, markup out). Every colour comes from Tailwind utilities
 * bound to the shared theme — no hardcoded hex. Status is always icon + label + colour.
 */
import * as React from 'react'

/* ---------- Button ---------- */
type ButtonVariant = 'ink' | 'coral' | 'ghost' | 'danger'
const BTN: Record<ButtonVariant, string> = {
  ink: 'bg-ink text-white hover:bg-ink-600',
  coral: 'bg-coral text-white hover:bg-coral-600',
  ghost: 'bg-surface text-neutral-700 border border-neutral-300 hover:bg-neutral-50',
  danger: 'bg-status-danger text-white',
}
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  block?: boolean
  icon?: React.ReactNode
}
export function Button({ variant = 'ink', block, icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold [&_svg]:h-[15px] [&_svg]:w-[15px] ${BTN[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

/* ---------- Tag (status — never colour alone) ---------- */
type TagTone = 'danger' | 'warn' | 'ok' | 'mut' | 'ink' | 'coral'
const TAG: Record<TagTone, string> = {
  danger: 'bg-status-dangerBg text-status-danger',
  warn: 'bg-status-warnBg text-status-warn',
  ok: 'bg-status-okBg text-status-ok',
  mut: 'bg-neutral-100 text-neutral-500',
  ink: 'bg-ink-50 text-ink-700',
  coral: 'bg-coral-50 text-coral-600',
}
export function Tag({ tone = 'mut', icon, children }: { tone?: TagTone; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-[11px] font-semibold [&_svg]:h-3 [&_svg]:w-3 ${TAG[tone]}`}>
      {icon}
      {children}
    </span>
  )
}

/* ---------- Trend ---------- */
export function Trend({ dir, dotColor, children }: { dir: 'up' | 'down' | 'flat'; dotColor?: string; children: React.ReactNode }) {
  const tone = dir === 'down' ? 'text-status-danger' : dir === 'up' ? 'text-status-ok' : 'text-neutral-500'
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${tone}`}>
      {dotColor && <span className="inline-block h-2 w-2 rounded-full" style={{ background: dotColor }} />}
      {children}
    </span>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ initials, className = '' }: { initials: string; className?: string }) {
  return (
    <span className={`inline-grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-600 ${className}`}>
      {initials}
    </span>
  )
}

/* ---------- Banner ---------- */
type BannerTone = 'info' | 'warn' | 'danger'
const BANNER: Record<BannerTone, string> = {
  info: 'bg-ink-50 border-neutral-200 text-neutral-700 [&_svg]:text-ink',
  warn: 'bg-status-warnBg border-status-warn/30 text-neutral-700 [&_svg]:text-status-warn',
  danger: 'bg-status-dangerBg border-status-danger/30 text-neutral-700 [&_svg]:text-status-danger',
}
export function Banner({ tone = 'info', icon, children }: { tone?: BannerTone; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`mb-4 flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[12.5px] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 ${BANNER[tone]}`}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

/* ---------- Toggle ---------- */
export function Toggle({ on = false }: { on?: boolean }) {
  return (
    <span className={`relative inline-block h-[22px] w-[38px] rounded-pill ${on ? 'bg-coral' : 'bg-neutral-300'}`}>
      <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </span>
  )
}

/* ---------- Badge (nav count) ---------- */
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto grid h-[17px] min-w-[17px] place-items-center rounded-pill bg-status-danger px-1 text-[10px] font-bold text-white">
      {children}
    </span>
  )
}
