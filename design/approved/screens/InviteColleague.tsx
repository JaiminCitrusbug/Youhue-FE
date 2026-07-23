/**
 * SC-059 — Invite a colleague (in-app)  ·  FR-02-03  ·  US-02-03
 * Presentational only. Scoped to a class you already share; single-use expiring token.
 */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Select,
  Table, Tag, Button, Icon,
} from '../components'

export function InviteColleague() {
  return (
    <AppShell {...chrome('teacher', 'Roster', <><a href="#">Staff</a> &nbsp;/&nbsp; Invite colleague</>)}>
      <PageHeader
        crumb="Share a class with a trusted colleague"
        title="Invite a colleague"
        sub="Scoped to a class you already share"
      />

      <Card className="mb-4 max-w-[600px]">
        <CardHeader icon={<Icon.Send />} title="Send an invitation" />
        <CardBody>
          <Field label="Email">
            <Input type="email" defaultValue="colleague@maple-primary.sch.uk" />
          </Field>
          <Field label="Shared class">
            <Select defaultValue="y5-maple">
              <option value="y5-maple">Year 5 — Maple</option>
            </Select>
          </Field>
          <Button variant="ink" icon={<Icon.Send />}>Send invite</Button>
        </CardBody>
      </Card>

      <Card className="max-w-[760px]">
        <CardHeader icon={<Icon.Clock />} title="Pending invitations" hint="single-use, expiring links" />
        <CardBody flush>
          <Table
            head={['Email', 'Class', 'Status', 'Action']}
            rows={[
              [
                <>t.ali@maple-primary.sch.uk</>,
                <>Year 5 — Maple</>,
                <Tag tone="warn" icon={<Icon.Clock />}>Invited</Tag>,
                <span className="flex items-center gap-2.5 text-[12px] font-semibold text-coral-600">
                  <button>Resend</button>
                  <span className="text-neutral-300">·</span>
                  <button>Revoke</button>
                </span>,
              ],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
