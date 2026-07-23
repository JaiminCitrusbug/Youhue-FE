/**
 * PhoneFrame — the student (coral) mobile shell. Presentational wrapper.
 * Warm coral-tint canvas, status bar, optional bottom tab bar via `tabs`.
 */
import * as React from 'react'

export function PhoneFrame({ children, tabs }: { children: React.ReactNode; tabs?: React.ReactNode }) {
  return (
    <div className="w-[322px] shrink-0 rounded-[42px] bg-[#111] p-[11px] shadow-pop">
      <div className="relative flex h-[676px] flex-col overflow-hidden rounded-[32px] bg-coral-canvas">
        <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[12px] font-semibold text-neutral-700">
          <span className="absolute left-1/2 top-[11px] h-[22px] w-[96px] -translate-x-1/2 rounded-b-2xl bg-[#111]" />
          <span>9:41</span>
          <span aria-hidden>▮▮▮ ▪</span>
        </div>
        <div className="flex flex-1 flex-col overflow-auto px-6 pb-4 pt-2">{children}</div>
        {tabs && <div className="flex border-t border-neutral-200 bg-surface px-3 pb-3 pt-2">{tabs}</div>}
      </div>
    </div>
  )
}
