/** SC-057 — Staff management · FR-16-02. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, Button, Card, CardHeader, CardBody,
  Table, PersonCell, Tag, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Staff</span>

export function StaffManagement() {
  return (
    <AppShell {...chrome('leadership', 'Staff', crumb)}>
      <PageHeader
        crumb="Colleague accounts & the FR-02-04 invite lifecycle"
        title="Staff management"
        sub="3 accounts · 2 active · 1 invited"
        right={<Button variant="ink" icon={<Icon.Plus />}>Invite colleague</Button>}
      />

      <Card>
        <CardHeader icon={<Icon.Users />} title="Staff" hint="Active → Invited → Deactivated" />
        <CardBody flush>
          <Table
            head={['Name', 'Role', 'Status', 'Action']}
            rows={[
              [
                <PersonCell initials="RO" name="R. Okafor" sub="okafor@oakfield.sch" />,
                <>Teacher</>,
                <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>,
                <Button variant="ghost">Deactivate</Button>,
              ],
              [
                <PersonCell initials="JM" name="J. Mensah" sub="mensah@oakfield.sch" />,
                <>Pastoral lead</>,
                <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>,
                <Button variant="ghost">Deactivate</Button>,
              ],
              [
                <PersonCell initials="TA" name="T. Ali" sub="ali@oakfield.sch" />,
                <>Teacher</>,
                <Tag tone="warn" icon={<Icon.Clock />}>Invited</Tag>,
                <Button variant="ghost" icon={<Icon.Bell />}>Resend</Button>,
              ],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
