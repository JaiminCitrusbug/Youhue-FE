/**
 * SC-090 — Transactional emails  ·  FR-02-03 · FR-01-06  ·  US-02-03
 * Presentational only. One-time, expiring-link pattern shared with password resets.
 */
import { EmailFrame, EmailCTA, Icon } from '../components'

export function TransactionalEmail() {
  return (
    <EmailFrame from="Student Wellbeing" to="you" when="now" subject="Your invitation to Student Wellbeing">
      <p className="mb-4 text-[14px] leading-relaxed text-neutral-700">
        R. Okafor invited you to share the class &ldquo;Year 5 — Maple&rdquo;. This single-use link expires in 72 hours.
      </p>
      <EmailCTA><Icon.Mail className="h-4 w-4" />Accept invitation</EmailCTA>
      <p className="mt-4.5 text-[12px] text-neutral-500">
        Password-reset emails use the same one-time, expiring-link pattern.
      </p>
    </EmailFrame>
  )
}
