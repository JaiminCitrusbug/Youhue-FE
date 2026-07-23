/**
 * SC-016 — Forgot password · check email  ·  FR-01-06  ·  US-01-06
 * Presentational only. Step 2 of 3 — never discloses whether the account exists.
 */
import { AuthCard, Banner, Button, Icon } from '../components'

export function CheckEmail() {
  return (
    <AuthCard title="Check your email" sub="Step 2 of 3">
      <Banner tone="info" icon={<Icon.Mail />}>
        If the account exists, a reset link has been sent. Check your inbox and spam folder.
      </Banner>
      <Button variant="ghost" block>Back to sign in</Button>
    </AuthCard>
  )
}
