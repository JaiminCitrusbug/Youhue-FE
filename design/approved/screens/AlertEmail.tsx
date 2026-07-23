/**
 * SC-087 — Alert email  ·  FR-18-01  ·  US-18-01
 * Presentational only. First-class safeguarding surface; carries context to act.
 */
import { EmailFrame, EmailCTA, KV, Icon } from '../components'

export function AlertEmail() {
  return (
    <EmailFrame from="Student Wellbeing — Safeguarding" to="you" when="08:47" subject="A student may need support">
      <div className="mb-4 grid gap-2">
        <KV label="Student">Liam O. (Year 5 — Maple)</KV>
        <KV label="Flag">concern-word + AI 0.86 → Immediate</KV>
        <KV label="When">today 08:47</KV>
      </div>
      <p className="mb-3.5 text-[14px] leading-relaxed text-neutral-700">
        The check-in has been flagged. Please open it in the app to see the context and act.
      </p>
      <EmailCTA><Icon.ChevronRight className="h-4 w-4" />Open in app</EmailCTA>
    </EmailFrame>
  )
}
