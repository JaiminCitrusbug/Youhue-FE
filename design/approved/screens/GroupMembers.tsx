/** SC-032 — Group members · FR-09-03. Add/remove members from a watchlist. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Table, PersonCell, Button, Icon } from '../components'

export function GroupMembers() {
  return (
    <AppShell {...chrome('teacher', 'Groups', <>Groups / Year 5 watchlist</>)}>
      <PageHeader
        crumb="Groups / Year 5 watchlist"
        title="Group members"
        sub="3 students"
        right={<Button variant="ghost" icon={<Icon.Plus />}>Add student</Button>}
      />

      <Card>
        <CardHeader icon={<Icon.Users />} title="Members — Year 5 watchlist" />
        <CardBody flush>
          <Table
            head={['Student', <span className="block text-right">Action</span>]}
            rows={[
              [
                <PersonCell initials="LO" name="Liam O." sub="Year 5 — Maple" />,
                <div className="flex justify-end"><Button variant="ghost" icon={<Icon.Trash />}>Remove</Button></div>,
              ],
              [
                <PersonCell initials="ZM" name="Zara M." sub="Year 5 — Maple" />,
                <div className="flex justify-end"><Button variant="ghost" icon={<Icon.Trash />}>Remove</Button></div>,
              ],
              [
                <PersonCell initials="ML" name="Mia L." sub="Year 5 — Maple" />,
                <div className="flex justify-end"><Button variant="ghost" icon={<Icon.Trash />}>Remove</Button></div>,
              ],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
