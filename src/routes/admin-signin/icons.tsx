// Admin sign-in icon set — reproduced from the approved design icons (Heart brand mark, Flag,
// Check). Thin-stroke, currentColor, sized by the consumer via `className`. Presentational only;
// no raw colour/size literals (token-drift = 0).
import type { ReactNode } from "react"

type IconProps = { className?: string }

const glyph =
  (children: ReactNode) =>
  ({ className }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )

export const Icon = {
  Heart: glyph(
    <path d="M20.8 6.6a4.5 4.5 0 0 0-7.6-2A4.5 4.5 0 0 0 3.2 6.6C2.5 9.9 6 13 12 17c6-4 9.5-7.1 8.8-10.4z" />,
  ),
  Flag: glyph(<path d="M5 21V4M5 4h11l-2 4 2 4H5" />),
  Check: glyph(<path d="M20 6L9 17l-5-5" />),
}
