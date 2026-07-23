/**
 * SC-018 — Link SSO to existing account  ·  FR-01-04  ·  US-01-04
 * Presentational only. Links a Google/Microsoft identity to a matching email account.
 */
import { AuthCard, Banner, Button, Icon } from '../components'

export function LinkSSO() {
  return (
    <AuthCard title="Confirm account link">
      <Banner tone="info" icon={<Icon.Link />}>
        A Google/Microsoft identity matches an existing email account.
      </Banner>
      <Button variant="ink" block>Link accounts &amp; continue</Button>
      <Button variant="ghost" block className="mt-2.5">Cancel</Button>
    </AuthCard>
  )
}
