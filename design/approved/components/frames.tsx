/**
 * Frames — pre-login and non-shell page frames: AuthCard, EmailFrame, SystemPage, LegalPage.
 * Presentational only. Used by auth (SC-014–019, 026, 073), emails (SC-087, 090),
 * system pages (SC-011–013) and legal pages (SC-008–010).
 */
import * as React from 'react'
import { Logo } from './Logo'

/** Centered pre-login card. */
export function AuthCard({ title, sub, children, footer }: { title: string; sub?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 sm:p-8">
      <div className="w-[400px] max-w-full rounded-2xl border border-neutral-200 bg-surface p-7 shadow-pop">
        <div className="flex justify-center pb-1.5"><Logo wordmark="Student Wellbeing" /></div>
        <h3 className="mt-1.5 text-center text-[21px] font-extrabold tracking-tighter">{title}</h3>
        {sub && <p className="mb-5 mt-1.5 text-center text-[13px] text-neutral-500">{sub}</p>}
        {!sub && <div className="h-3.5" />}
        {children}
        {footer && <div className="mt-4.5 text-center text-xs text-neutral-500 [&_a]:font-semibold [&_a]:text-coral-text">{footer}</div>}
      </div>
    </div>
  )
}

export function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
    </div>
  )
}

export function Divider({ children = 'or' }: { children?: React.ReactNode }) {
  return (
    <div className="my-4 flex items-center gap-3 text-[11px] font-semibold text-neutral-400 before:h-px before:flex-1 before:bg-neutral-200 after:h-px after:flex-1 after:bg-neutral-200">
      {children}
    </div>
  )
}

/** Email preview. */
export function EmailFrame({ from = 'Student Wellbeing', to = 'you', when = 'now', subject, children }: {
  from?: string; to?: string; when?: string; subject: string; children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen justify-center bg-canvas p-4 sm:p-8">
      <div className="w-full max-w-[560px] self-start overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-pop">
      <div className="flex items-center gap-2.5 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        <Logo size={30} />
        <div><b className="block text-[13px] font-bold text-neutral-900">{from}</b><span>to {to}</span></div>
        <span className="ml-auto">{when}</span>
      </div>
      <div className="p-5.5">
        <div className="mb-3 text-lg font-extrabold tracking-tight">{subject}</div>
        {children}
      </div>
      </div>
    </div>
  )
}

/** Email call-to-action button (rendered as an ink link-button). */
export function EmailCTA({ children }: { children: React.ReactNode }) {
  return <a className="mt-1.5 inline-flex items-center gap-2 rounded-md bg-ink px-4.5 py-2.5 text-[13px] font-semibold text-white">{children}</a>
}

/** 404 / 500 / maintenance. */
export function SystemPage({ code, title, children }: { code?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 md:p-10 text-center">
      {code && <div className="text-6xl font-black tracking-tighter text-ink">{code}</div>}
      <h3 className="mb-2 mt-2 text-[22px] font-extrabold">{title}</h3>
      <div className="max-w-[380px] text-sm text-neutral-500">{children}</div>
    </div>
  )
}

/** Terms / Privacy / COPPA-FERPA long-form. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[760px] px-6 py-10 md:py-14 [&_h4]:mt-5 [&_h4]:mb-1.5 [&_h4]:text-sm [&_h4]:font-bold [&_p]:mb-2.5 [&_p]:text-[13.5px] [&_p]:leading-relaxed [&_p]:text-neutral-700">
        <h3 className="mb-1.5 text-[22px] font-extrabold tracking-tight">{title}</h3>
        <div className="mb-5 text-xs text-neutral-500">{updated}</div>
        {children}
      </div>
    </div>
  )
}
