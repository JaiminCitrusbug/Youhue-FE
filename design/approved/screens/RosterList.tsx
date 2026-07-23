/** SC-037 — Roster · FR-03-05. Presentational only. Status is icon + label + colour, never colour alone. */
import { AppShell, chrome, PageHeader, Card, CardBody, Table, PersonCell, Tag, Button, Icon } from '../components'

export function RosterList() {
  return (
    <AppShell {...chrome('teacher', 'Roster', <>Teacher / Roster</>)}>
      <PageHeader
        crumb="Roster"
        title="Students"
        sub="Year 5 — Maple · 28 active"
        right={<Button variant="ghost" icon={<Icon.Upload />}>Re-import</Button>}
      />

      <Card>
        <CardBody flush>
          <Table
            head={['Name', 'Age band', 'Status']}
            rows={[
              [<PersonCell initials="AK" name="Aisha K." />, <>8–11</>, <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>],
              [<PersonCell initials="LO" name="Liam O." />, <>8–11</>, <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>],
              [<PersonCell initials="SD" name="Sam D." />, <>8–11</>, <Tag tone="mut" icon={<Icon.Minus />}>Inactive — left</Tag>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
