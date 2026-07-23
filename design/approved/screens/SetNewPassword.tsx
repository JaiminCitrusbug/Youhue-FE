/**
 * SC-017 — Set a new password  ·  FR-01-06  ·  US-01-06
 * Presentational only. Step 3 of 3 — sets a new password and signs in.
 */
import { AuthCard, AuthField, Input, Button } from '../components'

export function SetNewPassword() {
  return (
    <AuthCard title="Set a new password" sub="Step 3 of 3">
      <AuthField label="New password">
        <Input type="password" defaultValue="passw0rdxx" />
      </AuthField>
      <AuthField label="Confirm password">
        <Input type="password" defaultValue="passw0rdxx" />
      </AuthField>
      <Button variant="ink" block className="mt-1">Save &amp; sign in</Button>
    </AuthCard>
  )
}
