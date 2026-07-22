import type { ReactNode } from "react"

// Student surface frame for the passwordless sign-in screens (SC-020/021/022).
// Warm coral canvas + a centred mobile column — the shipped-app equivalent of the design's
// PhoneFrame (the device bezel is a design-gallery mock, not part of the product). Matches the
// existing StudentShell (coral, no staff chrome). Theme tokens only — no raw colour/size literals.
export function StudentScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-coral-canvas font-sans text-neutral-900">
      <div className="flex min-h-screen w-full max-w-sm flex-col px-6 pb-6 pt-5">{children}</div>
    </div>
  )
}
