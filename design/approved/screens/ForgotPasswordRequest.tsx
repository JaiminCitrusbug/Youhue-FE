/**
 * SC-015 — Forgot password · request  ·  FR-01-06  ·  US-01-06
 * Presentational only. Step 1 of 3 — request a reset link.
 */
import { AuthCard, AuthField, Input, Button } from '../components'

export function ForgotPasswordRequest() {
  return (
    <AuthCard title="Reset your password" sub="Step 1 of 3" footer={<a href="#">Back to sign in</a>}>
      <AuthField label="School email">
        <Input type="email" defaultValue="r.okafor@maple-primary.sch.uk" />
      </AuthField>
      <Button variant="ink" block className="mt-1">Send reset link</Button>
    </AuthCard>
  )
}
