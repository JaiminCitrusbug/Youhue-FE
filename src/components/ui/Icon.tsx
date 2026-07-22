/**
 * Icon — thin-stroke set (currentColor), sized by the consuming component.
 * Reused verbatim from the approved Youhue-DESIGN component library (components/icons.tsx).
 * Only the icons the staff-auth screens need are imported here; keep the 1.8 stroke + round joins.
 */
import * as React from "react"

const S = (p: React.ReactNode) => (props: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    {p}
  </svg>
)

export const Icon = {
  Heart: S(
    <path d="M20.8 6.6a4.5 4.5 0 0 0-7.6-2A4.5 4.5 0 0 0 3.2 6.6C2.5 9.9 6 13 12 17c6-4 9.5-7.1 8.8-10.4z" />,
  ),
  Mail: S(
    <>
      <path d="M3 5h18v14H3z" />
      <path d="M3 6l9 7 9-7" />
    </>,
  ),
  Link: S(
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />,
  ),
  Lock: S(
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>,
  ),
  Shield: S(<path d="M12 3l8 3v6c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V6z" />),
}
