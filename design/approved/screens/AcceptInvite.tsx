/**
 * SC-019 — Accept colleague invitation  ·  FR-02-03  ·  US-02-03
 * Presentational only. Scoped to the shared class only.
 */
import { AuthCard, KV, Button } from '../components'

export function AcceptInvite() {
  return (
    <AuthCard title="You&rsquo;ve been invited">
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <KV label="Class">Year 5 — Maple</KV>
        <KV label="Invited by">R. Okafor</KV>
      </div>
      <Button variant="ink" block>Accept &amp; set up</Button>
    </AuthCard>
  )
}
