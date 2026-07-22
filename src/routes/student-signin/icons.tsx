// Student sign-in icon set — reused from the approved design (Youhue-DESIGN/approved icons +
// the per-screen glyphs on StudentSignInCode/QR/Name). Thin-stroke, currentColor, sized by the
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
      strokeWidth={1.9}
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
  ArrowRight: glyph(<path d="M5 12h14M13 6l6 6-6 6" />),
  ArrowLeft: glyph(<path d="M19 12H5M11 6l-6 6 6 6" />),
  Users: glyph(<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />),
  Key: glyph(
    <>
      <rect x={3} y={6} width={18} height={12} rx={2} />
      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </>,
  ),
  Qr: glyph(<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3M20 14v6M14 20h3" />),
  Sound: glyph(<path d="M11 5L6 9H3v6h3l5 4zM16 9a3 3 0 0 1 0 6M19 6a7 7 0 0 1 0 12" />),
}
