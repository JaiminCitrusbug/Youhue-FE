/**
 * Input — reused verbatim from the approved Youhue-DESIGN library (components/forms.tsx).
 * The fixed hi-fi font-size lives on a `token-ok`-marked line (approved design value, do-not-restyle).
 */
import * as React from "react"

const INPUT_CLS =
  "w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-coral focus:shadow-focus focus:outline-none" // token-ok: approved Design-final-v3 value (do-not-restyle)

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={INPUT_CLS} {...props} />
}
