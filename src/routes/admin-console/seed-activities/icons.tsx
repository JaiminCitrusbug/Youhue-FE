// FR-19-04 seed-activities icon set — reproduced from the approved design icon library
// (Youhue-DESIGN components/icons.tsx): thin 1.8 stroke, round joins, currentColor, sized by the
// consumer via `className`. Presentational only; no raw colour/size literals (token-drift = 0).
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
  Book: glyph(<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 3v16" />),
  Pencil: glyph(<path d="M4 20h4L18 10l-4-4L4 16zM13 5l4 4" />),
  Plus: glyph(<path d="M12 5v14M5 12h14" />),
  Trash: glyph(<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />),
  Undo: glyph(<path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-1" />),
  Check: glyph(<path d="M20 6L9 17l-5-5" />),
  Close: glyph(<path d="M6 6l12 12M18 6L6 18" />),
}
