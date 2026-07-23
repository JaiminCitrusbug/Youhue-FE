// SC-079 icon set — reproduced from the approved design icons (Alert triangle, Check, X/remove,
// Plus). Thin-stroke, currentColor, sized by the consumer via `className`. Presentational only;
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
  Alert: glyph(<path d="M12 4l8 14H4l8-14zM12 10v4M12 17h.01" />),
  Check: glyph(<path d="M20 6L9 17l-5-5" />),
  Plus: glyph(<path d="M12 5v14M5 12h14" />),
  X: glyph(<path d="M18 6L6 18M6 6l12 12" />),
}
