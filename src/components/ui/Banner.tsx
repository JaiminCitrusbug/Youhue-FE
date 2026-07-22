/**
 * Banner — reused verbatim from the approved Youhue-DESIGN library (components/primitives.tsx).
 * Status is icon + colour bound to the shared theme. The fixed hi-fi font-size lives on a
 * `token-ok`-marked line (approved design value, do-not-restyle).
 */
import * as React from "react"

type BannerTone = "info" | "warn" | "danger"

const BANNER: Record<BannerTone, string> = {
  info: "bg-ink-50 border-neutral-200 text-neutral-700 [&_svg]:text-ink",
  warn: "bg-status-warnBg border-status-warn/30 text-neutral-700 [&_svg]:text-status-warn",
  danger: "bg-status-dangerBg border-status-danger/30 text-neutral-700 [&_svg]:text-status-danger",
}

const BANNER_BASE =
  "mb-4 flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[12.5px] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0" // token-ok: approved Design-final-v3 value (do-not-restyle)

export function Banner({
  tone = "info",
  icon,
  children,
}: {
  tone?: BannerTone
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={`${BANNER_BASE} ${BANNER[tone]}`}>
      {icon}
      <span>{children}</span>
    </div>
  )
}
