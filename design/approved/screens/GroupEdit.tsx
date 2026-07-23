/** SC-031 — Create / edit group · FR-09-01. Name + type, then add students. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Select, Button, Icon } from '../components'

export function GroupEdit() {
  return (
    <AppShell {...chrome('teacher', 'Groups', <>Groups / New group</>)}>
      <PageHeader crumb="Groups / New" title="Create a group" />

      <div className="max-w-[560px]">
        <Card>
          <CardHeader icon={<Icon.Layers />} title="New group" />
          <CardBody>
            <Field label="Name"><Input defaultValue="Year 5 watchlist" /></Field>
            <Field label="Type">
              <Select defaultValue="Watchlist">
                <option>Watchlist</option>
                <option>Custom</option>
              </Select>
            </Field>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ink" icon={<Icon.Plus />}>Add students</Button>
              <Button variant="ghost">Save</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
