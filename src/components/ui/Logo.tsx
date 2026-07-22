/**
 * Logo — the ink square + coral heart mark, with an optional wordmark.
 * Reused from the approved Youhue-DESIGN component library (components/Logo.tsx). Presentational.
 */
import { Icon } from "./Icon"

export function Logo({
  wordmark,
  dark = false,
  size = 30,
}: {
  wordmark?: string
  dark?: boolean
  size?: number
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-md ${dark ? "bg-black" : "bg-ink"}`}
        style={{ width: size, height: size }}
      >
        <Icon.Heart className="h-4 w-4 text-coral" />
      </span>
      {wordmark && (
        <span className={`text-sm font-extrabold tracking-tight ${dark ? "text-white" : ""}`}>
          {wordmark}
        </span>
      )}
    </div>
  )
}
