/** SC-070 — Approval decision · FR-02-02. Presentational. */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, KV, Banner, Button, Icon,
} from '../components'

export function ApprovalDecision() {
  return (
    <AppShell {...chrome('district', 'Approvals', <span>Approvals · St. Aidan’s</span>)}>
      <PageHeader
        crumb="Reviewing a join request"
        title="St. Aidan’s — review"
        sub="Requested today · Primary school"
      />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.School />} title="School details" />
          <CardBody>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <KV label="Registrant">h.begum@staidans.sch</KV>
              <KV label="Students (roster)">310</KV>
            </div>
            <Banner tone="info" icon={<Icon.Alert />}>
              Approving arms a whole-school Premium trial from first check-in.
            </Banner>
            <div className="flex gap-2.5">
              <Button variant="ink" icon={<Icon.Check />}>Approve</Button>
              <Button variant="danger" icon={<Icon.X />}>Reject</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
